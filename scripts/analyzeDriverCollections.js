#!/usr/bin/env node

/**
 * Analyze Driver Collections
 * 
 * Compares 'drivers' and 'driverApplications' collections
 * Shows which is being actively used and recommends consolidation
 * 
 * Usage: node scripts/analyzeDriverCollections.js
 */

const admin = require('firebase-admin');

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

async function analyzeCollections() {
  try {
    console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}🔍 DRIVER COLLECTIONS ANALYSIS${colors.reset}`);
    console.log(`${colors.bright}${'═'.repeat(80)}${colors.reset}\n`);

    // Fetch both collections
    console.log(`${colors.gray}Fetching data...${colors.reset}\n`);
    
    const [driversSnap, appsSnap] = await Promise.all([
      db.collection('drivers').get(),
      db.collection('driverApplications').get()
    ]);

    const driversData = [];
    const appsData = [];
    
    driversSnap.forEach(doc => {
      driversData.push({ id: doc.id, ...doc.data() });
    });
    
    appsSnap.forEach(doc => {
      appsData.push({ id: doc.id, ...doc.data() });
    });

    console.log(`${colors.blue}📁 'drivers' collection:${colors.reset} ${driversData.length} documents`);
    console.log(`${colors.cyan}📁 'driverApplications' collection:${colors.reset} ${appsData.length} documents\n`);

    // Find overlaps
    const driversUserIds = new Set(driversData.map(d => d.userId || d.id));
    const appsUserIds = new Set(appsData.map(d => d.userId || d.id));
    
    const inBoth = [...driversUserIds].filter(uid => appsUserIds.has(uid));
    const onlyInDrivers = [...driversUserIds].filter(uid => !appsUserIds.has(uid));
    const onlyInApps = [...appsUserIds].filter(uid => !driversUserIds.has(uid));

    // Analysis
    console.log(`${colors.bright}📊 OVERLAP ANALYSIS${colors.reset}`);
    console.log(`${'─'.repeat(80)}\n`);
    
    console.log(`${colors.yellow}In BOTH collections:${colors.reset} ${inBoth.length} drivers`);
    console.log(`${colors.blue}Only in 'drivers':${colors.reset} ${onlyInDrivers.length} drivers`);
    console.log(`${colors.cyan}Only in 'driverApplications':${colors.reset} ${onlyInApps.length} drivers\n`);

    // Check data freshness
    const driversRecent = driversData.filter(d => {
      const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
      const daysSince = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;

    const appsRecent = appsData.filter(d => {
      const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
      const daysSince = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;

    console.log(`${colors.bright}📅 RECENT ACTIVITY (Last 30 days)${colors.reset}`);
    console.log(`${'─'.repeat(80)}\n`);
    console.log(`${colors.blue}'drivers':${colors.reset} ${driversRecent} new records`);
    console.log(`${colors.cyan}'driverApplications':${colors.reset} ${appsRecent} new records\n`);

    // Data completeness
    const driversComplete = driversData.filter(d => 
      d.vehicleInfo && d.personalInfo && d.onboardingStatus?.completed
    ).length;

    const appsComplete = appsData.filter(d => 
      (d.vehicleInfo || d.vehicle_info) && d.personalInfo && d.onboardingStatus?.completed
    ).length;

    console.log(`${colors.bright}✅ DATA COMPLETENESS${colors.reset}`);
    console.log(`${'─'.repeat(80)}\n`);
    console.log(`${colors.blue}'drivers' with complete data:${colors.reset} ${driversComplete} / ${driversData.length}`);
    console.log(`${colors.cyan}'driverApplications' with complete data:${colors.reset} ${appsComplete} / ${appsData.length}\n`);

    // Recommendations
    console.log(`${colors.bright}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}💡 RECOMMENDATION${colors.reset}`);
    console.log(`${'═'.repeat(80)}\n`);

    if (driversData.length === 0 && appsData.length > 0) {
      console.log(`${colors.green}✓ 'drivers' collection is EMPTY${colors.reset}`);
      console.log(`${colors.green}✓ 'driverApplications' is the active collection${colors.reset}`);
      console.log(`${colors.green}✓ NO MIGRATION NEEDED - System is consistent!${colors.reset}\n`);
      console.log(`${colors.bright}Action:${colors.reset} Continue using 'driverApplications' collection.`);
    } else if (appsData.length === 0 && driversData.length > 0) {
      console.log(`${colors.green}✓ 'driverApplications' collection is EMPTY${colors.reset}`);
      console.log(`${colors.green}✓ 'drivers' is the active collection${colors.reset}`);
      console.log(`${colors.green}✓ NO MIGRATION NEEDED - System is consistent!${colors.reset}\n`);
      console.log(`${colors.bright}Action:${colors.reset} Continue using 'drivers' collection.`);
    } else if (inBoth.length > 0) {
      console.log(`${colors.red}⚠️  INCONSISTENCY DETECTED${colors.reset}\n`);
      console.log(`${inBoth.length} drivers exist in BOTH collections, which can cause:`);
      console.log(`  • Data synchronization issues`);
      console.log(`  • Conflicting information`);
      console.log(`  • Mobile app vs Web app mismatches\n`);
      
      if (appsRecent > driversRecent) {
        console.log(`${colors.bright}Recommended Action:${colors.reset}`);
        console.log(`  ${colors.cyan}Use 'driverApplications' as primary${colors.reset} (more recent activity)`);
        console.log(`  Migrate data from 'drivers' → 'driverApplications'`);
        console.log(`  Update web app to use 'driverApplications'`);
      } else {
        console.log(`${colors.bright}Recommended Action:${colors.reset}`);
        console.log(`  ${colors.blue}Use 'drivers' as primary${colors.reset} (more recent activity)`);
        console.log(`  Migrate data from 'driverApplications' → 'drivers'`);
        console.log(`  Update mobile apps to use 'drivers'`);
      }
    } else {
      console.log(`${colors.yellow}⚠️  BOTH COLLECTIONS IN USE (no overlap)${colors.reset}\n`);
      console.log(`Different drivers in each collection suggests:`);
      console.log(`  • Web-created drivers go to 'drivers'`);
      console.log(`  • Mobile-created drivers go to 'driverApplications'\n`);
      
      console.log(`${colors.bright}Recommended Action:${colors.reset}`);
      console.log(`  Consolidate to ONE collection for consistency`);
      console.log(`  Update all apps to use the same collection`);
    }

    console.log(`\n${'═'.repeat(80)}\n`);

    // Show sample data comparison if duplicates exist
    if (inBoth.length > 0) {
      console.log(`${colors.bright}📋 SAMPLE DUPLICATE COMPARISON${colors.reset}`);
      console.log(`${'─'.repeat(80)}\n`);
      
      const sampleUserId = inBoth[0];
      const driverRecord = driversData.find(d => (d.userId || d.id) === sampleUserId);
      const appRecord = appsData.find(d => (d.userId || d.id) === sampleUserId);
      
      console.log(`Sample User ID: ${colors.gray}${sampleUserId}${colors.reset}\n`);
      
      console.log(`${colors.blue}In 'drivers':${colors.reset}`);
      console.log(`  Name: ${driverRecord.firstName} ${driverRecord.lastName}`);
      console.log(`  Email: ${driverRecord.email}`);
      console.log(`  Vehicle: ${driverRecord.vehicle}`);
      console.log(`  Status: ${driverRecord.status}`);
      console.log(`  Onboarding: ${driverRecord.onboardingComplete}\n`);
      
      console.log(`${colors.cyan}In 'driverApplications':${colors.reset}`);
      console.log(`  Name: ${appRecord.firstName} ${appRecord.lastName}`);
      console.log(`  Email: ${appRecord.email}`);
      console.log(`  Vehicle: ${appRecord.vehicle}`);
      console.log(`  Status: ${appRecord.status}`);
      console.log(`  Onboarding: ${appRecord.onboardingComplete}\n`);
      
      console.log(`${colors.gray}Use this to verify which collection has more complete/current data${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error in analysis:${colors.reset}`, error);
  }
}

// Run the script
analyzeCollections();

