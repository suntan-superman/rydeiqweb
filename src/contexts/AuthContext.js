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

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userData = await getUserData(firebaseUser.uid);
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            emailVerified: firebaseUser.emailVerified,
            photoURL: firebaseUser.photoURL,
            ...(userData.success ? userData.data : {}),
          });
        } else {
          setUser(null);
        }
      } catch (error) {
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