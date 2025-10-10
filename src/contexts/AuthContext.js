import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, getUserData } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cache busting - force reload of latest code
  console.log('AuthContext version:', Date.now());

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('Auth state changed - Firebase user:', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified
          });

          // CRITICAL: Check email verification first
          // Only allow verified users or those in development mode
          if (!firebaseUser.emailVerified && process.env.NODE_ENV === 'production') {
            console.warn('⚠️ User not verified, denying access:', firebaseUser.email);
            setUser(null);
            setLoading(false);
            return;
          }

          // Get additional user data from Firestore first
          const userData = await getUserData(firebaseUser.uid);
          
          if (userData.success) {
            const userDoc = userData.data;
            console.log('User data from Firestore:', userDoc);
            
            console.log('Setting user in AuthContext - emailVerified:', firebaseUser.emailVerified);

            // Set the user with combined data
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              emailVerified: firebaseUser.emailVerified,
              photoURL: firebaseUser.photoURL,
              ...userDoc,
            });
          } else {
            console.log('Failed to get user data from Firestore:', userData.error);
            // If we can't get user data, still allow login but with basic info (only if verified)
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              emailVerified: firebaseUser.emailVerified,
              photoURL: firebaseUser.photoURL,
            });
          }
        } else {
          console.log('No Firebase user - setting user to null');
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError(error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    setUser,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 