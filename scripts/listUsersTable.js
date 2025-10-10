#!/usr/bin/env node

/**
 * List All Users Script (Table Format)
 * 
 * Lists all users in a clean table format
 * Usage: node scripts/listUsersTable.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Main execution
 */
async function listUsers() {
  try {
    console.log('\n📊 Fetching users from Firestore...\n');

    // Fetch all users
    const usersSnapshot = await db.collection('users').get();
    const users = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      users.push({ uid: doc.id, ...userData });
    }

    // Fetch all drivers
    const driversSnapshot = await db.collection('drivers').get();
    const driversMap = new Map();

    for (const doc of driversSnapshot.docs) {
      const driverData = doc.data();
      driversMap.set(driverData.userId, driverData);
    }

    console.log(`Found ${users.length} users (${driversMap.size} drivers)\n`);

    // Prepare table data
    const tableData = users.map((userData) => {
      const driverData = driversMap.get(userData.uid);
      
      const userType = getUserType(userData);
      const isDriver = userType === 'Driver';

      const row = {
        'First Name': userData.firstName || 'N/A',
        'Last Name': userData.lastName || 'N/A',
        'Email': userData.email || 'N/A',
        'Type': userType,
        'Profile Pic': userData.photoURL ? '✓' : '✗',
        'Email Ver.': userData.emailVerified ? '✓' : '✗',
        'Onboarding': userData.onboardingCompleted ? '✓' : '✗'
      };

      if (isDriver && driverData) {
        row['Driver Type'] = driverData.vehicleInfo?.vehicleType || 'N/A';
        row['Vehicle'] = driverData.vehicleInfo 
          ? `${driverData.vehicleInfo.year || ''} ${driverData.vehicleInfo.make || ''} ${driverData.vehicleInfo.model || ''}`.trim() 
          : 'N/A';
        row['Plate'] = driverData.vehicleInfo?.licensePlate || 'N/A';
        row['Vehicle Pic'] = driverData.vehicleInfo?.photos?.front?.url ? '✓' : '✗';
        row['Specialty'] = driverData.specialtyVehicleInfo?.specialtyVehicleType || 'None';
        row['Status'] = driverData.status || 'N/A';
        row['Online'] = driverData.isOnline ? '✓' : '✗';
        row['Rating'] = driverData.ratingStats?.driver?.averageRating?.toFixed(1) || driverData.metrics?.rating?.toFixed(1) || 'N/A';
        row['Rides'] = driverData.ratingStats?.driver?.totalRatings || driverData.metrics?.totalRides || 0;
      }

      return row;
    });

    // Print table
    console.table(tableData);

    // Print summary
    printSummary(users, driversMap);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    process.exit(1);
  }
}

/**
 * Determine user type
 */
function getUserType(userData) {
  if (userData.role === 'super_admin') return 'Super Admin';
  if (userData.role === 'admin') return 'Admin';
  if (userData.role === 'driver') return 'Driver';
  if (userData.userType === 'administrator') return 'Medical Admin';
  if (userData.role === 'customer' || userData.userType === 'passenger') return 'Rider';
  return 'Unknown';
}

/**
 * Print summary
 */
function printSummary(users, driversMap) {
  console.log('\n📊 Summary:');
  console.log('─'.repeat(50));
  
  const stats = {
    total: users.length,
    riders: users.filter(u => getUserType(u) === 'Rider').length,
    drivers: users.filter(u => getUserType(u) === 'Driver').length,
    admins: users.filter(u => getUserType(u) === 'Admin' || getUserType(u) === 'Super Admin').length,
    medicalAdmins: users.filter(u => getUserType(u) === 'Medical Admin').length,
    verified: users.filter(u => u.emailVerified).length,
    withProfilePic: users.filter(u => u.photoURL).length,
    onboardingComplete: users.filter(u => u.onboardingCompleted).length
  };

  console.log(`Total Users: ${stats.total}`);
  console.log(`  Riders: ${stats.riders}`);
  console.log(`  Drivers: ${stats.drivers}`);
  console.log(`  Admins: ${stats.admins}`);
  console.log(`  Medical Admins: ${stats.medicalAdmins}`);
  console.log();
  console.log(`Email Verified: ${stats.verified} / ${stats.total} (${Math.round(stats.verified / stats.total * 100)}%)`);
  console.log(`With Profile Pic: ${stats.withProfilePic} / ${stats.total} (${Math.round(stats.withProfilePic / stats.total * 100)}%)`);
  console.log(`Onboarding Complete: ${stats.onboardingComplete} / ${stats.total} (${Math.round(stats.onboardingComplete / stats.total * 100)}%)`);

  if (driversMap.size > 0) {
    const drivers = Array.from(driversMap.values());
    const online = drivers.filter(d => d.isOnline).length;
    const withVehiclePhoto = drivers.filter(d => d.vehicleInfo?.photos?.front?.url).length;
    const wheelchair = drivers.filter(d => d.specialtyVehicleInfo?.specialtyVehicleType?.includes('wheelchair')).length;
    const medical = drivers.filter(d => d.specialtyVehicleInfo?.specialtyVehicleType?.includes('medical')).length;

    console.log();
    console.log(`Driver Statistics:`);
    console.log(`  Currently Online: ${online} / ${driversMap.size}`);
    console.log(`  With Vehicle Photo: ${withVehiclePhoto} / ${driversMap.size}`);
    console.log(`  Wheelchair Accessible: ${wheelchair}`);
    console.log(`  Medical Transport: ${medical}`);
  }

  console.log('─'.repeat(50));
  console.log();
}

// Run the script
listUsers();

