/**
 * Create Medical Test Drivers Script
 * Creates test drivers with proper medical transport capabilities for testing
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Try to use service account key file first
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Using service account key file');
  } catch (error) {
    // Fall back to default credentials (if running on Firebase/Google Cloud)
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log('✅ Using default application credentials');
  }
}

const db = admin.firestore();
const auth = admin.auth();

// Test drivers with medical capabilities
const medicalTestDrivers = [
  {
    // Basic driver info
    email: 'john.wheelchair@test.com',
    firstName: 'John',
    lastName: 'Smith',
    phone: '+1234567890',
    status: 'approved',
    
    // Vehicle info with medical capabilities
    vehicleInfo: {
      make: 'Ford',
      model: 'Transit',
      year: 2022,
      color: 'White',
      licensePlate: 'MED001',
      vin: '1FTBW2CM4GKA12345',
      vehicleType: 'van',
      numberOfSeats: 8,
      condition: 'excellent',
      
      // Service capabilities for medical transport
      serviceCapabilities: [
        'medical_transport',
        'wheelchair_accessible', 
        'assistance_available'
      ],
      
      // Insurance
      insuranceCompany: 'Medical Transport Insurance Co',
      insurancePolicyNumber: 'MED-INS-001',
      insuranceExpiration: '2024-12-31',
      
      // Registration
      registrationState: 'CA',
      registrationExpiration: '2024-12-31'
    },
    
    // Availability with medical transport preferences
    availability: {
      weeklySchedule: {
        monday: { enabled: true, startTime: '06:00', endTime: '18:00' },
        tuesday: { enabled: true, startTime: '06:00', endTime: '18:00' },
        wednesday: { enabled: true, startTime: '06:00', endTime: '18:00' },
        thursday: { enabled: true, startTime: '06:00', endTime: '18:00' },
        friday: { enabled: true, startTime: '06:00', endTime: '18:00' },
        saturday: { enabled: false, startTime: '08:00', endTime: '16:00' },
        sunday: { enabled: false, startTime: '08:00', endTime: '16:00' }
      },
      serviceRadius: 25,
      minimumRideFare: 15,
      
      // Medical transport specific availability
      wheelchairAccessible: true,
      oxygenEquipped: false,
      stretcherEquipped: false,
      assistanceAvailable: true
    },
    
    // Medical certifications
    medicalCertifications: {
      cpr: true,
      firstAid: true,
      medicalTransport: true,
      wheelchairTraining: true
    },
    
    // Ratings and experience
    rating: 4.8,
    completedRides: 150,
    medicalTransportRides: 75,
    
    // Test metadata
    isTestDriver: true,
    testDriverType: 'wheelchair_specialist'
  },
  
  {
    email: 'sarah.oxygen@test.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '+1234567891',
    status: 'approved',
    
    vehicleInfo: {
      make: 'Chevrolet',
      model: 'Suburban',
      year: 2021,
      color: 'Blue',
      licensePlate: 'OXY001',
      vin: '1GNSKAKG8MR123456',
      vehicleType: 'suv',
      numberOfSeats: 7,
      condition: 'excellent',
      
      serviceCapabilities: [
        'medical_transport',
        'oxygen_equipped',
        'assistance_available'
      ],
      
      insuranceCompany: 'Medical Transport Insurance Co',
      insurancePolicyNumber: 'MED-INS-002',
      insuranceExpiration: '2024-12-31',
      
      registrationState: 'CA',
      registrationExpiration: '2024-12-31'
    },
    
    availability: {
      weeklySchedule: {
        monday: { enabled: true, startTime: '07:00', endTime: '19:00' },
        tuesday: { enabled: true, startTime: '07:00', endTime: '19:00' },
        wednesday: { enabled: true, startTime: '07:00', endTime: '19:00' },
        thursday: { enabled: true, startTime: '07:00', endTime: '19:00' },
        friday: { enabled: true, startTime: '07:00', endTime: '19:00' },
        saturday: { enabled: true, startTime: '08:00', endTime: '16:00' },
        sunday: { enabled: true, startTime: '08:00', endTime: '16:00' }
      },
      serviceRadius: 30,
      minimumRideFare: 20,
      
      wheelchairAccessible: false,
      oxygenEquipped: true,
      stretcherEquipped: false,
      assistanceAvailable: true
    },
    
    medicalCertifications: {
      cpr: true,
      firstAid: true,
      medicalTransport: true,
      oxygenTherapy: true
    },
    
    rating: 4.9,
    completedRides: 200,
    medicalTransportRides: 120,
    
    isTestDriver: true,
    testDriverType: 'oxygen_specialist'
  },
  
  {
    email: 'mike.stretcher@test.com',
    firstName: 'Mike',
    lastName: 'Davis',
    phone: '+1234567892',
    status: 'approved',
    
    vehicleInfo: {
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2023,
      color: 'White',
      licensePlate: 'STR001',
      vin: 'WD3PE7CC8PJ123456',
      vehicleType: 'ambulance',
      numberOfSeats: 4,
      condition: 'excellent',
      
      serviceCapabilities: [
        'medical_transport',
        'stretcher_equipped',
        'assistance_available'
      ],
      
      insuranceCompany: 'Medical Transport Insurance Co',
      insurancePolicyNumber: 'MED-INS-003',
      insuranceExpiration: '2024-12-31',
      
      registrationState: 'CA',
      registrationExpiration: '2024-12-31'
    },
    
    availability: {
      weeklySchedule: {
        monday: { enabled: true, startTime: '05:00', endTime: '20:00' },
        tuesday: { enabled: true, startTime: '05:00', endTime: '20:00' },
        wednesday: { enabled: true, startTime: '05:00', endTime: '20:00' },
        thursday: { enabled: true, startTime: '05:00', endTime: '20:00' },
        friday: { enabled: true, startTime: '05:00', endTime: '20:00' },
        saturday: { enabled: true, startTime: '06:00', endTime: '18:00' },
        sunday: { enabled: true, startTime: '06:00', endTime: '18:00' }
      },
      serviceRadius: 35,
      minimumRideFare: 25,
      
      wheelchairAccessible: false,
      oxygenEquipped: false,
      stretcherEquipped: true,
      assistanceAvailable: true
    },
    
    medicalCertifications: {
      cpr: true,
      firstAid: true,
      medicalTransport: true,
      stretcherTraining: true,
      emtBasic: true
    },
    
    rating: 4.7,
    completedRides: 180,
    medicalTransportRides: 90,
    
    isTestDriver: true,
    testDriverType: 'stretcher_specialist'
  },
  
  {
    email: 'lisa.fullservice@test.com',
    firstName: 'Lisa',
    lastName: 'Wilson',
    phone: '+1234567893',
    status: 'approved',
    
    vehicleInfo: {
      make: 'Ford',
      model: 'E-Series',
      year: 2022,
      color: 'White',
      licensePlate: 'FULL001',
      vin: '1FTSE3EL6GKA12345',
      vehicleType: 'medical_van',
      numberOfSeats: 6,
      condition: 'excellent',
      
      serviceCapabilities: [
        'medical_transport',
        'wheelchair_accessible',
        'oxygen_equipped',
        'stretcher_equipped',
        'assistance_available'
      ],
      
      insuranceCompany: 'Medical Transport Insurance Co',
      insurancePolicyNumber: 'MED-INS-004',
      insuranceExpiration: '2024-12-31',
      
      registrationState: 'CA',
      registrationExpiration: '2024-12-31'
    },
    
    availability: {
      weeklySchedule: {
        monday: { enabled: true, startTime: '06:00', endTime: '22:00' },
        tuesday: { enabled: true, startTime: '06:00', endTime: '22:00' },
        wednesday: { enabled: true, startTime: '06:00', endTime: '22:00' },
        thursday: { enabled: true, startTime: '06:00', endTime: '22:00' },
        friday: { enabled: true, startTime: '06:00', endTime: '22:00' },
        saturday: { enabled: true, startTime: '07:00', endTime: '19:00' },
        sunday: { enabled: true, startTime: '07:00', endTime: '19:00' }
      },
      serviceRadius: 40,
      minimumRideFare: 30,
      
      wheelchairAccessible: true,
      oxygenEquipped: true,
      stretcherEquipped: true,
      assistanceAvailable: true
    },
    
    medicalCertifications: {
      cpr: true,
      firstAid: true,
      medicalTransport: true,
      wheelchairTraining: true,
      oxygenTherapy: true,
      stretcherTraining: true,
      emtBasic: true
    },
    
    rating: 4.9,
    completedRides: 250,
    medicalTransportRides: 200,
    
    isTestDriver: true,
    testDriverType: 'full_medical_specialist'
  }
];

async function createMedicalTestDrivers() {
  try {
    console.log('Creating medical test drivers...');
    
    for (const driver of medicalTestDrivers) {
      try {
        // Create Firebase Auth user
        const userRecord = await auth.createUser({
          email: driver.email,
          password: 'MedicalDriver123!',
          displayName: `${driver.firstName} ${driver.lastName}`,
          emailVerified: true
        });
        
        console.log(`✅ Created auth user: ${driver.email} (${userRecord.uid})`);
        
        // Create driver application document
        const driverData = {
          ...driver,
          uid: userRecord.uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          onboardingStep: 'completed',
          applicationStatus: 'approved',
          approvalDate: admin.firestore.FieldValue.serverTimestamp(),
          lastActiveAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Use the user's UID as the document ID
        await db.collection('driverApplications').doc(userRecord.uid).set(driverData);
        console.log(`✅ Created driver application for ${driver.firstName} ${driver.lastName} (${driver.testDriverType})`);
        
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`⚠️  User ${driver.email} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating ${driver.firstName} ${driver.lastName}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 Medical test drivers creation completed!');
    console.log('\nTest Driver Summary:');
    console.log('1. John Smith - Wheelchair Specialist (john.wheelchair@test.com)');
    console.log('2. Sarah Johnson - Oxygen Specialist (sarah.oxygen@test.com)'); 
    console.log('3. Mike Davis - Stretcher Specialist (mike.stretcher@test.com)');
    console.log('4. Lisa Wilson - Full Medical Specialist (lisa.fullservice@test.com)');
    console.log('\nPassword for all test drivers: MedicalDriver123!');
    
  } catch (error) {
    console.error('❌ Error creating medical test drivers:', error);
  }
}

// Run the script
if (require.main === module) {
  createMedicalTestDrivers();
}

module.exports = { createMedicalTestDrivers, medicalTestDrivers };
