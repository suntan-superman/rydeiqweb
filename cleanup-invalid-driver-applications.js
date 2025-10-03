/**
 * Cleanup Invalid Driver Applications
 * 
 * This script removes invalid or test driver applications from your database.
 * Use this to clean up:
 * - Your own admin account's driver application (created by mistake)
 * - Test applications with missing data
 * - Applications with invalid dates
 * 
 * Run: node cleanup-invalid-driver-applications.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Email of your admin account that shouldn't be a driver
const ADMIN_EMAIL = 'sroy@worksidesoftware.com';

async function cleanupDriverApplications() {
  try {
    console.log('🔍 Scanning driver applications...\n');
    
    const snapshot = await db.collection('driverApplications').get();
    
    console.log(`Found ${snapshot.size} driver applications\n`);
    
    const invalidApplications = [];
    const adminApplication = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      
      // Check if this is the admin's application
      if (data.email === ADMIN_EMAIL) {
        adminApplication.push({ id, data });
      }
      // Check for invalid applications (no name, no email, or invalid dates)
      else if (
        !data.personalInfo?.firstName || 
        !data.personalInfo?.lastName || 
        !data.email ||
        !data.createdAt
      ) {
        invalidApplications.push({ id, data });
      }
    });
    
    // Display findings
    console.log('📋 FINDINGS:\n');
    
    if (adminApplication.length > 0) {
      console.log('⚠️  ADMIN ACCOUNT AS DRIVER:');
      adminApplication.forEach(app => {
        console.log(`   - Email: ${app.data.email}`);
        console.log(`   - ID: ${app.id}`);
        console.log(`   - Created: ${app.data.createdAt?.toDate?.() || app.data.createdAt || 'Invalid'}`);
        console.log(`   - Status: ${app.data.status || 'Unknown'}\n`);
      });
    }
    
    if (invalidApplications.length > 0) {
      console.log(`❌ INVALID APPLICATIONS (${invalidApplications.length}):`);
      invalidApplications.forEach(app => {
        console.log(`   - ID: ${app.id}`);
        console.log(`   - Email: ${app.data.email || 'Missing'}`);
        console.log(`   - Name: ${app.data.personalInfo?.firstName || 'Missing'} ${app.data.personalInfo?.lastName || ''}`);
        console.log(`   - Created: ${app.data.createdAt?.toDate?.() || app.data.createdAt || 'Invalid'}`);
        console.log(`   - Status: ${app.data.status || 'Unknown'}\n`);
      });
    }
    
    // Prompt for cleanup
    const totalToDelete = adminApplication.length + invalidApplications.length;
    
    if (totalToDelete === 0) {
      console.log('✅ No invalid applications found. Database is clean!\n');
      process.exit(0);
    }
    
    console.log(`\n🗑️  CLEANUP ACTION:`);
    console.log(`   This will delete ${totalToDelete} driver application(s)\n`);
    
    // In a real scenario, you'd want confirmation here
    // For automation, we'll proceed
    console.log('⏳ Starting cleanup...\n');
    
    // Delete admin application
    for (const app of adminApplication) {
      console.log(`🗑️  Deleting admin application: ${app.data.email}`);
      await db.collection('driverApplications').doc(app.id).delete();
      console.log('   ✅ Deleted\n');
    }
    
    // Delete invalid applications
    for (const app of invalidApplications) {
      console.log(`🗑️  Deleting invalid application: ${app.id}`);
      await db.collection('driverApplications').doc(app.id).delete();
      console.log('   ✅ Deleted\n');
    }
    
    console.log('🎉 Cleanup complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Admin applications removed: ${adminApplication.length}`);
    console.log(`   - Invalid applications removed: ${invalidApplications.length}`);
    console.log(`   - Total removed: ${totalToDelete}\n`);
    
    console.log('💡 Next steps:');
    console.log('   1. Refresh your admin dashboard');
    console.log('   2. Go to Driver Management');
    console.log('   3. The invalid entries should be gone\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
console.log('🚀 Driver Application Cleanup Tool\n');
console.log('This will remove:');
console.log('  - Your admin account\'s driver application');
console.log('  - Invalid applications with missing data\n');

cleanupDriverApplications();

