#!/usr/bin/env node

/**
 * Migrate Drivers Collection
 * 
 * Migrates all driver data from 'drivers' collection to 'driverApplications'
 * Handles duplicates intelligently by merging data
 * 
 * Usage: node scripts/migrateDriversCollection.js
 * 
 * IMPORTANT: This script makes changes to your database!
 * Review the plan before confirming migration.
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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
 * Merge driver data (prioritize most complete data)
 */
function mergeDriverData(driversData, appsData) {
  const merged = { ...appsData };

  // Merge fields, preferring non-empty values
  Object.keys(driversData).forEach(key => {
    if (driversData[key] && !appsData[key]) {
      merged[key] = driversData[key];
    } else if (typeof driversData[key] === 'object' && typeof appsData[key] === 'object') {
      // Deep merge for objects
      merged[key] = { ...appsData[key], ...driversData[key] };
    }
  });

  // Prefer newer timestamp
  if (driversData.updatedAt && appsData.updatedAt) {
    const driversTime = driversData.updatedAt.toDate ? driversData.updatedAt.toDate() : new Date(driversData.updatedAt);
    const appsTime = appsData.updatedAt.toDate ? appsData.updatedAt.toDate() : new Date(appsData.updatedAt);
    
    if (driversTime > appsTime) {
      merged.updatedAt = driversData.updatedAt;
    }
  }

  return merged;
}

/**
 * Analyze migration
 */
async function analyzeMigration() {
  console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}🔄 DRIVER COLLECTION MIGRATION ANALYSIS${colors.reset}`);
  console.log(`${colors.bright}${'═'.repeat(80)}${colors.reset}\n`);

  // Fetch both collections
  const [driversSnap, appsSnap] = await Promise.all([
    db.collection('drivers').get(),
    db.collection('driverApplications').get()
  ]);

  const driversMap = new Map();
  const appsMap = new Map();

  driversSnap.forEach(doc => {
    driversMap.set(doc.id, { id: doc.id, ...doc.data() });
  });

  appsSnap.forEach(doc => {
    appsMap.set(doc.id, { id: doc.id, ...doc.data() });
  });

  console.log(`${colors.blue}'drivers' collection:${colors.reset} ${driversMap.size} documents`);
  console.log(`${colors.cyan}'driverApplications' collection:${colors.reset} ${appsMap.size} documents\n`);

  // Categorize records
  const toMigrate = [];
  const toMerge = [];
  const alreadyMigrated = [];

  driversMap.forEach((driverData, userId) => {
    if (appsMap.has(userId)) {
      toMerge.push({ userId, driversData: driverData, appsData: appsMap.get(userId) });
    } else {
      toMigrate.push({ userId, data: driverData });
    }
  });

  appsMap.forEach((appData, userId) => {
    if (!driversMap.has(userId)) {
      alreadyMigrated.push({ userId, data: appData });
    }
  });

  console.log(`${colors.bright}Migration Plan:${colors.reset}\n`);
  console.log(`${colors.green}✓ Already in 'driverApplications' only:${colors.reset} ${alreadyMigrated.length} drivers (no action needed)`);
  console.log(`${colors.blue}→ To migrate (copy):${colors.reset} ${toMigrate.length} drivers`);
  console.log(`${colors.yellow}⚠ To merge (in both):${colors.reset} ${toMerge.length} drivers\n`);

  if (toMigrate.length === 0 && toMerge.length === 0) {
    console.log(`${colors.green}✓✓✓ NO MIGRATION NEEDED! ✓✓✓${colors.reset}`);
    console.log(`All driver data is already in 'driverApplications' collection.\n`);
    return null;
  }

  return { toMigrate, toMerge, driversMap, appsMap };
}

/**
 * Perform migration
 */
async function performMigration(plan) {
  const { toMigrate, toMerge } = plan;
  const results = {
    migrated: 0,
    merged: 0,
    errors: []
  };

  console.log(`\n${colors.bright}Starting migration...${colors.reset}\n`);

  // Migrate new records
  for (const { userId, data } of toMigrate) {
    try {
      await db.collection('driverApplications').doc(userId).set(data);
      results.migrated++;
      console.log(`${colors.green}✓${colors.reset} Migrated: ${data.personalInfo?.firstName || 'Unknown'} ${data.personalInfo?.lastName || ''} (${userId.slice(0, 8)}...)`);
    } catch (error) {
      results.errors.push({ userId, error: error.message });
      console.log(`${colors.red}✗${colors.reset} Failed: ${userId} - ${error.message}`);
    }
  }

  // Merge duplicate records
  for (const { userId, driversData, appsData } of toMerge) {
    try {
      const merged = mergeDriverData(driversData, appsData);
      await db.collection('driverApplications').doc(userId).set(merged, { merge: true });
      results.merged++;
      console.log(`${colors.yellow}⚡${colors.reset} Merged: ${merged.personalInfo?.firstName || 'Unknown'} ${merged.personalInfo?.lastName || ''} (${userId.slice(0, 8)}...)`);
    } catch (error) {
      results.errors.push({ userId, error: error.message });
      console.log(`${colors.red}✗${colors.reset} Failed merge: ${userId} - ${error.message}`);
    }
  }

  return results;
}

/**
 * Main execution
 */
async function migrate() {
  try {
    // Analyze
    const plan = await analyzeMigration();

    if (!plan) {
      console.log(`${colors.green}No migration needed. Exiting.${colors.reset}\n`);
      process.exit(0);
    }

    // Ask for confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`\n${colors.yellow}⚠️  This will modify your database. Continue? (yes/no): ${colors.reset}`, async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log(`\n${colors.gray}Migration cancelled.${colors.reset}\n`);
        rl.close();
        process.exit(0);
      }

      rl.close();

      // Perform migration
      const results = await performMigration(plan);

      // Print results
      console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`);
      console.log(`${colors.bright}📊 MIGRATION RESULTS${colors.reset}`);
      console.log(`${'═'.repeat(80)}\n`);

      console.log(`${colors.green}✓ Migrated:${colors.reset} ${results.migrated} drivers`);
      console.log(`${colors.yellow}⚡ Merged:${colors.reset} ${results.merged} drivers`);
      
      if (results.errors.length > 0) {
        console.log(`${colors.red}✗ Errors:${colors.reset} ${results.errors.length}`);
        results.errors.forEach(err => {
          console.log(`  ${colors.red}•${colors.reset} ${err.userId}: ${err.error}`);
        });
      }

      console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
      console.log(`1. Verify data in Firebase Console`);
      console.log(`2. Test driver onboarding flow`);
      console.log(`3. Test mobile apps`);
      console.log(`4. Once verified, you can safely delete the 'drivers' collection\n`);

      console.log(`${colors.yellow}⚠️  NOTE: The 'drivers' collection has NOT been deleted.${colors.reset}`);
      console.log(`   Data has been copied/merged to 'driverApplications'.`);
      console.log(`   Keep 'drivers' as backup until you verify everything works.\n`);

      process.exit(0);
    });

  } catch (error) {
    console.error(`${colors.red}❌ Migration error:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the script
migrate();

