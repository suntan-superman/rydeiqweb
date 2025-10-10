#!/usr/bin/env node

/**
 * Export Users and Driver Applications to CSV
 * 
 * Exports all data from 'users' and 'driverApplications' collections to CSV files
 * Creates two CSV files: users.csv and driver-applications.csv
 * 
 * Usage: node scripts/exportUsersAndDriversToCSV.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
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
 * Convert Firestore data to flat object for CSV
 */
function flattenUserData(userData, docId) {
  const flat = {
    // ID
    uid: docId,
    
    // Basic Info
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    phone: userData.phone || userData.phoneNumber || '',
    
    // Account Info
    userType: userData.userType || '',
    role: userData.role || '',
    emailVerified: userData.emailVerified ? 'Yes' : 'No',
    onboardingCompleted: userData.onboardingCompleted ? 'Yes' : 'No',
    
    // Profile
    photoURL: userData.photoURL || '',
    bio: userData.bio || '',
    
    // Emergency Contact
    emergencyContactName: userData.emergencyContact?.name || '',
    emergencyContactPhone: userData.emergencyContact?.phone || '',
    emergencyContactRelationship: userData.emergencyContact?.relationship || '',
    
    // Payment
    paymentMethodType: userData.paymentMethod?.type || '',
    
    // Dates
    createdAt: userData.createdAt ? formatDate(userData.createdAt) : '',
    updatedAt: userData.updatedAt ? formatDate(userData.updatedAt) : '',
    lastSeen: userData.lastSeen ? formatDate(userData.lastSeen) : '',
    
    // Settings
    language: userData.settings?.language || 'en',
    theme: userData.settings?.theme || 'light',
    
    // Stats (if available)
    totalRides: userData.totalRides || 0,
    rating: userData.rating || '',
  };

  return flat;
}

/**
 * Convert Driver Application data to flat object for CSV
 */
function flattenDriverData(driverData, docId) {
  const flat = {
    // ID
    uid: docId,
    userId: driverData.userId || docId,
    
    // Personal Info
    firstName: driverData.personalInfo?.firstName || driverData.firstName || '',
    lastName: driverData.personalInfo?.lastName || driverData.lastName || '',
    email: driverData.personalInfo?.email || driverData.email || '',
    phone: driverData.personalInfo?.phone || driverData.phone || '',
    dateOfBirth: driverData.personalInfo?.dateOfBirth || '',
    
    // Driver License
    licenseNumber: driverData.licenseInfo?.licenseNumber || driverData.license_info?.licenseNumber || '',
    licenseState: driverData.licenseInfo?.state || driverData.license_info?.state || '',
    licenseExpiry: driverData.licenseInfo?.expiryDate || driverData.license_info?.expiryDate || '',
    
    // Vehicle Info
    vehicleType: driverData.vehicleInfo?.vehicleType || driverData.vehicle_info?.vehicleType || '',
    vehicleYear: driverData.vehicleInfo?.year || driverData.vehicle_info?.year || '',
    vehicleMake: driverData.vehicleInfo?.make || driverData.vehicle_info?.make || '',
    vehicleModel: driverData.vehicleInfo?.model || driverData.vehicle_info?.model || '',
    vehicleColor: driverData.vehicleInfo?.color || driverData.vehicle_info?.color || '',
    licensePlate: driverData.vehicleInfo?.licensePlate || driverData.vehicle_info?.licensePlate || '',
    vin: driverData.vehicleInfo?.vin || driverData.vehicle_info?.vin || '',
    
    // Vehicle Photos
    vehiclePhotoFront: driverData.vehicleInfo?.photos?.front?.url || driverData.vehicle_info?.photos?.front?.url || '',
    vehiclePhotoBack: driverData.vehicleInfo?.photos?.back?.url || driverData.vehicle_info?.photos?.back?.url || '',
    vehiclePhotoLeft: driverData.vehicleInfo?.photos?.left?.url || driverData.vehicle_info?.photos?.left?.url || '',
    vehiclePhotoRight: driverData.vehicleInfo?.photos?.right?.url || driverData.vehicle_info?.photos?.right?.url || '',
    vehiclePhotoInterior: driverData.vehicleInfo?.photos?.interior?.url || driverData.vehicle_info?.photos?.interior?.url || '',
    
    // Insurance
    insuranceProvider: driverData.insuranceInfo?.provider || driverData.insurance_info?.provider || '',
    insurancePolicyNumber: driverData.insuranceInfo?.policyNumber || driverData.insurance_info?.policyNumber || '',
    insuranceExpiry: driverData.insuranceInfo?.expiryDate || driverData.insurance_info?.expiryDate || '',
    
    // Specialty Vehicle
    specialtyVehicleType: driverData.specialtyVehicleInfo?.specialtyVehicleType || driverData.specialty_vehicle_info?.specialtyVehicleType || '',
    serviceCapabilities: (() => {
      const caps = driverData.specialtyVehicleInfo?.serviceCapabilities || driverData.specialty_vehicle_info?.serviceCapabilities;
      return Array.isArray(caps) ? caps.join('; ') : (caps || '');
    })(),
    
    // Medical Certifications (if medical driver)
    medicalCertifications: Array.isArray(driverData.medicalCertifications) 
      ? driverData.medicalCertifications.map(cert => 
          `${cert.type}: ${cert.number} (exp: ${cert.expiryDate})`
        ).join('; ')
      : (driverData.medicalCertifications || ''),
    
    // Documents
    profilePhotoURL: driverData.documents?.profile_photo?.url || '',
    licensePhotoFront: driverData.documents?.license_front?.url || '',
    licensePhotoBack: driverData.documents?.license_back?.url || '',
    insuranceCard: driverData.documents?.insurance_card?.url || '',
    vehicleRegistration: driverData.documents?.vehicle_registration?.url || '',
    
    // Status
    status: driverData.status || '',
    approvalStatus: driverData.approvalStatus?.status || '',
    approvalNotes: driverData.approvalStatus?.notes || '',
    approvalDate: driverData.approvalStatus?.date ? formatDate(driverData.approvalStatus.date) : '',
    rejectionReason: driverData.approvalStatus?.rejectionReason || '',
    
    // Onboarding
    onboardingCompleted: driverData.onboardingStatus?.completed || driverData.onboardingCompleted ? 'Yes' : 'No',
    onboardingStepsCompleted: (() => {
      const steps = driverData.onboardingStatus?.stepsCompleted;
      return Array.isArray(steps) ? steps.join('; ') : (steps || '');
    })(),
    
    // Availability
    isOnline: driverData.isOnline ? 'Yes' : 'No',
    isAvailable: driverData.isAvailable ? 'Yes' : 'No',
    currentLocation: driverData.currentLocation ? `${driverData.currentLocation.latitude},${driverData.currentLocation.longitude}` : '',
    
    // Availability Schedule
    availabilityEnabled: driverData.availability?.enabled ? 'Yes' : 'No',
    availableDays: (() => {
      const days = driverData.availability?.days;
      return Array.isArray(days) ? days.join('; ') : (days || '');
    })(),
    
    // Pricing (driver's rates)
    perMile: driverData.pricing?.perMile || '',
    perMinute: driverData.pricing?.perMinute || '',
    baseFare: driverData.pricing?.baseFare || '',
    
    // Performance Metrics
    averageRating: driverData.ratingStats?.driver?.averageRating || driverData.metrics?.rating || '',
    totalRatings: driverData.ratingStats?.driver?.totalRatings || driverData.metrics?.totalRatings || 0,
    totalRides: driverData.metrics?.totalRides || 0,
    totalEarnings: driverData.metrics?.totalEarnings || 0,
    acceptanceRate: driverData.metrics?.acceptanceRate || '',
    cancellationRate: driverData.metrics?.cancellationRate || '',
    
    // Preferences
    preferredRideTypes: (() => {
      const types = driverData.preferences?.rideTypes;
      return Array.isArray(types) ? types.join('; ') : (types || '');
    })(),
    maximumDistance: driverData.preferences?.maximumDistance || '',
    minimumFare: driverData.preferences?.minimumFare || '',
    
    // Dates
    createdAt: driverData.createdAt ? formatDate(driverData.createdAt) : '',
    updatedAt: driverData.updatedAt ? formatDate(driverData.updatedAt) : '',
    lastActive: driverData.lastActive ? formatDate(driverData.lastActive) : '',
    approvedAt: driverData.approvedAt ? formatDate(driverData.approvedAt) : '',
  };

  return flat;
}

/**
 * Format Firestore timestamp to readable date
 */
function formatDate(timestamp) {
  try {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = timestamp;
    }
    
    return date.toISOString();
  } catch (error) {
    return '';
  }
}

/**
 * Escape CSV values
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data) {
  if (data.length === 0) return '';
  
  // Get all unique keys from all objects
  const allKeys = new Set();
  data.forEach(obj => {
    Object.keys(obj).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // CSV Header
  let csv = headers.map(escapeCSV).join(',') + '\n';
  
  // CSV Rows
  data.forEach(obj => {
    const row = headers.map(header => escapeCSV(obj[header] || ''));
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

/**
 * Export users to CSV
 */
async function exportUsers() {
  try {
    console.log(`${colors.gray}Fetching users from Firestore...${colors.reset}`);
    
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const userData = flattenUserData(doc.data(), doc.id);
      users.push(userData);
    });
    
    console.log(`${colors.green}✓ Found ${users.length} users${colors.reset}`);
    
    // Generate CSV
    const csv = arrayToCSV(users);
    
    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `users-export-${timestamp}.csv`;
    fs.writeFileSync(filename, csv);
    
    console.log(`${colors.green}✓ Exported to ${filename}${colors.reset}`);
    console.log(`${colors.gray}  File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB${colors.reset}`);
    
    return { filename, count: users.length };
    
  } catch (error) {
    console.error(`${colors.red}❌ Error exporting users:${colors.reset}`, error);
    throw error;
  }
}

/**
 * Export driver applications to CSV
 */
async function exportDriverApplications() {
  try {
    console.log(`${colors.gray}Fetching driver applications from Firestore...${colors.reset}`);
    
    const driversSnapshot = await db.collection('driverApplications').get();
    const drivers = [];
    
    driversSnapshot.forEach(doc => {
      const driverData = flattenDriverData(doc.data(), doc.id);
      drivers.push(driverData);
    });
    
    console.log(`${colors.blue}✓ Found ${drivers.length} driver applications${colors.reset}`);
    
    // Generate CSV
    const csv = arrayToCSV(drivers);
    
    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `driver-applications-export-${timestamp}.csv`;
    fs.writeFileSync(filename, csv);
    
    console.log(`${colors.green}✓ Exported to ${filename}${colors.reset}`);
    console.log(`${colors.gray}  File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB${colors.reset}`);
    
    return { filename, count: drivers.length };
    
  } catch (error) {
    console.error(`${colors.red}❌ Error exporting driver applications:${colors.reset}`, error);
    throw error;
  }
}

/**
 * Create combined export with user + driver data merged
 */
async function exportCombined() {
  try {
    console.log(`${colors.gray}Creating combined export...${colors.reset}`);
    
    // Fetch users
    const usersSnapshot = await db.collection('users').get();
    const usersMap = new Map();
    
    usersSnapshot.forEach(doc => {
      usersMap.set(doc.id, { uid: doc.id, ...doc.data() });
    });
    
    // Fetch driver applications
    const driversSnapshot = await db.collection('driverApplications').get();
    const combined = [];
    
    // Combine user + driver data
    driversSnapshot.forEach(doc => {
      const driverData = doc.data();
      const userId = driverData.userId || doc.id;
      const userData = usersMap.get(userId) || {};
      
      // Merge user and driver data
      const merged = {
        // User fields
        ...flattenUserData(userData, userId),
        
        // Driver fields (prefixed with 'driver_')
        driver_status: driverData.status || '',
        driver_approvalStatus: driverData.approvalStatus?.status || '',
        driver_vehicleType: driverData.vehicleInfo?.vehicleType || driverData.vehicle_info?.vehicleType || '',
        driver_vehicleYear: driverData.vehicleInfo?.year || driverData.vehicle_info?.year || '',
        driver_vehicleMake: driverData.vehicleInfo?.make || driverData.vehicle_info?.make || '',
        driver_vehicleModel: driverData.vehicleInfo?.model || driverData.vehicle_info?.model || '',
        driver_vehicleColor: driverData.vehicleInfo?.color || driverData.vehicle_info?.color || '',
        driver_licensePlate: driverData.vehicleInfo?.licensePlate || driverData.vehicle_info?.licensePlate || '',
        driver_vin: driverData.vehicleInfo?.vin || driverData.vehicle_info?.vin || '',
        driver_licenseNumber: driverData.licenseInfo?.licenseNumber || driverData.license_info?.licenseNumber || '',
        driver_licenseState: driverData.licenseInfo?.state || driverData.license_info?.state || '',
        driver_licenseExpiry: driverData.licenseInfo?.expiryDate || driverData.license_info?.expiryDate || '',
        driver_insuranceProvider: driverData.insuranceInfo?.provider || driverData.insurance_info?.provider || '',
        driver_insurancePolicyNumber: driverData.insuranceInfo?.policyNumber || driverData.insurance_info?.policyNumber || '',
        driver_insuranceExpiry: driverData.insuranceInfo?.expiryDate || driverData.insurance_info?.expiryDate || '',
        driver_specialtyVehicleType: driverData.specialtyVehicleInfo?.specialtyVehicleType || driverData.specialty_vehicle_info?.specialtyVehicleType || '',
        driver_serviceCapabilities: (() => {
          const caps = driverData.specialtyVehicleInfo?.serviceCapabilities || driverData.specialty_vehicle_info?.serviceCapabilities;
          return Array.isArray(caps) ? caps.join('; ') : (caps || '');
        })(),
        driver_isOnline: driverData.isOnline ? 'Yes' : 'No',
        driver_isAvailable: driverData.isAvailable ? 'Yes' : 'No',
        driver_rating: driverData.ratingStats?.driver?.averageRating || driverData.metrics?.rating || '',
        driver_totalRides: driverData.metrics?.totalRides || driverData.ratingStats?.driver?.totalRatings || 0,
        driver_totalEarnings: driverData.metrics?.totalEarnings || 0,
        driver_onboardingCompleted: driverData.onboardingStatus?.completed || driverData.onboardingCompleted ? 'Yes' : 'No',
        driver_createdAt: driverData.createdAt ? formatDate(driverData.createdAt) : '',
        driver_approvedAt: driverData.approvedAt ? formatDate(driverData.approvedAt) : '',
      };
      
      combined.push(merged);
    });
    
    console.log(`${colors.cyan}✓ Combined ${combined.length} driver records with user data${colors.reset}`);
    
    // Generate CSV
    const csv = arrayToCSV(combined);
    
    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `combined-users-drivers-${timestamp}.csv`;
    fs.writeFileSync(filename, csv);
    
    console.log(`${colors.green}✓ Exported to ${filename}${colors.reset}`);
    console.log(`${colors.gray}  File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB${colors.reset}`);
    
    return { filename, count: combined.length };
    
  } catch (error) {
    console.error(`${colors.red}❌ Error creating combined export:${colors.reset}`, error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}📊 ANYRYDE DATA EXPORT TO CSV${colors.reset}`);
    console.log(`${colors.bright}${'═'.repeat(80)}${colors.reset}\n`);
    
    console.log(`${colors.cyan}This script will export:${colors.reset}`);
    console.log(`  1. All users from 'users' collection`);
    console.log(`  2. All driver applications from 'driverApplications' collection`);
    console.log(`  3. Combined export with merged user + driver data\n`);
    
    // Export users
    console.log(`${colors.bright}[1/3] Exporting Users...${colors.reset}`);
    const usersResult = await exportUsers();
    console.log();
    
    // Export driver applications
    console.log(`${colors.bright}[2/3] Exporting Driver Applications...${colors.reset}`);
    const driversResult = await exportDriverApplications();
    console.log();
    
    // Create combined export
    console.log(`${colors.bright}[3/3] Creating Combined Export...${colors.reset}`);
    const combinedResult = await exportCombined();
    console.log();
    
    // Summary
    console.log(`${colors.bright}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}✅ EXPORT COMPLETE!${colors.reset}`);
    console.log(`${colors.bright}${'═'.repeat(80)}${colors.reset}\n`);
    
    console.log(`${colors.green}✓ Users:${colors.reset} ${usersResult.count} exported to ${usersResult.filename}`);
    console.log(`${colors.blue}✓ Driver Applications:${colors.reset} ${driversResult.count} exported to ${driversResult.filename}`);
    console.log(`${colors.cyan}✓ Combined:${colors.reset} ${combinedResult.count} exported to ${combinedResult.filename}`);
    
    console.log(`\n${colors.yellow}📁 Files created in current directory:${colors.reset}`);
    console.log(`   • ${usersResult.filename}`);
    console.log(`   • ${driversResult.filename}`);
    console.log(`   • ${combinedResult.filename}`);
    
    console.log(`\n${colors.gray}💡 Tip: Open these files in Excel or Google Sheets for analysis${colors.reset}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error(`${colors.red}\n❌ Export failed:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the script
main();

