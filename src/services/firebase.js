import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { validateFirebaseConfig } from '../utils/firebaseConfig';

// Validate Firebase configuration before initializing
const { config: firebaseConfig, isValid, missing } = validateFirebaseConfig();

if (!isValid) {
  console.error('🚨 FIREBASE CONFIGURATION ERROR:');
  console.error('Missing environment variables:', missing);
  console.error('');
  console.error('To fix this:');
  console.error('1. Create a .env file in your project root');
  console.error('2. Add the following variables:');
  missing.forEach(key => {
    console.error(`   REACT_APP_FIREBASE_${key.toUpperCase()}=your_value_here`);
  });
  console.error('');
  console.error('3. Get these values from Firebase Console > Project Settings > General');
  console.error('4. Restart your development server');
  console.error('');
  console.error('Without proper configuration, email verification will not work!');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Debug: Log Firebase initialization
console.log('🔥 Firebase initialized with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId
});

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only if we're in production
export const analytics = process.env.NODE_ENV === 'production' ? getAnalytics(app) : null;

export default app; 