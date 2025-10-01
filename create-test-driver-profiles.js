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

// Test driver profiles with specialized capabilities
const testDriverProfiles = [
  {
    email: 'tow.driver@test.com',
    password: 'TowDriver123!',
    displayName: 'Mike Towson',
    specialtyVehicleType: 'tow_truck',
    serviceCapabilities: ['video_enabled'],
    vehicleInfo: {
      make: 'Ford',
      model: 'F-350',
      year: '2022',
      color: 'White',
      licensePlate: 'TOW-001',
      vin: '1FTFW3ET5NFA12345',
      vehicleType: 'pickup',
      numberOfSeats: '2',
      condition: 'excellent'
    },
    personalInfo: {
      firstName: 'Mike',
      lastName: 'Towson',
      phoneNumber: '+15551234567',
      address: '123 Tow Street, Test City, TC 12345'
    }
  },
  {
    email: 'video.driver@test.com',
    password: 'VideoDriver123!',
    displayName: 'Sarah Video',
    specialtyVehicleType: 'standard',
    serviceCapabilities: ['video_enabled', 'pet_friendly'],
    vehicleInfo: {
      make: 'Toyota',
      model: 'Camry',
      year: '2023',
      color: 'Silver',
      licensePlate: 'VID-002',
      vin: '4T1C11AK5NU123456',
      vehicleType: 'sedan',
      numberOfSeats: '5',
      condition: 'excellent'
    },
    personalInfo: {
      firstName: 'Sarah',
      lastName: 'Video',
      phoneNumber: '+15551234568',
      address: '456 Video Lane, Test City, TC 12345'
    }
  },
  {
    email: 'medical.driver@test.com',
    password: 'MedicalDriver123!',
    displayName: 'Dr. John Medical',
    specialtyVehicleType: 'wheelchair_accessible',
    serviceCapabilities: ['medical_transport', 'wheelchair_accessible'],
    vehicleInfo: {
      make: 'Ford',
      model: 'Transit',
      year: '2023',
      color: 'White',
      licensePlate: 'MED-003',
      vin: '1FTBR2CM5NKA12345',
      vehicleType: 'van',
      numberOfSeats: '8',
      condition: 'excellent'
    },
    personalInfo: {
      firstName: 'John',
      lastName: 'Medical',
      phoneNumber: '+15551234569',
      address: '789 Medical Way, Test City, TC 12345'
    }
  },
  {
    email: 'family.driver@test.com',
    password: 'FamilyDriver123!',
    displayName: 'Lisa Family',
    specialtyVehicleType: 'large',
    serviceCapabilities: ['car_seat_infant', 'car_seat_toddler', 'car_seat_booster', 'pet_friendly'],
    vehicleInfo: {
      make: 'Honda',
      model: 'Odyssey',
      year: '2022',
      color: 'Blue',
      licensePlate: 'FAM-004',
      vin: '5FNRL6H84NB123456',
      vehicleType: 'van',
      numberOfSeats: '8',
      condition: 'very_good'
    },
    personalInfo: {
      firstName: 'Lisa',
      lastName: 'Family',
      phoneNumber: '+15551234570',
      address: '321 Family Road, Test City, TC 12345'
    }
  },
  {
    email: 'premium.driver@test.com',
    password: 'PremiumDriver123!',
    displayName: 'Alex Premium',
    specialtyVehicleType: 'standard',
    serviceCapabilities: ['video_enabled'],
    vehicleInfo: {
      make: 'BMW',
      model: '5 Series',
      year: '2023',
      color: 'Black',
      licensePlate: 'PRM-005',
      vin: 'WBA5R1C05NF123456',
      vehicleType: 'sedan',
      numberOfSeats: '5',
      condition: 'excellent'
    },
    personalInfo: {
      firstName: 'Alex',
      lastName: 'Premium',
      phoneNumber: '+15551234571',
      address: '654 Premium Blvd, Test City, TC 12345'
    }
  },
  {
    email: 'taxi.driver@test.com',
    password: 'TaxiDriver123!',
    displayName: 'Carl Taxi',
    specialtyVehicleType: 'taxi_metered',
    serviceCapabilities: ['video_enabled'],
    vehicleInfo: {
      make: 'Chevrolet',
      model: 'Malibu',
      year: '2021',
      color: 'Yellow',
      licensePlate: 'TAX-006',
      vin: '1G1ZD5ST5MF123456',
      vehicleType: 'sedan',
      numberOfSeats: '5',
      condition: 'good'
    },
    personalInfo: {
      firstName: 'Carl',
      lastName: 'Taxi',
      phoneNumber: '+15551234572',
      address: '987 Taxi Street, Test City, TC 12345'
    }
  },
  {
    email: 'pet.driver@test.com',
    password: 'PetDriver123!',
    displayName: 'Emma Pet',
    specialtyVehicleType: 'standard',
    serviceCapabilities: ['pet_friendly', 'video_enabled'],
    vehicleInfo: {
      make: 'Subaru',
      model: 'Outback',
      year: '2022',
      color: 'Green',
      licensePlate: 'PET-007',
      vin: '4S4BSANC5N3123456',
      vehicleType: 'suv',
      numberOfSeats: '5',
      condition: 'very_good'
    },
    personalInfo: {
      firstName: 'Emma',
      lastName: 'Pet',
      phoneNumber: '+15551234573',
      address: '147 Pet Avenue, Test City, TC 12345'
    }
  },
  {
    email: 'paired.driver@test.com',
    password: 'PairedDriver123!',
    displayName: 'Tom Paired',
    specialtyVehicleType: 'standard',
    serviceCapabilities: ['paired_driver', 'video_enabled'],
    vehicleInfo: {
      make: 'Nissan',
      model: 'Altima',
      year: '2023',
      color: 'Red',
      licensePlate: 'PRD-008',
      vin: '1N4BL4BV5PN123456',
      vehicleType: 'sedan',
      numberOfSeats: '5',
      condition: 'excellent'
    },
    personalInfo: {
      firstName: 'Tom',
      lastName: 'Paired',
      phoneNumber: '+15551234574',
      address: '258 Paired Place, Test City, TC 12345'
    }
  }
];

const createTestDriverProfile = async (profile) => {
  try {
    console.log(`Creating driver profile for ${profile.email}...`);
    
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: profile.email,
      password: profile.password,
      displayName: profile.displayName,
      emailVerified: true // Skip email verification for testing
    });
    
    console.log(`✅ Created auth user: ${userRecord.uid}`);
    
    // Create driver application document
    const driverData = {
      userId: userRecord.uid,
      email: profile.email,
      status: 'approved', // Pre-approve for testing
      currentStep: 'review',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      // Personal Information
      personalInfo: {
        firstName: profile.personalInfo.firstName,
        lastName: profile.personalInfo.lastName,
        phoneNumber: profile.personalInfo.phoneNumber,
        address: profile.personalInfo.address,
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '+15559999999',
        coverageArea: 'Within city limits'
      },
      
      // Vehicle Information
      vehicleInfo: {
        make: profile.vehicleInfo.make,
        model: profile.vehicleInfo.model,
        year: profile.vehicleInfo.year,
        color: profile.vehicleInfo.color,
        licensePlate: profile.vehicleInfo.licensePlate,
        vin: profile.vehicleInfo.vin,
        vehicleType: profile.vehicleInfo.vehicleType,
        numberOfSeats: profile.vehicleInfo.numberOfSeats,
        condition: profile.vehicleInfo.condition,
        features: ['ac', 'bluetooth', 'gps'],
        specialtyVehicleType: profile.specialtyVehicleType,
        serviceCapabilities: profile.serviceCapabilities
      },
      
      // Specialty Vehicle Info (for mobile app compatibility)
      specialtyVehicleInfo: {
        specialtyVehicleType: profile.specialtyVehicleType,
        serviceCapabilities: profile.serviceCapabilities,
        certificationFiles: {}
      },
      
      // Background Check (pre-approved for testing)
      backgroundCheck: {
        ssn: '123-45-6789',
        hasValidLicense: true,
        hasValidInsurance: true,
        backgroundCheckStatus: 'approved'
      },
      
      // Payout Setup
      payoutInfo: {
        bankName: 'Test Bank',
        accountNumber: '1234567890',
        routingNumber: '123456789',
        accountType: 'checking'
      },
      
      // Availability (always available for testing)
      availability: {
        monday: { available: true, startTime: '06:00', endTime: '22:00' },
        tuesday: { available: true, startTime: '06:00', endTime: '22:00' },
        wednesday: { available: true, startTime: '06:00', endTime: '22:00' },
        thursday: { available: true, startTime: '06:00', endTime: '22:00' },
        friday: { available: true, startTime: '06:00', endTime: '22:00' },
        saturday: { available: true, startTime: '06:00', endTime: '22:00' },
        sunday: { available: true, startTime: '06:00', endTime: '22:00' }
      },
      
      // Documents (pre-uploaded for testing)
      documents: {
        drivers_license_front: { uploaded: true, verified: true },
        drivers_license_back: { uploaded: true, verified: true },
        vehicle_registration: { uploaded: true, verified: true },
        insurance_proof: { uploaded: true, verified: true },
        profile_photo: { uploaded: true, verified: true }
      },
      
      // Step Progress (all completed for testing)
      stepProgress: {
        personal_info: true,
        document_upload: true,
        vehicle_info: true,
        background_check: true,
        payout_setup: true,
        availability: true,
        review: true
      },
      
      // Onboarding Status (completed for testing)
      onboardingStatus: {
        completed: true,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedBy: 'test_script',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      },
      
      // Approval Status (approved for testing)
      approvalStatus: {
        status: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: 'test_script',
        notes: 'Pre-approved test driver'
      },
      
      // Mobile App Status
      mobileAppStatus: {
        accountCreated: true,
        accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMobileLogin: null
      },
      
      // Driver Status (offline initially)
      status: 'offline',
      isOnline: false,
      location: null,
      lastLocationUpdate: null,
      lastStatusUpdate: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save to Firestore
    await db.collection('driverApplications').doc(userRecord.uid).set(driverData);
    
    console.log(`✅ Created driver application for ${profile.email}`);
    console.log(`   - Specialty: ${profile.specialtyVehicleType}`);
    console.log(`   - Capabilities: ${profile.serviceCapabilities.join(', ')}`);
    console.log(`   - Vehicle: ${profile.vehicleInfo.year} ${profile.vehicleInfo.make} ${profile.vehicleInfo.model}`);
    console.log('');
    
    return { success: true, userId: userRecord.uid };
    
  } catch (error) {
    console.error(`❌ Error creating driver profile for ${profile.email}:`, error);
    return { success: false, error: error.message };
  }
};

const createAllTestDrivers = async () => {
  console.log('🚗 Creating test driver profiles...\n');
  
  const results = [];
  
  for (const profile of testDriverProfiles) {
    const result = await createTestDriverProfile(profile);
    results.push({ profile: profile.email, ...result });
    
    // Small delay between creations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully created: ${successful.length} drivers`);
  console.log(`❌ Failed to create: ${failed.length} drivers`);
  
  if (failed.length > 0) {
    console.log('\nFailed profiles:');
    failed.forEach(f => console.log(`  - ${f.profile}: ${f.error}`));
  }
  
  console.log('\n🔑 Login Credentials:');
  testDriverProfiles.forEach(profile => {
    console.log(`  ${profile.email} / ${profile.password}`);
  });
  
  console.log('\n🎯 Specialized Capabilities:');
  testDriverProfiles.forEach(profile => {
    console.log(`  ${profile.displayName}: ${profile.specialtyVehicleType} + ${profile.serviceCapabilities.join(', ')}`);
  });
  
  return results;
};

// Run the script
if (require.main === module) {
  createAllTestDrivers()
    .then(() => {
      console.log('\n🎉 Test driver creation completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createAllTestDrivers, testDriverProfiles };
