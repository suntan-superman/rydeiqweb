import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
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

// Register new user with user type
export const registerUser = async ({ email, password, firstName, lastName, userType = USER_TYPES.PASSENGER }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

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

    // Create user document in Firestore
    const userData = {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      role: role,
      userType: userType,
      createdAt: new Date().toISOString(),
      emailVerified: false,
      preferences: {
        notifications: true,
        darkMode: false,
        language: 'en',
      },
    };

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

    await setDoc(doc(db, 'users', user.uid), userData);

    // Send email verification
    await sendEmailVerification(user);

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
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
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
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return {
        success: true,
        data: userDoc.data(),
      };
    } else {
      return {
        success: false,
        error: { message: 'User document not found' },
      };
    }
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