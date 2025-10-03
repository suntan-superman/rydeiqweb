/**
 * Set Super Admin Custom Claim
 * 
 * This script sets the Firebase custom claim for super admin role.
 * Custom claims are required for Firestore security rules that check request.auth.token.role
 * 
 * Run: node set-super-admin-claim.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const EMAIL_TO_PROMOTE = 'sroy@worksidesoftware.com';

async function setSuperAdminClaim() {
  try {
    console.log('🔍 Finding user with email:', EMAIL_TO_PROMOTE);
    
    // Get user by email
    const user = await admin.auth().getUserByEmail(EMAIL_TO_PROMOTE);
    
    console.log('✅ User found:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    // Check current custom claims
    const currentClaims = user.customClaims || {};
    console.log('📋 Current custom claims:', currentClaims);
    
    // Set super admin custom claim
    await admin.auth().setCustomUserClaims(user.uid, {
      ...currentClaims,
      role: 'super_admin'
    });
    
    console.log('✅ Custom claim set successfully!');
    console.log('🎉 User is now a Super Admin with custom claim');
    
    // Verify the claim was set
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('✅ Verified custom claims:', updatedUser.customClaims);
    
    // Also update Firestore document to match
    const db = admin.firestore();
    await db.collection('users').doc(user.uid).update({
      role: 'super_admin',
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Firestore document updated to match');
    
    console.log('\n🎯 IMPORTANT: User must log out and log back in for the custom claim to take effect!');
    console.log('   The token refresh happens on next login.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting super admin claim:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.error('\n💡 User not found. Make sure:');
      console.error('   1. The email is correct:', EMAIL_TO_PROMOTE);
      console.error('   2. The user account exists in Firebase Authentication');
      console.error('   3. The email is verified');
    }
    
    process.exit(1);
  }
}

// Run the script
setSuperAdminClaim();

