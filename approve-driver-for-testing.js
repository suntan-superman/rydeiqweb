// Script to approve a driver for testing
// Run this in the web app directory: node approve-driver-for-testing.js

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "ryde-9d4bf.firebaseapp.com",
  projectId: "ryde-9d4bf",
  storageBucket: "ryde-9d4bf.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function approveDriverForTesting(driverId) {
  try {
    console.log(`🔧 Approving driver ${driverId} for testing...`);
    
    const driverRef = doc(db, 'driverApplications', driverId);
    
    await updateDoc(driverRef, {
      'approvalStatus.status': 'approved',
      'approvalStatus.approvedAt': serverTimestamp(),
      'approvalStatus.approvedBy': 'admin',
      'approvalStatus.notes': 'Approved for testing purposes',
      'onboardingStatus.completed': true,
      'onboardingStatus.completedAt': serverTimestamp(),
      'onboardingStatus.completedBy': 'admin',
      'onboardingStatus.lastUpdated': serverTimestamp(),
      'updatedAt': serverTimestamp()
    });
    
    console.log('✅ Driver approved successfully!');
    console.log('📱 The driver can now use all features in the mobile app.');
    
  } catch (error) {
    console.error('❌ Error approving driver:', error);
  }
}

// Replace 'YOUR_DRIVER_ID' with your actual driver user ID
const driverId = 'YOUR_DRIVER_ID'; // Replace this with your actual driver ID

if (driverId === 'YOUR_DRIVER_ID') {
  console.log('❌ Please replace YOUR_DRIVER_ID with your actual driver user ID');
  console.log('💡 You can find your driver ID in the Firebase Console under driverApplications collection');
} else {
  approveDriverForTesting(driverId);
}
