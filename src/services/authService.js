import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  onAuthStateChanged,
  deleteUser,
  reload,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// User roles constants
export const USER_ROLES = {
  CUSTOMER: 'customer',
  DRIVER: 'driver',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// User types for registration
export const USER_TYPES = {
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  ADMINISTRATOR: 'administrator'
};

// Get the appropriate redirect path based on user role and status
export const getRedirectPath = (user) => {
  if (!user) return '/login';
  
  console.log('getRedirectPath: User data:', {
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    onboardingCompleted: user.onboardingCompleted
  });
  
  // Note: Email verification is already checked in loginUser function
  // Users reaching this point should already be verified
  
  // Role-based redirection
  switch (user.role) {
    case USER_ROLES.DRIVER:
      // Check if driver has completed onboarding
      if (user.onboardingCompleted) {
        console.log('getRedirectPath: Driver with completed onboarding -> /driver-dashboard');
        return '/driver-dashboard';
      } else {
        console.log('getRedirectPath: Driver with incomplete onboarding -> /driver-onboarding');
        return '/driver-onboarding';
      }
      
    case USER_ROLES.ADMIN:
    case USER_ROLES.SUPER_ADMIN:
      // Only specific emails should go to admin dashboard
      if (user.email === 'sroy@worksidesoftware.com') {
        console.log('getRedirectPath: Super admin -> /admin-dashboard');
        return '/admin-dashboard';
      } else {
        console.log('getRedirectPath: Admin -> /dashboard');
        return '/dashboard';
      }
      
    case USER_ROLES.CUSTOMER:
    default:
      // Check if customer/rider has completed onboarding
      if (!user.onboardingCompleted) {
        console.log('getRedirectPath: Customer with incomplete onboarding -> /rider-onboarding');
        return '/rider-onboarding';
      }
      console.log('getRedirectPath: Customer -> /dashboard');
      return '/dashboard';
  }
};

// Check if user exists in Firebase Auth
export const checkUserExistsInAuth = async (email, currentUser) => {
  try {
    // Try to sign in with the email to see if it exists
    // This is a workaround since Firebase doesn't provide a direct way to check email existence
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    
    // Create a temporary password to test
    const tempPassword = 'TempPassword123!';
    
    try {
      // Try to sign in - if this fails with user-not-found, the email doesn't exist
      await signInWithEmailAndPassword(auth, email, tempPassword);
      // If we get here, the user exists but we used wrong password
      return { exists: true, error: null };
    } catch (error) {
      console.log('User existence check error:', error.code);
      if (error.code === 'auth/user-not-found') {
        return { exists: false, error: null };
      } else if (error.code === 'auth/wrong-password') {
        // User exists but wrong password - this means email is taken
        return { exists: true, error: null };
      } else {
        // For any other error, assume user doesn't exist and continue with registration
        console.log('Assuming user does not exist due to error:', error.code);
        return { exists: false, error: null };
      }
    }
  } catch (error) {
    console.error('Error checking user existence:', error);
    // For any unexpected error, assume user doesn't exist and continue with registration
    return { exists: false, error: null };
  }
};

// Register new user with user type
export const registerUser = async ({ email, password, firstName, lastName, phone, userType = USER_TYPES.PASSENGER, city }) => {
  try {
    console.log('Starting user registration with data:', { email, firstName, lastName, phone, userType, city });
    
    // Check if user already exists
    const userCheck = await checkUserExistsInAuth(email);
    if (userCheck.exists) {
      console.log('User already exists in Firebase Auth');
      return {
        success: false,
        error: {
          code: 'auth/email-already-in-use',
          message: 'An account with this email already exists. Please try signing in instead.',
          details: 'User already exists in Firebase Auth'
        }
      };
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Firebase user created successfully:', user.uid);

    // Determine role based on user type
    let role = USER_ROLES.CUSTOMER;
    if (userType === USER_TYPES.DRIVER) {
      role = USER_ROLES.DRIVER;
    } else if (userType === USER_TYPES.ADMINISTRATOR) {
      // Administrators start as pending and need approval
      role = USER_ROLES.CUSTOMER; // Default role until approved
    }

    // Update user profile with name
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
    });
    
    console.log('User profile updated successfully');

    // Create user document in Firestore
    const userData = {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: phone || '',
      role: role,
      userType: userType,
      createdAt: new Date().toISOString(),
      emailVerified: false,
      onboardingCompleted: false,
      onboardingStep: 'welcome',
      preferences: {
        notifications: true,
        darkMode: false,
        language: 'en',
      },
    };

    // Add city for drivers
    if (userType === USER_TYPES.DRIVER && city) {
      userData.city = city;
    }

    // Add admin-specific fields for administrators
    if (userType === USER_TYPES.ADMINISTRATOR) {
      userData.adminStatus = {
        requested: true,
        requestedAt: new Date().toISOString(),
        approved: false,
        approvedAt: null,
        approvedBy: null,
        notes: ''
      };
    }

    console.log('Creating Firestore document with data:', userData);
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('Firestore document created successfully');

    // Send email verification
    await sendEmailVerification(user);
    console.log('Email verification sent successfully');

    // IMPORTANT: Sign out the user immediately after registration to prevent automatic login
    await signOut(auth);
    console.log('User signed out after registration');

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        role: role,
        userType: userType,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error
      }
    };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Refresh the user's email verification status to get the latest state
    const refreshResult = await refreshUserEmailVerification(user);
    const isEmailVerified = refreshResult.success ? refreshResult.emailVerified : user.emailVerified;

    // Check if email is verified - users must verify email before logging in
    if (!isEmailVerified) {
      // Sign out the user immediately since they shouldn't be logged in
      await signOut(auth);
      return {
        success: false,
        error: {
          code: 'auth/email-not-verified',
          message: 'Please verify your email address before signing in. Check your inbox for a verification link.',
        },
      };
    }

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    // Fix existing user records that don't have a role field
    if (userData && !userData.role) {
      console.log(`🔧 Fixing user record for ${email} - adding missing role field`);
      
      // Determine role based on userType or default to customer
      let defaultRole = USER_ROLES.CUSTOMER;
      if (userData.userType === USER_TYPES.DRIVER) {
        defaultRole = USER_ROLES.DRIVER;
      } else if (userData.userType === USER_TYPES.ADMINISTRATOR) {
        defaultRole = USER_ROLES.CUSTOMER; // Administrators start as customer until approved
      }
      
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          role: defaultRole,
          updatedAt: new Date().toISOString(),
        });
        
        // Update userData with the new role
        userData.role = defaultRole;
        console.log(`✅ User ${email} role fixed to: ${defaultRole}`);
      } catch (fixError) {
        console.warn('Failed to fix user role:', fixError);
      }
    }

    // Auto-promote to super admin for testing (development mode only)
    // Only auto-promote specific test emails to avoid unwanted promotions
    const testEmails = ['sroy@worksidesoftware.com', 'admin@test.com'];
    if (process.env.NODE_ENV === 'development' && 
        userData && 
        userData.role !== USER_ROLES.SUPER_ADMIN &&
        testEmails.includes(email)) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          role: USER_ROLES.SUPER_ADMIN,
          updatedAt: new Date().toISOString(),
        });
        
        console.log(`🔧 Development Mode: User ${email} automatically promoted to Super Admin`);
        
        // Update userData with new role
        userData.role = USER_ROLES.SUPER_ADMIN;
      } catch (promotionError) {
        console.warn('Failed to auto-promote user to super admin:', promotionError);
      }
    }

    console.log('loginUser: Final user object being returned:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: isEmailVerified,
      ...userData,
    });
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: isEmailVerified,
        ...userData,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Refresh user's email verification status
export const refreshUserEmailVerification = async (user) => {
  try {
    if (user) {
      await reload(user);
      // Get the updated user object
      const updatedUser = auth.currentUser;
      return {
        success: true,
        emailVerified: updatedUser?.emailVerified || false,
      };
    }
    return {
      success: false,
      error: {
        code: 'auth/no-user',
        message: 'No user provided',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Check and refresh current user's email verification status
export const checkEmailVerification = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: {
          code: 'auth/no-user',
          message: 'No user is currently signed in',
        },
      };
    }

    const refreshResult = await refreshUserEmailVerification(currentUser);
    return refreshResult;
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Update user profile
export const updateUserProfile = async (updates) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Update Firebase Auth profile
    if (updates.displayName) {
      await updateProfile(user, { displayName: updates.displayName });
    }

    // Update Firestore document
    await updateDoc(doc(db, 'users', user.uid), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get user data from Firestore
export const getUserData = async (uid) => {
  try {
    console.log('getUserData: Fetching user data for UID:', uid);
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('getUserData: User data retrieved:', userData);
      return {
        success: true,
        data: userData,
      };
    } else {
      console.log('getUserData: User document not found for UID:', uid);
      return {
        success: false,
        error: { message: 'User document not found' },
      };
    }
  } catch (error) {
    console.error('getUserData: Error fetching user data:', error);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Helper function to get user-friendly error messages
export const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No user found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/email-not-verified':
      return 'Please verify your email address before signing in. Check your inbox for a verification link.';
    default:
      return 'An error occurred. Please try again.';
  }
};

// Check if user has admin privileges
export const isAdmin = (user) => {
  return user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPER_ADMIN;
};

// Check if user has super admin privileges
export const isSuperAdmin = (user) => {
  return user?.role === USER_ROLES.SUPER_ADMIN;
};

// Check if user has specific role
export const hasRole = (user, role) => {
  return user?.role === role;
};

// Update user role (admin only)
export const updateUserRole = async (userId, newRole, currentUser) => {
  try {
    // Only admins can change roles
    if (!isAdmin(currentUser)) {
      throw new Error('Insufficient permissions to update user roles');
    }

    // Super admins can change any role, regular admins can only promote to customer/driver
    if (!isSuperAdmin(currentUser) && (newRole === USER_ROLES.ADMIN || newRole === USER_ROLES.SUPER_ADMIN)) {
      throw new Error('Insufficient permissions to grant admin privileges');
    }

    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Create admin user (super admin only)
export const createAdminUser = async ({ email, password, firstName, lastName }, currentUser) => {
  try {
    // Only super admins can create admin users
    if (!isSuperAdmin(currentUser)) {
      throw new Error('Only super admins can create admin users');
    }

    return await registerUser({
      email,
      password,
      firstName,
      lastName,
      userType: USER_TYPES.ADMINISTRATOR
    });
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Approve admin request (super admin only)
export const approveAdminRequest = async (userId, currentUser, notes = '') => {
  try {
    // Only super admins can approve admin requests
    if (!isSuperAdmin(currentUser)) {
      throw new Error('Only super admins can approve admin requests');
    }

    await updateDoc(doc(db, 'users', userId), {
      role: USER_ROLES.ADMIN,
      'adminStatus.approved': true,
      'adminStatus.approvedAt': new Date().toISOString(),
      'adminStatus.approvedBy': currentUser.uid,
      'adminStatus.notes': notes,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Reject admin request (super admin only)
export const rejectAdminRequest = async (userId, currentUser, reason = '') => {
  try {
    // Only super admins can reject admin requests
    if (!isSuperAdmin(currentUser)) {
      throw new Error('Only super admins can reject admin requests');
    }

    await updateDoc(doc(db, 'users', userId), {
      'adminStatus.approved': false,
      'adminStatus.rejectedAt': new Date().toISOString(),
      'adminStatus.rejectedBy': currentUser.uid,
      'adminStatus.rejectionReason': reason,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Get pending admin requests
export const getPendingAdminRequests = async (currentUser) => {
  try {
    // Only super admins can view admin requests
    if (!isSuperAdmin(currentUser)) {
      throw new Error('Only super admins can view admin requests');
    }

    const q = query(
      collection(db, 'users'),
      where('userType', '==', USER_TYPES.ADMINISTRATOR),
      where('adminStatus.requested', '==', true),
      where('adminStatus.approved', '==', false)
    );

    const snapshot = await getDocs(q);
    const requests = [];

    snapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, data: requests };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Temporary function to promote user to super admin (for testing)
export const promoteToSuperAdmin = async (email) => {
  try {
    // Find user by email
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('User not found');
    }
    
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    
    // Update user role to super_admin
    await updateDoc(doc(db, 'users', userId), {
      role: USER_ROLES.SUPER_ADMIN,
      updatedAt: new Date().toISOString(),
    });
    
    console.log(`User ${email} promoted to super admin successfully`);
    return { success: true };
  } catch (error) {
    console.error('Error promoting user to super admin:', error);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Fix user role for existing users (utility function)
export const fixUserRole = async (email, newRole) => {
  try {
    // Find user by email
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('User not found');
    }
    
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    // Update user role
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date().toISOString(),
    });
    
    console.log(`User ${email} role updated to ${newRole} successfully`);
    return { 
      success: true, 
      previousRole: userData.role || 'none',
      newRole: newRole 
    };
  } catch (error) {
    console.error('Error fixing user role:', error);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Check if current user can access admin functions
export const canAccessAdmin = (user) => {
  return isAdmin(user) || isSuperAdmin(user);
};

// Get role display name
export const getRoleDisplayName = (role) => {
  switch (role) {
    case USER_ROLES.CUSTOMER:
      return 'Customer';
    case USER_ROLES.DRIVER:
      return 'Driver';
    case USER_ROLES.ADMIN:
      return 'Admin';
    case USER_ROLES.SUPER_ADMIN:
      return 'Super Admin';
    default:
      return 'Unknown';
  }
};

// Delete user completely (Firebase Auth + Firestore)
export const deleteUserCompletely = async (email, currentUser) => {
  try {
    // Only super admins can delete users
    if (!isSuperAdmin(currentUser)) {
      throw new Error('Only super admins can delete users');
    }

    // Find user by email in Firestore
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('User not found in Firestore');
    }
    
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    
    console.log(`🗑️ Deleting user: ${email} (UID: ${userId})`);
    
    // Delete from Firestore collections
    const collectionsToDelete = ['users', 'driverApplications'];
    
    for (const collectionName of collectionsToDelete) {
      try {
        await deleteDoc(doc(db, collectionName, userId));
        console.log(`✅ Deleted from ${collectionName} collection`);
      } catch (error) {
        console.warn(`⚠️ Could not delete from ${collectionName}:`, error.message);
      }
    }
    
    // Note: Firebase Auth user deletion requires the user to be signed in
    // This is a limitation of Firebase Auth - we can't delete users programmatically
    // without them being authenticated
    
    console.log(`✅ User ${email} deleted from Firestore successfully`);
    console.log(`⚠️ Note: User may still exist in Firebase Authentication`);
    console.log(`💡 To delete from Firebase Auth, the user must sign in and call deleteUser()`);
    
    return { 
      success: true, 
      message: 'User deleted from Firestore. Firebase Auth deletion requires user authentication.',
      userId: userId
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Delete current user (requires user to be signed in)
export const deleteCurrentUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    const userId = user.uid;
    const email = user.email;
    
    console.log(`🗑️ Current user deleting themselves: ${email} (UID: ${userId})`);
    
    // Delete from Firestore collections
    const collectionsToDelete = ['users', 'driverApplications'];
    
    for (const collectionName of collectionsToDelete) {
      try {
        await deleteDoc(doc(db, collectionName, userId));
        console.log(`✅ Deleted from ${collectionName} collection`);
      } catch (error) {
        console.warn(`⚠️ Could not delete from ${collectionName}:`, error.message);
      }
    }
    
    // Delete from Firebase Authentication
    await deleteUser(user);
    console.log(`✅ User ${email} deleted from Firebase Authentication`);
    
    return { 
      success: true, 
      message: 'User account deleted successfully from both Firestore and Firebase Authentication'
    };
  } catch (error) {
    console.error('Error deleting current user:', error);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
}; 