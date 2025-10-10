#!/usr/bin/env node

/**
 * List All Drivers Script
 * 
 * Shows drivers from BOTH collections (drivers and driverApplications)
 * Helps identify duplicates and data inconsistencies
 * 
 * Usage: node scripts/listDrivers.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Color codes
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
 * Format driver data
 */
function formatDriver(driverData, source) {
  return {
    source: source,
    userId: driverData.userId || 'N/A',
    firstName: driverData.personalInfo?.firstName || driverData.firstName || 'N/A',
    lastName: driverData.personalInfo?.lastName || driverData.lastName || 'N/A',
    email: driverData.personalInfo?.email || driverData.email || 'N/A',
    profilePic: driverData.photoURL || driverData.documents?.profile_photo?.url ? '✓ Yes' : '✗ No',
    
    // Vehicle Info
    vehicleType: driverData.vehicleInfo?.vehicleType || driverData.vehicle_info?.vehicleType || 'N/A',
    vehicle: driverData.vehicleInfo 
      ? `${driverData.vehicleInfo.year || ''} ${driverData.vehicleInfo.color || ''} ${driverData.vehicleInfo.make || ''} ${driverData.vehicleInfo.model || ''}`.trim()
      : driverData.vehicle_info
      ? `${driverData.vehicle_info.year || ''} ${driverData.vehicle_info.color || ''} ${driverData.vehicle_info.make || ''} ${driverData.vehicle_info.model || ''}`.trim()
      : 'N/A',
    licensePlate: driverData.vehicleInfo?.licensePlate || driverData.vehicle_info?.licensePlate || 'N/A',
    vehiclePhoto: driverData.vehicleInfo?.photos?.front?.url || driverData.vehicle_info?.photos?.front?.url ? '✓ Yes' : '✗ No',
    
    // Specialty Info
    specialtyType: driverData.specialtyVehicleInfo?.specialtyVehicleType || driverData.specialty_vehicle_info?.specialtyVehicleType || 'None',
    serviceCapabilities: (driverData.specialtyVehicleInfo?.serviceCapabilities || driverData.specialty_vehicle_info?.serviceCapabilities || []).join(', ') || 'None',
    
    // Status
    status: driverData.status || driverData.approvalStatus?.status || 'N/A',
    onboardingComplete: driverData.onboardingStatus?.completed || driverData.onboardingCompleted ? '✓ Yes' : '✗ No',
    isOnline: driverData.isOnline ? '✓ Online' : '✗ Offline',
    isAvailable: driverData.isAvailable ? '✓ Yes' : '✗ No',
    
    // Performance
    rating: driverData.ratingStats?.driver?.averageRating?.toFixed(1) || driverData.metrics?.rating?.toFixed(1) || 'N/A',
    totalRides: driverData.ratingStats?.driver?.totalRatings || driverData.metrics?.totalRides || 0,
    
    // Dates
    createdAt: driverData.createdAt ? new Date(driverData.createdAt.toDate ? driverData.createdAt.toDate() : driverData.createdAt).toLocaleDateString() : 'N/A',
    lastSeen: driverData.lastSeen ? new Date(driverData.lastSeen.toDate ? driverData.lastSeen.toDate() : driverData.lastSeen).toLocaleDateString() : 'N/A'
  };
}

/**
 * Print driver info
 */
function printDriver(driver, index) {
  const sourceColor = driver.source === 'drivers' ? colors.blue : colors.cyan;
  
  console.log(`\n${colors.bright}${index}. ${driver.firstName} ${driver.lastName}${colors.reset} ${sourceColor}[${driver.source}]${colors.reset}`);
  console.log(`   Email: ${driver.email}`);
  console.log(`   User ID: ${colors.gray}${driver.userId}${colors.reset}`);
  console.log(`   Profile Pic: ${driver.profilePic === '✓ Yes' ? colors.green : colors.gray}${driver.profilePic}${colors.reset}`);
  console.log(`   Onboarding: ${driver.onboardingComplete === '✓ Yes' ? colors.green : colors.yellow}${driver.onboardingComplete}${colors.reset}`);
  console.log(`   Status: ${driver.status} | ${driver.isOnline} | Available: ${driver.isAvailable}`);
  
  console.log(`\n   ${colors.blue}Vehicle:${colors.reset}`);
  console.log(`   Type: ${driver.vehicleType}`);
  console.log(`   Info: ${driver.vehicle}`);
  console.log(`   License Plate: ${driver.licensePlate}`);
  console.log(`   Vehicle Photo: ${driver.vehiclePhoto === '✓ Yes' ? colors.green : colors.gray}${driver.vehiclePhoto}${colors.reset}`);
  
  if (driver.specialtyType !== 'None') {
    console.log(`\n   ${colors.cyan}Specialty:${colors.reset}`);
    console.log(`   Type: ${driver.specialtyType}`);
    console.log(`   Capabilities: ${driver.serviceCapabilities}`);
  }
  
  console.log(`\n   ${colors.green}Performance:${colors.reset}`);
  console.log(`   Rating: ${driver.rating} ⭐ (${driver.totalRides} rides)`);
  console.log(`   Member Since: ${driver.createdAt} | Last Seen: ${driver.lastSeen}`);
  
  console.log(`   ${'─'.repeat(80)}`);
}

/**
 * Compare collections and find duplicates
 */
function findDuplicates(driversCollection, driverApplicationsCollection) {
  const duplicates = [];
  const driversUserIds = new Set(driversCollection.map(d => d.userId));
  const appsUserIds = new Set(driverApplicationsCollection.map(d => d.userId));
  
  // Find users in both collections
  const inBoth = [...driversUserIds].filter(uid => appsUserIds.has(uid));
  
  console.log(`\n${colors.bright}🔍 DUPLICATE ANALYSIS${colors.reset}`);
  console.log(`${'═'.repeat(80)}\n`);
  
  console.log(`${colors.blue}Drivers Collection:${colors.reset} ${driversCollection.length} records`);
  console.log(`${colors.cyan}Driver Applications Collection:${colors.reset} ${driverApplicationsCollection.length} records`);
  console.log(`${colors.yellow}In BOTH Collections:${colors.reset} ${inBoth.length} records`);
  console.log(`${colors.green}Only in 'drivers':${colors.reset} ${driversCollection.length - inBoth.length} records`);
  console.log(`${colors.red}Only in 'driverApplications':${colors.reset} ${driverApplicationsCollection.length - inBoth.length} records`);
  
  if (inBoth.length > 0) {
    console.log(`\n${colors.yellow}⚠️  WARNING: ${inBoth.length} drivers exist in BOTH collections!${colors.reset}`);
    console.log(`   This can cause data inconsistency issues.`);
    console.log(`   Recommendation: Consolidate to ONE collection.`);
  }
  
  return { duplicates: inBoth };
}

/**
 * Main execution
 */
async function listDrivers() {
  try {
    console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}🚗 ANYRYDE DRIVER DATABASE${colors.reset}`);
    console.log(`${colors.bright}${'═'.repeat(80)}${colors.reset}\n`);

    // Fetch from 'drivers' collection
    console.log(`${colors.gray}Fetching from 'drivers' collection...${colors.reset}`);
    const driversSnapshot = await db.collection('drivers').get();
    const driversCollection = [];
    
    driversSnapshot.forEach(doc => {
      driversCollection.push(formatDriver({ ...doc.data(), userId: doc.id }, 'drivers'));
    });
    
    console.log(`${colors.blue}✓ Found ${driversCollection.length} records in 'drivers'${colors.reset}`);

    // Fetch from 'driverApplications' collection
    console.log(`${colors.gray}Fetching from 'driverApplications' collection...${colors.reset}`);
    const appsSnapshot = await db.collection('driverApplications').get();
    const driverApplicationsCollection = [];
    
    appsSnapshot.forEach(doc => {
      driverApplicationsCollection.push(formatDriver({ ...doc.data(), userId: doc.id }, 'driverApplications'));
    });
    
    console.log(`${colors.cyan}✓ Found ${driverApplicationsCollection.length} records in 'driverApplications'${colors.reset}\n`);

    // Analyze duplicates
    const analysis = findDuplicates(driversCollection, driverApplicationsCollection);

    // Combine and display all drivers
    console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}📋 ALL DRIVERS (from both collections)${colors.reset}`);
    console.log(`${'═'.repeat(80)}`);

    const allDrivers = [...driversCollection, ...driverApplicationsCollection];
    
    // Remove duplicates by userId (prefer driverApplications)
    const uniqueDrivers = [];
    const seenUserIds = new Set();
    
    // First add from driverApplications (primary)
    driverApplicationsCollection.forEach(driver => {
      if (!seenUserIds.has(driver.userId)) {
        uniqueDrivers.push(driver);
        seenUserIds.add(driver.userId);
      }
    });
    
    // Then add from drivers (only if not already seen)
    driversCollection.forEach(driver => {
      if (!seenUserIds.has(driver.userId)) {
        uniqueDrivers.push(driver);
        seenUserIds.add(driver.userId);
      }
    });

    uniqueDrivers.forEach((driver, index) => {
      printDriver(driver, index + 1);
    });

    // Summary
    printSummary(uniqueDrivers, analysis);

    process.exit(0);

  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Print summary
 */
function printSummary(drivers, analysis) {
  console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}📊 DRIVER SUMMARY${colors.reset}`);
  console.log(`${'═'.repeat(80)}\n`);

  const stats = {
    total: drivers.length,
    online: drivers.filter(d => d.isOnline === '✓ Online').length,
    available: drivers.filter(d => d.isAvailable === '✓ Yes').length,
    onboardingComplete: drivers.filter(d => d.onboardingComplete === '✓ Yes').length,
    withProfilePic: drivers.filter(d => d.profilePic === '✓ Yes').length,
    withVehiclePhoto: drivers.filter(d => d.vehiclePhoto === '✓ Yes').length,
    
    // By status
    pending: drivers.filter(d => d.status === 'pending').length,
    approved: drivers.filter(d => d.status === 'approved').length,
    active: drivers.filter(d => d.status === 'active').length,
    suspended: drivers.filter(d => d.status === 'suspended').length,
    
    // By vehicle type
    standard: drivers.filter(d => d.vehicleType === 'standard').length,
    suv: drivers.filter(d => d.vehicleType === 'suv').length,
    luxury: drivers.filter(d => d.vehicleType === 'luxury').length,
    van: drivers.filter(d => d.vehicleType === 'van').length,
    
    // Specialty
    wheelchair: drivers.filter(d => d.specialtyType?.includes('wheelchair')).length,
    medical: drivers.filter(d => d.specialtyType?.includes('medical')).length,
  };

  console.log(`${colors.bright}Total Unique Drivers:${colors.reset} ${stats.total}`);
  console.log();
  console.log(`${colors.bright}Status:${colors.reset}`);
  console.log(`  Currently Online: ${colors.green}${stats.online}${colors.reset} / ${stats.total}`);
  console.log(`  Available for Rides: ${colors.green}${stats.available}${colors.reset} / ${stats.total}`);
  console.log(`  Onboarding Complete: ${colors.green}${stats.onboardingComplete}${colors.reset} / ${stats.total}`);
  console.log();
  console.log(`${colors.bright}Application Status:${colors.reset}`);
  console.log(`  Pending: ${stats.pending}`);
  console.log(`  Approved: ${stats.approved}`);
  console.log(`  Active: ${stats.active}`);
  console.log(`  Suspended: ${stats.suspended}`);
  console.log();
  console.log(`${colors.bright}Profile Completion:${colors.reset}`);
  console.log(`  With Profile Picture: ${colors.green}${stats.withProfilePic}${colors.reset} / ${stats.total}`);
  console.log(`  With Vehicle Photo: ${colors.green}${stats.withVehiclePhoto}${colors.reset} / ${stats.total}`);
  console.log();
  console.log(`${colors.bright}Vehicle Types:${colors.reset}`);
  console.log(`  Standard: ${stats.standard}`);
  console.log(`  SUV: ${stats.suv}`);
  console.log(`  Luxury: ${stats.luxury}`);
  console.log(`  Van: ${stats.van}`);
  console.log();
  console.log(`${colors.bright}Specialty Services:${colors.reset}`);
  console.log(`  Wheelchair Accessible: ${stats.wheelchair}`);
  console.log(`  Medical Transport: ${stats.medical}`);

  if (analysis.duplicates.length > 0) {
    console.log();
    console.log(`${colors.yellow}⚠️  DUPLICATES FOUND: ${analysis.duplicates.length} drivers in both collections${colors.reset}`);
  }

  console.log(`\n${'═'.repeat(80)}\n`);
}

// Run the script
listDrivers();

