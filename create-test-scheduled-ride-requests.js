const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ryde-9d4bf-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

/**
 * Create test scheduled ride requests for drivers to respond to
 * This script creates notifications that will appear in the driver dashboard
 */
async function createTestScheduledRideRequests() {
  try {
    console.log('🚀 Creating test scheduled ride requests...');

    // Get some test drivers (assuming they exist from previous script)
    const driversSnapshot = await db.collection('driverApplications')
      .where('status', '==', 'approved')
      .limit(3)
      .get();

    if (driversSnapshot.empty) {
      console.log('❌ No approved drivers found. Please run create-medical-test-drivers.js first.');
      return;
    }

    const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📋 Found ${drivers.length} approved drivers`);

    // Create test scheduled ride requests
    const testRequests = [
      {
        // Medical ride request
        rideId: `medical_${Date.now()}`,
        requestType: 'medical',
        appointmentType: 'Dialysis',
        patientId: 'PATIENT_001',
        pickupDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        pickupLocation: {
          address: '123 Main St, Bakersfield, CA 93301',
          coordinates: { lat: 35.3733, lng: -119.0187 }
        },
        dropoffLocation: {
          address: '456 Hospital Ave, Bakersfield, CA 93305',
          coordinates: { lat: 35.3789, lng: -119.0234 }
        },
        medicalRequirements: {
          wheelchairAccessible: true,
          oxygenSupport: false,
          stretcherRequired: false,
          assistanceLevel: 'moderate',
          specialInstructions: 'Patient requires assistance getting in and out of vehicle'
        },
        estimatedDuration: 120,
        priorityLevel: 'routine',
        dispatcherId: 'DISPATCHER_001'
      },
      {
        // Another medical ride request
        rideId: `medical_${Date.now() + 1}`,
        requestType: 'medical',
        appointmentType: 'Physical Therapy',
        patientId: 'PATIENT_002',
        pickupDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
        pickupLocation: {
          address: '789 Oak St, Bakersfield, CA 93308',
          coordinates: { lat: 35.3812, lng: -119.0156 }
        },
        dropoffLocation: {
          address: '321 Medical Center Dr, Bakersfield, CA 93309',
          coordinates: { lat: 35.3856, lng: -119.0198 }
        },
        medicalRequirements: {
          wheelchairAccessible: false,
          oxygenSupport: true,
          stretcherRequired: false,
          assistanceLevel: 'minimal',
          specialInstructions: 'Patient has portable oxygen tank'
        },
        estimatedDuration: 90,
        priorityLevel: 'routine',
        dispatcherId: 'DISPATCHER_001'
      },
      {
        // Regular scheduled ride
        rideId: `regular_${Date.now() + 2}`,
        requestType: 'regular',
        rideType: 'standard',
        customerId: 'CUSTOMER_001',
        scheduledDateTime: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
        pickup: {
          address: '555 Elm St, Bakersfield, CA 93304',
          coordinates: { lat: 35.3767, lng: -119.0123 }
        },
        dropoff: {
          address: '777 Pine Ave, Bakersfield, CA 93306',
          coordinates: { lat: 35.3798, lng: -119.0167 }
        },
        estimatedFare: 25.50,
        specialInstructions: 'Please call when arriving',
        customerNotes: 'Business meeting - punctuality important'
      }
    ];

    // Create notifications for each driver for each request
    for (const request of testRequests) {
      console.log(`📝 Creating notifications for ${request.requestType} ride: ${request.rideId}`);

      // First, create the ride document
      const rideCollection = request.requestType === 'medical' ? 'medicalRideSchedule' : 'scheduledRides';
      await db.collection(rideCollection).doc(request.rideId).set({
        ...request,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create notifications for each driver
      for (const driver of drivers) {
        const notificationData = {
          userId: driver.id,
          type: request.requestType === 'medical' ? 'medical_ride_request' : 'scheduled_ride_request',
          title: request.requestType === 'medical' ? 'Medical Transport Request' : 'Scheduled Ride Request',
          message: request.requestType === 'medical' 
            ? `${request.appointmentType} transport for ${request.patientId} - ${request.pickupDateTime.toLocaleString()}`
            : `${request.rideType} ride scheduled for ${request.scheduledDateTime.toLocaleString()}`,
          data: {
            rideId: request.rideId,
            requestType: request.requestType,
            ...(request.requestType === 'medical' ? {
              appointmentType: request.appointmentType,
              patientId: request.patientId,
              pickupDateTime: request.pickupDateTime,
              medicalRequirements: request.medicalRequirements
            } : {
              rideType: request.rideType,
              customerId: request.customerId,
              scheduledDateTime: request.scheduledDateTime,
              estimatedFare: request.estimatedFare
            })
          },
          status: 'pending',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('notifications').add(notificationData);
        console.log(`  ✅ Notification created for driver: ${driver.personalInfo?.firstName || driver.id}`);
      }
    }

    console.log('🎉 Test scheduled ride requests created successfully!');
    console.log(`📊 Created ${testRequests.length} ride requests with notifications for ${drivers.length} drivers`);
    console.log('👀 Drivers can now see these requests in their dashboard');

  } catch (error) {
    console.error('❌ Error creating test scheduled ride requests:', error);
  }
}

// Run the script
createTestScheduledRideRequests()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
