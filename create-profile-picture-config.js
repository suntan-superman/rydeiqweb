const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Profile picture files
const profilePictures = [
  'male-1.jpg',
  'male-2.jpg', 
  'female-1.jpg',
  'female-2.jpg'
];

async function createProfilePictureConfig() {
  console.log('🚀 Creating profile picture configuration...');
  
  try {
    // Create placeholder URLs for now using a React Native-friendly service
    const pictureUrls = {};
    profilePictures.forEach(filename => {
      // Create a placeholder URL structure using dicebear.com
      const seed = filename.replace('.jpg', '').toUpperCase();
      const bgColor = filename.includes('male') ? '4F46E5' : 'EC4899';
      pictureUrls[filename] = `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&backgroundColor=${bgColor}&size=200`;
    });
    
    // Store in Firestore for easy access
    await admin.firestore()
      .collection('appConfig')
      .doc('defaultProfilePictures')
      .set({
        pictures: pictureUrls,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        count: Object.keys(pictureUrls).length,
        isPlaceholder: true,
        note: 'Placeholder URLs - replace with actual uploaded URLs later'
      });
    
    console.log('✅ Profile picture configuration created successfully!');
    console.log('🔗 Available pictures:', Object.keys(pictureUrls));
    console.log('📝 Stored in: appConfig/defaultProfilePictures');
    
    // Also create individual documents for each picture
    for (const filename of profilePictures) {
      const profilePictureData = {
        filename: filename,
        url: pictureUrls[filename],
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        gender: filename.startsWith('male') ? 'male' : 'female',
        isDefault: true,
        isPlaceholder: true,
        category: 'default-profile-pictures'
      };
      
      await admin.firestore()
        .collection('profilePictures')
        .doc(filename.replace('.jpg', ''))
        .set(profilePictureData);
      
      console.log(`📝 Created document for ${filename}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating profile picture config:', error);
  }
}

// Run the script
createProfilePictureConfig()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
