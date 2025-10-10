#!/usr/bin/env node

/**
 * List All Users Script
 * 
 * Lists all users from Firestore with their key information
 * Usage: node scripts/listUsers.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

/**
 * Format user data for display
 */
function formatUser(userData, driverData = null) {
  const user = {
    firstName: userData.firstName || 'N/A',
    lastName: userData.lastName || 'N/A',
    email: userData.email || 'N/A',
    type: getUserType(userData),
    role: userData.role || 'N/A',
    profilePic: userData.photoURL ? '✓ Yes' : '✗ No',
    emailVerified: userData.emailVerified ? '✓ Yes' : '✗ No',
    onboardingComplete: userData.onboardingCompleted ? '✓ Yes' : '✗ No',
    createdAt: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'
  };

  // Add driver-specific information
  if (driverData) {
    user.driverType = driverData.vehicleInfo?.vehicleType || 'N/A';
    user.vehicleInfo = driverData.vehicleInfo 
      ? `${driverData.vehicleInfo.year || ''} ${driverData.vehicleInfo.color || ''} ${driverData.vehicleInfo.make || ''} ${driverData.vehicleInfo.model || ''}`.trim()
      : 'N/A';
    user.licensePlate = driverData.vehicleInfo?.licensePlate || 'N/A';
    user.vehiclePhoto = driverData.vehicleInfo?.photos?.front?.url ? '✓ Yes' : '✗ No';
    user.specialtyType = driverData.specialtyVehicleInfo?.specialtyVehicleType || 'None';
    user.serviceCapabilities = driverData.specialtyVehicleInfo?.serviceCapabilities?.join(', ') || 'None';
    user.driverStatus = driverData.status || 'N/A';
    user.isOnline = driverData.isOnline ? '✓ Online' : '✗ Offline';
    user.rating = driverData.metrics?.rating || driverData.ratingStats?.driver?.averageRating || 'N/A';
    user.totalRides = driverData.metrics?.totalRides || driverData.ratingStats?.driver?.totalRatings || 0;
  }

  return user;
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
 * Print user in table format
 */
function printUser(user, index, isDriver = false) {
  const typeColor = {
    'Super Admin': colors.red,
    'Admin': colors.yellow,
    'Driver': colors.blue,
    'Medical Admin': colors.cyan,
    'Rider': colors.green
  }[user.type] || colors.reset;

  console.log(`\n${colors.bright}${index}. ${user.firstName} ${user.lastName}${colors.reset}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Type: ${typeColor}${user.type}${colors.reset} | Role: ${user.role}`);
  console.log(`   Profile Pic: ${user.profilePic === '✓ Yes' ? colors.green : colors.gray}${user.profilePic}${colors.reset}`);
  console.log(`   Email Verified: ${user.emailVerified === '✓ Yes' ? colors.green : colors.red}${user.emailVerified}${colors.reset}`);
  console.log(`   Onboarding: ${user.onboardingComplete === '✓ Yes' ? colors.green : colors.yellow}${user.onboardingComplete}${colors.reset}`);
  console.log(`   Member Since: ${user.createdAt}`);

  if (isDriver) {
    console.log(`\n   ${colors.blue}Driver Details:${colors.reset}`);
    console.log(`   Vehicle Type: ${user.driverType}`);
    console.log(`   Vehicle: ${user.vehicleInfo}`);
    console.log(`   License Plate: ${user.licensePlate}`);
    console.log(`   Vehicle Photo: ${user.vehiclePhoto === '✓ Yes' ? colors.green : colors.gray}${user.vehiclePhoto}${colors.reset}`);
    console.log(`   Specialty Type: ${user.specialtyType}`);
    if (user.serviceCapabilities !== 'None') {
      console.log(`   Service Capabilities: ${user.serviceCapabilities}`);
    }
    console.log(`   Status: ${user.driverStatus} | ${user.isOnline}`);
    console.log(`   Rating: ${user.rating} (${user.totalRides} rides)`);
  }

  console.log(`   ${'─'.repeat(80)}`);
}

/**
 * Print summary statistics
 */
function printSummary(users, drivers) {
  const stats = {
    total: users.length,
    riders: users.filter(u => u.type === 'Rider').length,
    drivers: users.filter(u => u.type === 'Driver').length,
    admins: users.filter(u => u.type === 'Admin' || u.type === 'Super Admin').length,
    medicalAdmins: users.filter(u => u.type === 'Medical Admin').length,
    verified: users.filter(u => u.emailVerified === '✓ Yes').length,
    withProfilePic: users.filter(u => u.profilePic === '✓ Yes').length,
    onboardingComplete: users.filter(u => u.onboardingComplete === '✓ Yes').length
  };

  const driverStats = {
    standard: drivers.filter(d => d.driverType === 'standard').length,
    suv: drivers.filter(d => d.driverType === 'suv').length,
    luxury: drivers.filter(d => d.driverType === 'luxury').length,
    van: drivers.filter(d => d.driverType === 'van').length,
    wheelchairAccessible: drivers.filter(d => d.specialtyType?.includes('wheelchair')).length,
    medical: drivers.filter(d => d.specialtyType?.includes('medical')).length,
    withVehiclePhoto: drivers.filter(d => d.vehiclePhoto === '✓ Yes').length,
    online: drivers.filter(d => d.isOnline === '✓ Online').length
  };

  console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}📊 SUMMARY STATISTICS${colors.reset}`);
  console.log(`${'═'.repeat(80)}\n`);

  console.log(`${colors.bright}Total Users:${colors.reset} ${stats.total}`);
  console.log(`  ${colors.green}Riders:${colors.reset} ${stats.riders}`);
  console.log(`  ${colors.blue}Drivers:${colors.reset} ${stats.drivers}`);
  console.log(`  ${colors.yellow}Admins:${colors.reset} ${stats.admins}`);
  console.log(`  ${colors.cyan}Medical Admins:${colors.reset} ${stats.medicalAdmins}`);
  console.log();
  console.log(`${colors.bright}Account Status:${colors.reset}`);
  console.log(`  Email Verified: ${colors.green}${stats.verified}${colors.reset} / ${stats.total}`);
  console.log(`  With Profile Pic: ${colors.green}${stats.withProfilePic}${colors.reset} / ${stats.total}`);
  console.log(`  Onboarding Complete: ${colors.green}${stats.onboardingComplete}${colors.reset} / ${stats.total}`);

  if (drivers.length > 0) {
    console.log();
    console.log(`${colors.bright}Driver Statistics:${colors.reset}`);
    console.log(`  Standard Vehicles: ${driverStats.standard}`);
    console.log(`  SUVs: ${driverStats.suv}`);
    console.log(`  Luxury Vehicles: ${driverStats.luxury}`);
    console.log(`  Vans: ${driverStats.van}`);
    console.log(`  Wheelchair Accessible: ${driverStats.wheelchairAccessible}`);
    console.log(`  Medical Transport: ${driverStats.medical}`);
    console.log(`  With Vehicle Photo: ${colors.green}${driverStats.withVehiclePhoto}${colors.reset} / ${drivers.length}`);
    console.log(`  Currently Online: ${colors.green}${driverStats.online}${colors.reset} / ${drivers.length}`);
  }

  console.log(`\n${'═'.repeat(80)}\n`);
}

/**
 * Export to CSV
 */
function exportToCSV(users, drivers) {
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `user-export-${timestamp}.csv`;

  // CSV Header
  let csv = 'First Name,Last Name,Email,Type,Role,Profile Pic,Email Verified,Onboarding Complete,Created At,';
  csv += 'Driver Type,Vehicle Info,License Plate,Vehicle Photo,Specialty Type,Service Capabilities,Driver Status,Online,Rating,Total Rides\n';

  // CSV Data
  const allUsers = users.map(u => {
    const driver = drivers.find(d => d.email === u.email);
    return { ...u, ...driver };
  });

  allUsers.forEach(user => {
    csv += `"${user.firstName}","${user.lastName}","${user.email}","${user.type}","${user.role}",`;
    csv += `"${user.profilePic}","${user.emailVerified}","${user.onboardingComplete}","${user.createdAt}",`;
    csv += `"${user.driverType || ''}","${user.vehicleInfo || ''}","${user.licensePlate || ''}",`;
    csv += `"${user.vehiclePhoto || ''}","${user.specialtyType || ''}","${user.serviceCapabilities || ''}",`;
    csv += `"${user.driverStatus || ''}","${user.isOnline || ''}","${user.rating || ''}","${user.totalRides || ''}"\n`;
  });

  fs.writeFileSync(filename, csv);
  console.log(`${colors.green}✓ Exported to ${filename}${colors.reset}\n`);
}

/**
 * Main execution
 */
async function listUsers() {
  try {
    console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}👥 ANYRYDE USER DATABASE${colors.reset}`);
    console.log(`${colors.bright}${'═'.repeat(80)}${colors.reset}\n`);
    console.log(`${colors.gray}Fetching users from Firestore...${colors.reset}\n`);

    // Fetch all users
    const usersSnapshot = await db.collection('users').get();
    const users = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      users.push({ uid: doc.id, ...userData });
    }

    console.log(`${colors.green}✓ Found ${users.length} users${colors.reset}`);

    // Fetch driver data for drivers
    const driversSnapshot = await db.collection('drivers').get();
    const driversMap = new Map();

    for (const doc of driversSnapshot.docs) {
      const driverData = doc.data();
      driversMap.set(driverData.userId, driverData);
    }

    console.log(`${colors.blue}✓ Found ${driversMap.size} driver profiles${colors.reset}\n`);

    // Format and display users
    const formattedUsers = [];
    const formattedDrivers = [];

    users.forEach((userData, index) => {
      const driverData = driversMap.get(userData.uid);
      const formattedUser = formatUser(userData, driverData);
      formattedUsers.push(formattedUser);
      
      if (driverData) {
        formattedDrivers.push(formattedUser);
      }

      printUser(formattedUser, index + 1, !!driverData);
    });

    // Print summary
    printSummary(formattedUsers, formattedDrivers);

    // Ask if user wants to export to CSV
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Export to CSV? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        exportToCSV(formattedUsers, formattedDrivers);
      }
      readline.close();
      process.exit(0);
    });

  } catch (error) {
    console.error(`${colors.red}❌ Error fetching users:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the script
listUsers();

