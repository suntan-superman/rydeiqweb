// Data Migration Script: drivers → driverApplications
// Run this script to migrate existing data from drivers to driverApplications collection

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  // Add your actual Firebase config here
  apiKey: "your-api-key",
  authDomain: "ryde-9d4bf.firebaseapp.com",
  projectId: "ryde-9d4bf",
  storageBucket: "ryde-9d4bf.firebasestorage.app",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateDriverData() {
  try {
    console.log('🚀 Starting data migration from drivers to driverApplications...');
    
    // Get all documents from drivers collection
    const driversSnapshot = await getDocs(collection(db, 'drivers'));
    console.log(`📊 Found ${driversSnapshot.size} documents in drivers collection`);
    
    if (driversSnapshot.size === 0) {
      console.log('✅ No data to migrate - drivers collection is empty');
      return;
    }
    
    // Create batch for efficient writing
    const batch = writeBatch(db);
    let migratedCount = 0;
    let errorCount = 0;
    
    // Process each document
    for (const driverDoc of driversSnapshot.docs) {
      try {
        const driverData = driverDoc.data();
        const userId = driverDoc.id;
        
        console.log(`📝 Migrating driver: ${userId}`);
        
        // Add migration metadata
        const migratedData = {
          ...driverData,
          migratedAt: new Date().toISOString(),
          migratedFrom: 'drivers',
          migrationVersion: '1.0'
        };
        
        // Add to batch
        batch.set(doc(db, 'driverApplications', userId), migratedData);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating driver ${driverDoc.id}:`, error);
        errorCount++;
      }
    }
    
    // Commit the batch
    console.log('💾 Committing migration batch...');
    await batch.commit();
    
    console.log('✅ Migration completed!');
    console.log(`📊 Successfully migrated: ${migratedCount} drivers`);
    console.log(`❌ Errors: ${errorCount} drivers`);
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const driverApplicationsSnapshot = await getDocs(collection(db, 'driverApplications'));
    console.log(`📊 driverApplications collection now has: ${driverApplicationsSnapshot.size} documents`);
    
    if (migratedCount === driverApplicationsSnapshot.size) {
      console.log('✅ Migration verification successful!');
    } else {
      console.log('⚠️  Migration verification failed - counts do not match');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Function to verify data consistency
async function verifyDataConsistency() {
  try {
    console.log('🔍 Verifying data consistency...');
    
    const driversSnapshot = await getDocs(collection(db, 'drivers'));
    const driverApplicationsSnapshot = await getDocs(collection(db, 'driverApplications'));
    
    console.log(`📊 drivers collection: ${driversSnapshot.size} documents`);
    console.log(`📊 driverApplications collection: ${driverApplicationsSnapshot.size} documents`);
    
    // Check if all drivers exist in driverApplications
    const driverIds = new Set();
    driversSnapshot.forEach(doc => driverIds.add(doc.id));
    
    const driverApplicationIds = new Set();
    driverApplicationsSnapshot.forEach(doc => driverApplicationIds.add(doc.id));
    
    const missingIds = [...driverIds].filter(id => !driverApplicationIds.has(id));
    const extraIds = [...driverApplicationIds].filter(id => !driverIds.has(id));
    
    if (missingIds.length === 0 && extraIds.length === 0) {
      console.log('✅ Data consistency verified - all drivers migrated successfully');
    } else {
      console.log('⚠️  Data consistency issues found:');
      if (missingIds.length > 0) {
        console.log(`❌ Missing in driverApplications: ${missingIds.join(', ')}`);
      }
      if (extraIds.length > 0) {
        console.log(`➕ Extra in driverApplications: ${extraIds.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Function to clean up old drivers collection (USE WITH CAUTION)
async function cleanupOldCollection() {
  try {
    console.log('⚠️  WARNING: This will delete the old drivers collection!');
    console.log('⚠️  Make sure migration is complete and verified before proceeding!');
    
    // Uncomment the following lines only after verification
    // const driversSnapshot = await getDocs(collection(db, 'drivers'));
    // const batch = writeBatch(db);
    // driversSnapshot.forEach(doc => batch.delete(doc.ref));
    // await batch.commit();
    // console.log('✅ Old drivers collection cleaned up');
    
    console.log('🔒 Cleanup function is locked for safety');
    console.log('🔓 Uncomment the cleanup code after verification');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      await migrateDriverData();
      break;
    case 'verify':
      await verifyDataConsistency();
      break;
    case 'cleanup':
      await cleanupOldCollection();
      break;
    default:
      console.log('Usage: node data-migration-script.js [migrate|verify|cleanup]');
      console.log('  migrate  - Migrate data from drivers to driverApplications');
      console.log('  verify   - Verify data consistency between collections');
      console.log('  cleanup  - Clean up old drivers collection (locked for safety)');
  }
}

main();
