const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Add your Firebase project configuration here if needed
  });
}

const db = admin.firestore();

async function createFareConfiguration() {
  try {
    console.log('Creating fare configuration...');
    
    const fareConfig = {
      minimumFare: 5.00,
      maximumFarePerMile: 7.50,
      baseFare: 2.50,
      perMileRate: 2.25,
      perMinuteRate: 0.25,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system',
      version: '1.0.0'
    };

    // Create the fare configuration document
    await db.collection('appConfig').doc('fareRules').set(fareConfig);
    
    console.log('✅ Fare configuration created successfully!');
    console.log('Configuration:', fareConfig);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating fare configuration:', error);
    process.exit(1);
  }
}

createFareConfiguration();
