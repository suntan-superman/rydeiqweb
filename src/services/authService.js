import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// User roles constants
export const USER_ROLES = {
  CUSTOMER: 'customer',
  DRIVER: 'driver',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Register new user
export const registerUser = async ({ email, password, firstName, lastName, role = USER_ROLES.CUSTOMER }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with name
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
    });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      role: role,
      createdAt: new Date().toISOString(),
      emailVerified: false,
      preferences: {
        notifications: true,
        darkMode: false,
        language: 'en',
      },
    });

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
      role: USER_ROLES.ADMIN
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