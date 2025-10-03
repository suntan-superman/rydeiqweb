/**
 * Force Create Medical Test Driver Applications
 * 
 * This script creates driver applications for existing Firebase Auth accounts.
 * Use this when the Auth accounts already exist but driver applications are missing.
 * 
 * Run: node force-create-medical-drivers.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Using service account key file');
}

const db = admin.firestore();
const auth = admin.auth();

// Import the medical test drivers data
const { medicalTestDrivers } = require('./create-medical-test-drivers.js');

async function forceCreateMedicalDriverApplications() {
  try {
    console.log('🚀 Force creating medical test driver applications...\n');
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const driver of medicalTestDrivers) {
      try {
        // Try to get existing user by email
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(driver.email);
          console.log(`✅ Found existing auth user: ${driver.email} (${userRecord.uid})`);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            // Create new auth user if not found
            userRecord = await auth.createUser({
              email: driver.email,
              password: 'MedicalDriver123!',
              displayName: `${driver.firstName} ${driver.lastName}`,
              emailVerified: true
            });
            console.log(`✅ Created new auth user: ${driver.email} (${userRecord.uid})`);
          } else {
            throw error;
          }
        }
        
        // Check if driver application already exists
        const existingApp = await db.collection('driverApplications').doc(userRecord.uid).get();
        
        if (existingApp.exists) {
          console.log(`⚠️  Driver application already exists for ${driver.email}, skipping...`);
          skipped++;
          continue;
        }
        
        // Create driver application document with proper structure
        const driverData = {
          userId: userRecord.uid,
          email: driver.email,
          status: driver.status,
          currentStep: 'submitted',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          
          // Personal Information (nested structure)
          personalInfo: {
            firstName: driver.firstName,
            lastName: driver.lastName,
            email: driver.email,
            phone: driver.phone,
            dateOfBirth: '1990-01-01',
            address: {
              street: '123 Medical Drive',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94102'
            }
          },
          
          // Vehicle Information
          vehicleInfo: driver.vehicleInfo,
          
          // Specialty Vehicle Info for medical capabilities
          specialtyVehicleInfo: {
            specialtyVehicleType: driver.vehicleInfo.vehicleType,
            serviceCapabilities: driver.vehicleInfo.serviceCapabilities || [],
            certificationFiles: {}
          },
          
          // Documents (placeholder - all approved)
          documents: {
            driversLicense: { url: 'test://license.pdf', status: 'approved' },
            vehicleRegistration: { url: 'test://registration.pdf', status: 'approved' },
            vehicleInsurance: { url: 'test://insurance.pdf', status: 'approved' },
            profilePhoto: { url: 'test://photo.jpg', status: 'approved' }
          },
          
          // Background Check (approved)
          backgroundCheck: {
            ssn: '***-**-****',
            currentAddress: {
              street: '123 Medical Drive',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94102',
              yearsAtAddress: '3'
            },
            consentBackgroundCheck: true,
            consentCriminalHistory: true,
            consentDrivingRecord: true,
            understandTimeline: true
          },
          
          // Payout Setup (placeholder)
          payoutInfo: {
            accountHolderName: `${driver.firstName} ${driver.lastName}`,
            bankName: 'Test Bank',
            routingNumber: '123456789',
            accountNumber: '****1234',
            accountType: 'checking'
          },
          
          // Availability
          availability: driver.availability,
          
          // Admin notes
          adminNotes: [`Test medical driver - ${driver.testDriverType}`],
          
          // Step Progress (all completed)
          stepProgress: {
            personal_info: true,
            document_upload: true,
            vehicle_info: true,
            background_check: true,
            payout_setup: true,
            availability: true,
            review: true
          },
          
          // Onboarding Status (completed)
          onboardingStatus: {
            completed: true,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            completedBy: 'system',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          },
          
          // Approval Status (approved)
          approvalStatus: {
            status: 'approved',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            approvedBy: 'system',
            notes: 'Auto-approved test driver with medical capabilities'
          },
          
          // Mobile App Status
          mobileAppStatus: {
            accountCreated: true,
            accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastMobileLogin: null
          },
          
          // Medical Certifications
          medicalCertifications: driver.medicalCertifications,
          
          // Ratings and Stats
          rating: driver.rating,
          completedRides: driver.completedRides,
          medicalTransportRides: driver.medicalTransportRides,
          
          // Test metadata
          isTestDriver: driver.isTestDriver,
          testDriverType: driver.testDriverType,
          
          // Last active
          lastActiveAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Create driver application
        await db.collection('driverApplications').doc(userRecord.uid).set(driverData);
        console.log(`✅ Created driver application for ${driver.firstName} ${driver.lastName} (${driver.testDriverType})\n`);
        created++;
        
      } catch (error) {
        console.error(`❌ Error processing ${driver.firstName} ${driver.lastName}:`, error.message);
        errors++;
      }
    }
    
    console.log('═'.repeat(80));
    console.log('\n🎉 Process completed!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${created} driver application(s)`);
    console.log(`   ⚠️  Skipped: ${skipped} (already exist)`);
    console.log(`   ❌ Errors: ${errors}\n`);
    
    if (created > 0) {
      console.log('💡 Next steps:');
      console.log('   1. Refresh your admin dashboard');
      console.log('   2. Go to Driver Management');
      console.log('   3. The medical test drivers should now appear with proper names\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating medical driver applications:', error);
    process.exit(1);
  }
}

// Run the script
forceCreateMedicalDriverApplications();

