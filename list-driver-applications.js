/**
 * List All Driver Applications
 * 
 * This script lists all driver applications in your database
 * so you can see what's there before cleaning up.
 * 
 * Run: node list-driver-applications.js
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

async function listDriverApplications() {
  try {
    console.log('📋 Listing all driver applications...\n');
    
    const snapshot = await db.collection('driverApplications').get();
    
    if (snapshot.empty) {
      console.log('✅ No driver applications found in database.\n');
      process.exit(0);
    }
    
    console.log(`Found ${snapshot.size} driver applications:\n`);
    console.log('═'.repeat(80));
    
    let count = 0;
    snapshot.forEach((doc) => {
      count++;
      const data = doc.data();
      const id = doc.id;
      
      console.log(`\n${count}. Driver Application ID: ${id}`);
      console.log('   ─'.repeat(40));
      console.log(`   Email:        ${data.email || '❌ Missing'}`);
      console.log(`   First Name:   ${data.personalInfo?.firstName || '❌ Missing'}`);
      console.log(`   Last Name:    ${data.personalInfo?.lastName || '❌ Missing'}`);
      console.log(`   Phone:        ${data.personalInfo?.phone || 'Not provided'}`);
      console.log(`   Status:       ${data.status || '❌ Missing'}`);
      
      // Handle different date formats
      let createdDate = 'Invalid Date';
      if (data.createdAt) {
        if (data.createdAt.toDate) {
          // Firestore Timestamp
          createdDate = data.createdAt.toDate().toLocaleString();
        } else if (typeof data.createdAt === 'string') {
          // ISO String
          createdDate = new Date(data.createdAt).toLocaleString();
        } else if (data.createdAt.seconds) {
          // Timestamp object
          createdDate = new Date(data.createdAt.seconds * 1000).toLocaleString();
        }
      }
      console.log(`   Created:      ${createdDate}`);
      
      // Show onboarding status
      console.log(`   Onboarding:   ${data.onboardingStatus?.completed ? '✅ Complete' : '⏳ Incomplete'}`);
      
      // Show approval status
      console.log(`   Approved:     ${data.approvalStatus?.status || 'Pending'}`);
      
      // Vehicle info
      if (data.vehicleInfo?.make) {
        console.log(`   Vehicle:      ${data.vehicleInfo.make} ${data.vehicleInfo.model || ''} (${data.vehicleInfo.year || ''})`);
      } else {
        console.log(`   Vehicle:      ❌ Not provided`);
      }
      
      // Identify potential issues
      const issues = [];
      if (!data.email) issues.push('No email');
      if (!data.personalInfo?.firstName) issues.push('No first name');
      if (!data.personalInfo?.lastName) issues.push('No last name');
      if (!data.createdAt || createdDate === 'Invalid Date') issues.push('Invalid date');
      
      if (issues.length > 0) {
        console.log(`   ⚠️  Issues:    ${issues.join(', ')}`);
      }
      
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log(`\nTotal: ${snapshot.size} driver applications\n`);
    
    // Count issues
    let invalidCount = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.email || !data.personalInfo?.firstName || !data.personalInfo?.lastName || !data.createdAt) {
        invalidCount++;
      }
    });
    
    if (invalidCount > 0) {
      console.log(`⚠️  Found ${invalidCount} application(s) with missing data\n`);
      console.log('💡 To clean up invalid applications, run:');
      console.log('   node cleanup-invalid-driver-applications.js\n');
    } else {
      console.log('✅ All applications have complete data\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error listing applications:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

// Run the script
listDriverApplications();

