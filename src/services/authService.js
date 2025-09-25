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
  SUPER_ADMIN: 'super_admin',
  HEALTHCARE_PROVIDER: 'healthcare_provider'
};

// User types for registration
export const USER_TYPES = {
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  ADMINISTRATOR: 'administrator',
  HEALTHCARE_PROVIDER: 'healthcare_provider'
};

// Get the appropriate redirect path based on user role and status
export const getRedirectPath = (user) => {
  if (!user) return '/login';
  
  console.log('getRedirectPath: User data:', {
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    onboardingCompleted: user.onboardingCompleted,
    userTypes: user.userTypes,
    activeUserType: user.activeUserType
  });
  
  // Note: Email verification is already checked in loginUser function
  // Users reaching this point should already be verified
  
  // Check if user has multiple user types - if so, let SmartRedirect handle it
  const userTypes = user.userTypes || [user.userType];
  if (userTypes.length > 1) {
    console.log('getRedirectPath: User has multiple types, using SmartRedirect');
    return '/smart-redirect';
  }
  
  // Single user type - check onboarding and redirect accordingly
  const currentUserType = user.activeUserType || user.userType;
  
  // Super admin goes to admin dashboard
  if (user.role === USER_ROLES.SUPER_ADMIN && user.email === 'sroy@worksidesoftware.com') {
    console.log('getRedirectPath: Super admin -> /admin-dashboard');
    return '/admin-dashboard';
  }
  
  // Healthcare providers go to medical portal
  if (user.role === USER_ROLES.HEALTHCARE_PROVIDER) {
    console.log('getRedirectPath: Healthcare provider -> /medical-portal');
    return '/medical-portal';
  }
  
  // For drivers, check onboarding status
  if (currentUserType === USER_TYPES.DRIVER) {
    if (!user.onboardingCompleted) {
      console.log('getRedirectPath: Driver with incomplete onboarding -> /driver-onboarding');
      return '/driver-onboarding';
    } else {
      console.log('getRedirectPath: Driver with completed onboarding -> /driver-dashboard');
      return '/driver-dashboard';
    }
  }
  
  // For riders, check if they have complete onboarding
  if (currentUserType === USER_TYPES.PASSENGER) {
    // Check for complete onboarding requirements
    const hasBasicProfile = user.firstName && user.lastName && user.emergencyContact?.name;
    const hasProfilePicture = !!user.profilePicture;
    const hasPaymentMethod = !!(user.paymentMethod && user.paymentMethod.type);
    const hasTermsAccepted = !!user.termsAccepted;
    const hasOnboardingComplete = !!user.onboardingComplete;
    
    const isFullyOnboarded = hasBasicProfile && hasProfilePicture && hasPaymentMethod && hasTermsAccepted && hasOnboardingComplete;
    
    if (!isFullyOnboarded) {
      console.log('getRedirectPath: Rider with incomplete onboarding -> /onboarding');
      return '/onboarding';
    } else {
      console.log('getRedirectPath: Rider with complete onboarding -> /dashboard');
      return '/dashboard';
    }
  }
  
  // All other users go to unified dashboard
  console.log('getRedirectPath: User -> /dashboard (unified)');
  return '/dashboard';
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
      console.log('✅ User exists in Firebase Auth');
      return { exists: true, error: null };
    } catch (error) {
      console.log('User existence check error:', error.code);
      if (error.code === 'auth/user-not-found') {
        console.log('✅ User does not exist - safe to register');
        return { exists: false, error: null };
      } else if (error.code === 'auth/wrong-password') {
        // User exists but wrong password - this means email is taken
        console.log('⚠️ User exists but wrong password - email is taken');
        return { exists: true, error: null };
      } else if (error.code === 'auth/invalid-credential') {
        // This might indicate the user exists but is in a weird state
        console.log('⚠️ Invalid credential - user might exist in weird state');
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

// Force delete user from Firebase Auth (for debugging purposes)
export const forceDeleteUser = async (email, password) => {
  try {
    console.log('🗑️ Attempting to force delete user:', email);
    
    // First, try to sign in with the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ User signed in successfully, deleting user:', user.uid);
    
    // Delete the user
    await user.delete();
    
    console.log('✅ User deleted successfully');
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('❌ Failed to delete user:', error);
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Force registration without user existence check (for debugging purposes)
export const forceRegisterUser = async ({ email, password, firstName, lastName, userType = USER_TYPES.PASSENGER, city, emergencyContactName, emergencyContactPhone, emergencyContactRelationship, emergencyContactEmail }) => {
  try {
    console.log('🚀 Force registering user (bypassing existence check):', { email, firstName, lastName, userType, city });
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Firebase user created successfully:', user.uid);

    // Determine role based on user type
    let role = USER_ROLES.CUSTOMER;
    if (userType === USER_TYPES.DRIVER) {
      role = USER_ROLES.DRIVER;
    } else if (userType === USER_TYPES.ADMINISTRATOR) {
      role = USER_ROLES.ADMINISTRATOR;
    } else if (userType === USER_TYPES.HEALTHCARE_PROVIDER) {
      role = USER_ROLES.HEALTHCARE_PROVIDER;
    }

    // Update user profile
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
    });

    // Create user document in Firestore
    const userData = {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      displayName: user.displayName,
      emailVerified: false,
      preferences: {
        notifications: true,
        darkMode: false,
        language: 'en',
      },
      // Emergency contact information
      emergencyContact: {
        name: emergencyContactName || '',
        phone: emergencyContactPhone || '',
        relationship: emergencyContactRelationship || '',
        email: emergencyContactEmail || ''
      }
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

    // Add healthcare provider-specific fields
    if (userType === USER_TYPES.HEALTHCARE_PROVIDER) {
      userData.healthcareProvider = {
        organizationName: '',
        facilityType: '',
        nemtEnabled: true,
        hipaaCompliant: true,
        verificationStatus: 'pending',
        requestedAt: new Date().toISOString(),
        verifiedAt: null,
        verifiedBy: null,
        certifications: [],
        billingInfo: {
          taxId: '',
          billingAddress: {},
          preferredInvoiceFormat: 'detailed'
        }
      };
    }

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('User data saved to Firestore successfully');

    // Send email verification
    try {
      console.log('📧 Sending email verification...');
      await sendEmailVerification(user, {
        url: `${window.location.origin}/email-verified`,
        handleCodeInApp: true
      });
      console.log('✅ Email verification sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send email verification:', emailError);
      // Don't fail registration if email verification fails
    }

    return {
      success: true,
      data: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        role: role,
        userType: userType,
      },
    };
  } catch (error) {
    console.error('Force registration error:', error);
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

// Add new user type to existing account
export const addUserTypeToAccount = async ({ user, userType, city, emergencyContactName, emergencyContactPhone, emergencyContactRelationship, emergencyContactEmail }) => {
  try {
    console.log(`➕ Adding ${userType} profile to existing account`);
    
    // Check if user already has this user type
    if (user.userTypes && user.userTypes.includes(userType)) {
      return {
        success: false,
        error: {
          code: 'auth/user-type-exists',
          message: `You already have a ${userType} profile.`
        }
      };
    }
    
    // Determine role based on user type
    let role = USER_ROLES.CUSTOMER;
    if (userType === USER_TYPES.DRIVER) {
      role = USER_ROLES.DRIVER;
    } else if (userType === USER_TYPES.ADMINISTRATOR) {
      role = USER_ROLES.ADMINISTRATOR;
    } else if (userType === USER_TYPES.HEALTHCARE_PROVIDER) {
      role = USER_ROLES.HEALTHCARE_PROVIDER;
    }
    
    // Prepare update data
    const updatedUserTypes = [...(user.userTypes || [user.userType]), userType];
    const updatedData = {
      userTypes: updatedUserTypes,
      activeUserType: userType,
      role: role,
      userType: userType
    };
    
    // Add user type specific data
    if (userType === USER_TYPES.DRIVER && city) {
      updatedData.city = city;
    }
    
    // Add emergency contact data
    if (emergencyContactName || emergencyContactPhone || emergencyContactRelationship || emergencyContactEmail) {
      updatedData.emergencyContact = {
        name: emergencyContactName || user.emergencyContact?.name || '',
        phone: emergencyContactPhone || user.emergencyContact?.phone || '',
        relationship: emergencyContactRelationship || user.emergencyContact?.relationship || '',
        email: emergencyContactEmail || user.emergencyContact?.email || ''
      };
    }
    
    // Update Firestore document
    await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
    
    // Update user in context
    const updatedUser = {
      ...user,
      ...updatedData
    };
    
    return {
      success: true,
      data: updatedUser,
      message: `Successfully added ${userType} profile to your account!`
    };
  } catch (error) {
    console.error('Error adding user type:', error);
    return {
      success: false,
      error: {
        code: 'auth/add-user-type-failed',
        message: 'Failed to add user type. Please try again.'
      }
    };
  }
};

// Switch user type for existing user
export const switchUserType = async (user, newUserType) => {
  try {
    console.log(`🔄 Switching user type from ${user.userType} to ${newUserType}`);
    
    // Check if user has this user type
    if (!user.userTypes || !user.userTypes.includes(newUserType)) {
      return {
        success: false,
        error: {
          code: 'auth/user-type-not-found',
          message: `You don't have a ${newUserType} profile. Please register as a ${newUserType} first.`
        }
      };
    }
    
    // Update user data in Firestore
    const updatedData = {
      activeUserType: newUserType,
      userType: newUserType,
      role: newUserType === USER_TYPES.DRIVER ? USER_ROLES.DRIVER : 
            newUserType === USER_TYPES.ADMINISTRATOR ? USER_ROLES.ADMINISTRATOR :
            newUserType === USER_TYPES.HEALTHCARE_PROVIDER ? USER_ROLES.HEALTHCARE_PROVIDER :
            USER_ROLES.CUSTOMER
    };
    
    await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
    
    // Update user in context
    const updatedUser = {
      ...user,
      ...updatedData
    };
    
    return {
      success: true,
      data: updatedUser,
      message: `Switched to ${newUserType} profile successfully!`
    };
  } catch (error) {
    console.error('Error switching user type:', error);
    return {
      success: false,
      error: {
        code: 'auth/switch-failed',
        message: 'Failed to switch user type. Please try again.'
      }
    };
  }
};

// Register new user with user type
export const registerUser = async ({ email, password, firstName, lastName, phone, userType = USER_TYPES.PASSENGER, city, emergencyContactName, emergencyContactPhone, emergencyContactRelationship, emergencyContactEmail }) => {
  try {
    console.log('Starting user registration with data:', { email, firstName, lastName, userType, city });
    
    // Try to create the user directly - Firebase will tell us if email already exists
    let user, userCredential;
    
    try {
      console.log('🔄 Attempting to create user with email:', email);
      console.log('🔄 User type:', userType);
      console.log('🔄 Firebase auth state before creation:', auth.currentUser?.email);
      
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      console.log('✅ User created successfully:', user.uid);
    } catch (createError) {
      console.log('❌ User creation failed with error:', createError);
      console.log('❌ Error code:', createError.code);
      console.log('❌ Error message:', createError.message);
      
      if (createError.code === 'auth/email-already-in-use') {
        // User already exists - guide them to sign in
        console.log('⚠️ Email already in use - returning error');
        return {
          success: false,
          error: {
            code: 'auth/email-already-in-use',
            message: `An account with this email already exists. If you want to add a ${userType} profile to your existing account, please sign in first and then add the new profile from your dashboard.`
          }
        };
      } else {
        // Other errors (weak password, invalid email, etc.)
        console.log('❌ Other error - rethrowing:', createError.code);
        throw createError;
      }
    }

    // Determine role based on user type
    let role = USER_ROLES.CUSTOMER;
    if (userType === USER_TYPES.DRIVER) {
      role = USER_ROLES.DRIVER;
    } else if (userType === USER_TYPES.ADMINISTRATOR) {
      // Administrators start as pending and need approval
      role = USER_ROLES.CUSTOMER; // Default role until approved
    } else if (userType === USER_TYPES.HEALTHCARE_PROVIDER) {
      role = USER_ROLES.HEALTHCARE_PROVIDER;
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
      phone: phone || '', // Add phone number to user data
      displayName: `${firstName} ${lastName}`,
      role: role,
      userType: userType,
      // Support multiple user types for the same email
      userTypes: [userType], // Array of user types this email is registered for
      activeUserType: userType, // Currently active user type
      createdAt: new Date().toISOString(),
      emailVerified: false,
      preferences: {
        notifications: true,
        darkMode: false,
        language: 'en',
      },
      // Emergency contact information
      emergencyContact: {
        name: emergencyContactName || '',
        phone: emergencyContactPhone || '',
        relationship: emergencyContactRelationship || '',
        email: emergencyContactEmail || ''
      }
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

    // Add healthcare provider-specific fields
    if (userType === USER_TYPES.HEALTHCARE_PROVIDER) {
      userData.healthcareProvider = {
        organizationName: '',
        facilityType: '',
        nemtEnabled: true,
        hipaaCompliant: true,
        verificationStatus: 'pending',
        requestedAt: new Date().toISOString(),
        verifiedAt: null,
        verifiedBy: null,
        certifications: [],
        billingInfo: {
          taxId: '',
          billingAddress: {},
          preferredInvoiceFormat: 'detailed'
        }
      };
    }

    console.log('Creating Firestore document with data:', userData);
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('Firestore document created successfully');

    // Send email verification
    try {
      console.log('📧 Attempting to send email verification to:', user.email);
      console.log('📧 User object:', { uid: user.uid, email: user.email, emailVerified: user.emailVerified });
      console.log('📧 Firebase auth current user:', auth.currentUser);
      console.log('📧 Auth domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
      console.log('📧 Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
      
      // Ensure we're using the current authenticated user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      if (currentUser.uid !== user.uid) {
        throw new Error('User ID mismatch between registration and auth');
      }
      
      console.log('📧 Sending verification email with current user:', {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified
      });
      
      await sendEmailVerification(currentUser, {
        url: `${window.location.origin}/email-verified`,
        handleCodeInApp: true
      });
      console.log('✅ Email verification sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send email verification:', emailError);
      console.error('❌ Email error details:', {
        code: emailError.code,
        message: emailError.message,
        stack: emailError.stack
      });
      
      // Don't fail the entire registration if email verification fails
      // The user can request a new verification email later
      console.warn('⚠️ Registration completed but email verification failed. User can request verification later.');
      
      // Show specific error message to help with debugging
      if (emailError.code === 'auth/too-many-requests') {
        console.warn('⚠️ Too many verification emails sent. Please wait before trying again.');
      } else if (emailError.code === 'auth/invalid-email') {
        console.warn('⚠️ Invalid email address provided.');
      } else if (emailError.code === 'auth/user-not-found') {
        console.warn('⚠️ User not found when trying to send verification email.');
      } else if (emailError.code === 'auth/network-request-failed') {
        console.warn('⚠️ Network error when sending verification email.');
      } else if (emailError.code === 'auth/operation-not-allowed') {
        console.warn('⚠️ Email verification is not enabled for this project.');
      }
    }

    // Keep user signed in after registration to allow email verification dialog to show
    console.log('✅ User registration completed successfully - keeping user signed in for email verification');

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
    
    // Handle specific Firebase errors with better messages
    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 Email already in use - this might be a Firebase caching issue');
      return {
        success: false,
        error: {
          code: error.code,
          message: 'This email is already registered. If you just deleted this user, please wait 2-3 minutes for Firebase to clear the cache, then try again.',
          details: 'Firebase caching issue - user was deleted but cache hasn\'t cleared yet'
        }
      };
    }
    
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

// Resend email verification
export const resendEmailVerification = async (user) => {
  try {
    console.log('📧 Resending email verification to:', user.email);
    console.log('📧 User object:', { uid: user.uid, email: user.email, emailVerified: user.emailVerified });
    console.log('📧 Firebase auth current user:', auth.currentUser);
    
    // Ensure we're using the current authenticated user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    if (currentUser.uid !== user.uid) {
      throw new Error('User ID mismatch between context and auth');
    }
    
    console.log('📧 Resending verification email with current user:', {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified
    });
    
    await sendEmailVerification(currentUser, {
      url: `${window.location.origin}/email-verified`,
      handleCodeInApp: true
    });
    console.log('✅ Email verification resent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to resend email verification:', error);
    console.error('❌ Resend error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore first
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    // Refresh the user's email verification status to get the latest state
    const refreshResult = await refreshUserEmailVerification(user);
    const isEmailVerified = refreshResult.success ? refreshResult.emailVerified : user.emailVerified;

    // Check if email is verified - users must verify email before logging in
    if (!isEmailVerified) {
      // Don't sign out the user - let them stay logged in to show verification dialog
      return {
        success: false,
        error: {
          code: 'auth/email-not-verified',
          message: 'Please verify your email address before signing in. Check your inbox for a verification link.',
        },
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          role: userData?.role || 'customer',
          userType: userData?.userType || 'passenger',
        },
      };
    }

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
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/email-not-verified':
      return 'Please verify your email address before signing in. Check your inbox for a verification link.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not allowed. Please contact support.';
    default:
      return 'Invalid email or password. Please check your credentials and try again.';
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
    case USER_ROLES.HEALTHCARE_PROVIDER:
      return 'Healthcare Provider';
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
    const collectionsToDelete = ['users', 'drivers'];
    
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
    const collectionsToDelete = ['users', 'drivers'];
    
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