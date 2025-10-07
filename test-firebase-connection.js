// Simple test script to check Firebase connection and create fare config
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCAiGgj7WGUntSHs4PmAS1GB4UzqR4MrOU",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "rydeiq-8b8b8.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "rydeiq-8b8b8",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "rydeiq-8b8b8.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Test reading from appConfig/fareRules
    const configRef = doc(db, 'appConfig', 'fareRules');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      console.log('✅ Fare configuration document exists');
      console.log('📄 Data:', configDoc.data());
    } else {
      console.log('❌ Fare configuration document does not exist');
      console.log('🔧 Creating fare configuration document...');
      
      const fareConfig = {
        minimumFare: 5.00,
        maximumFarePerMile: 7.50,
        baseFare: 2.50,
        perMileRate: 2.25,
        perMinuteRate: 0.25,
        lastUpdated: new Date(),
        createdBy: 'system',
        version: '1.0.0'
      };
      
      await setDoc(configRef, fareConfig);
      console.log('✅ Fare configuration document created successfully');
    }
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    console.error('Error details:', error.message);
  }
}

testFirebaseConnection();
