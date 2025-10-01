const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with better error handling
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.error('❌ Error loading service account key:', error.message);
  console.log('💡 Make sure serviceAccountKey.json is in the same directory as this script');
  process.exit(1);
}

// Initialize Firebase with retry logic
let app;
try {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'rydeiq-8a8b8.appspot.com', // Replace with your bucket name
    projectId: serviceAccount.project_id
  });
} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
  process.exit(1);
}

const bucket = admin.storage().bucket();

// Profile pictures directory
const profilePicturesDir = 'C:\\Users\\sjroy\\Source\\rydeIQ\\documents';

// Profile picture files
const profilePictures = [
  'male-1.jpg',
  'male-2.jpg', 
  'female-1.jpg',
  'female-2.jpg'
];

// Retry function for network operations
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`⚠️ Attempt ${i + 1} failed: ${error.message}`);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

async function uploadProfilePictures() {
  console.log('🚀 Starting profile picture upload...');
  console.log('📁 Looking for pictures in:', profilePicturesDir);
  
  try {
    // Test Firebase connection first
    console.log('🔗 Testing Firebase connection...');
    await retryOperation(async () => {
      await admin.firestore().collection('test').doc('connection').set({ test: true });
      await admin.firestore().collection('test').doc('connection').delete();
    });
    console.log('✅ Firebase connection successful');
    
    for (const filename of profilePictures) {
      const filePath = path.join(profilePicturesDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        continue;
      }
      
      console.log(`📤 Uploading ${filename}...`);
      
      // Create destination path in Firebase Storage
      const destinationPath = `profile-pictures/${filename}`;
      
      // Upload file to Firebase Storage with retry
      await retryOperation(async () => {
        await bucket.upload(filePath, {
          destination: destinationPath,
          metadata: {
            metadata: {
              contentType: 'image/jpeg',
              uploadedAt: new Date().toISOString(),
              source: 'profile-picture-upload-script'
            }
          }
        });
      });
      
      // Get public URL with retry
      const file = bucket.file(destinationPath);
      const [url] = await retryOperation(async () => {
        return await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Far future date for permanent URLs
        });
      });
      
      console.log(`✅ Uploaded ${filename}: ${url}`);
      
      // Create a document in Firestore with the profile picture info
      const profilePictureData = {
        filename: filename,
        url: url,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        gender: filename.startsWith('male') ? 'male' : 'female',
        isDefault: true,
        category: 'default-profile-pictures'
      };
      
      await retryOperation(async () => {
        await admin.firestore()
          .collection('profilePictures')
          .doc(filename.replace('.jpg', ''))
          .set(profilePictureData);
      });
      
      console.log(`📝 Created Firestore document for ${filename}`);
    }
    
    console.log('🎉 All profile pictures uploaded successfully!');
    
    // Create a collection of available profile pictures for easy access
    const availablePictures = await retryOperation(async () => {
      return await admin.firestore()
        .collection('profilePictures')
        .where('isDefault', '==', true)
        .get();
    });
    
    const pictureUrls = {};
    availablePictures.forEach(doc => {
      const data = doc.data();
      pictureUrls[data.filename] = data.url;
    });
    
    // Store in a single document for easy access
    await retryOperation(async () => {
      await admin.firestore()
        .collection('appConfig')
        .doc('defaultProfilePictures')
        .set({
          pictures: pictureUrls,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          count: Object.keys(pictureUrls).length
        });
    });
    
    console.log('📋 Created appConfig document with all profile picture URLs');
    console.log('🔗 Available pictures:', Object.keys(pictureUrls));
    
  } catch (error) {
    console.error('❌ Error uploading profile pictures:', error);
    
    // Fallback: Create placeholder URLs for testing
    console.log('🔄 Creating fallback placeholder URLs...');
    
    const fallbackUrls = {};
    profilePictures.forEach(filename => {
      // Create a placeholder URL structure using ui-avatars.com
      const name = filename.replace('.jpg', '').toUpperCase();
      const bgColor = filename.includes('male') ? '4F46E5' : 'EC4899';
      fallbackUrls[filename] = `https://ui-avatars.com/api/?name=${name}&background=${bgColor}&color=FFFFFF&size=200`;
    });
    
    try {
      await admin.firestore()
        .collection('appConfig')
        .doc('defaultProfilePictures')
        .set({
          pictures: fallbackUrls,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          count: Object.keys(fallbackUrls).length,
          isFallback: true,
          note: 'Using placeholder URLs due to upload error'
        });
      
      console.log('📋 Created fallback appConfig document with placeholder URLs');
      console.log('🔗 Fallback pictures:', Object.keys(fallbackUrls));
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError);
    }
  }
}

// Run the upload
uploadProfilePictures()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
