// Firebase Configuration Manager
// This file helps debug Firebase configuration issues

export const getFirebaseConfig = () => {
  const config = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };

  // Check if any required values are missing
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = required.filter(key => !config[key]);
  
  return {
    config,
    isValid: missing.length === 0,
    missing,
    hasAllRequired: required.every(key => config[key])
  };
};

export const validateFirebaseConfig = () => {
  const { config, isValid, missing } = getFirebaseConfig();
  
  console.log('🔍 Firebase Configuration Check:');
  console.log('================================');
  console.log('✅ Valid:', isValid);
  console.log('❌ Missing:', missing);
  console.log('📋 Full Config:', config);
  
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
  }
  
  return { config, isValid, missing };
};

export const getFirebaseConsoleUrl = (projectId) => {
  return `https://console.firebase.google.com/project/${projectId}/authentication/templates`;
};

export const getEmailVerificationTroubleshootingSteps = () => {
  return [
    '1. Check Firebase Console > Authentication > Templates > Email verification',
    '2. Ensure "Email verification" template is enabled',
    '3. Verify sender email is configured and verified',
    '4. Check that your domain is authorized',
    '5. Ensure Firebase project has billing enabled',
    '6. Check spam/junk folder for verification emails',
    '7. Try with a different email address',
    '8. Check browser console for error messages',
    '9. Verify Firebase project is not in test mode',
    '10. Check rate limiting settings'
  ];
};
