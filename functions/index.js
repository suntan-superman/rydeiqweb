/**
 * Cloud Functions for AnyRyde Driver App
 * Video Recording Feature
 * 
 * Functions:
 * 1. autoDeleteExpiredVideos - Delete videos after 72h retention
 * 2. certificationExpiryReminder - Remind drivers when certification expires
 * 3. updateRecordingStatistics - Update driver recording stats
 * 4. generateVideoThumbnails - Generate thumbnails for uploaded videos (future)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================================
// 1. Auto-Delete Expired Videos
// Runs daily at 2 AM UTC
// ============================================

exports.autoDeleteExpiredVideos = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub
  .schedule('0 2 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('🗑️  Starting auto-delete expired videos job...');
    
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Find rides with expired video retention that haven't been deleted
      const expiredQuery = db.collection('rideRequests')
        .where('videoLifecycle.autoDeleteScheduledFor', '<=', now)
        .where('videoLifecycle.retentionExtended', '==', false)
        .where('videoLifecycle.markedForDeletion', '==', false)
        .limit(500); // Process in batches
      
      const snapshot = await expiredQuery.get();
      
      if (snapshot.empty) {
        console.log('✅ No expired videos to delete');
        return null;
      }
      
      console.log(`📊 Found ${snapshot.size} video(s) to mark for deletion`);
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          'videoLifecycle.markedForDeletion': true,
          'videoLifecycle.deletedAt': now,
          'videoLifecycle.deletionMethod': 'auto',
          'videoLifecycle.deletionConfirmedBy': 'system_scheduled_job',
          'updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
      });
      
      await batch.commit();
      
      console.log(`✅ Successfully marked ${count} video(s) for deletion`);
      
      // Log analytics
      await db.collection('analyticsEvents').add({
        eventType: 'video_auto_deletion',
        eventData: {
          videosDeleted: count,
          deletedAt: now,
          reason: 'retention_expired'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, deletedCount: count };
      
    } catch (error) {
      console.error('❌ Error in autoDeleteExpiredVideos:', error);
      
      // Log error to analytics
      await db.collection('analyticsEvents').add({
        eventType: 'video_auto_deletion_error',
        eventData: {
          error: error.message,
          timestamp: admin.firestore.Timestamp.now()
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: false, error: error.message };
    }
  });

// ============================================
// 2. Certification Expiry Reminder
// Runs weekly on Sundays at 9 AM
// ============================================

exports.certificationExpiryReminder = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .pubsub
  .schedule('0 9 * * 0')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('📢 Starting certification expiry reminder job...');
    
    try {
      const thirtyDaysFromNow = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );
      
      // Find drivers whose certification expires in 30 days
      const expiringQuery = db.collection('driverApplications')
        .where('videoRecordingCapability.certificationExpiresAt', '<=', thirtyDaysFromNow)
        .where('videoRecordingCapability.certificationStatus', '==', 'certified')
        .where('videoRecordingCapability.recertificationRequired', '==', false);
      
      const snapshot = await expiringQuery.get();
      
      if (snapshot.empty) {
        console.log('✅ No certifications expiring soon');
        return null;
      }
      
      console.log(`📊 Found ${snapshot.size} driver(s) with expiring certifications`);
      
      const batch = db.batch();
      const notificationPromises = [];
      let count = 0;
      
      snapshot.forEach(doc => {
        const driverId = doc.id;
        const driverData = doc.data();
        const expiresAt = driverData.videoRecordingCapability.certificationExpiresAt;
        const daysUntilExpiry = Math.ceil((expiresAt.toDate() - new Date()) / (24 * 60 * 60 * 1000));
        
        // Mark as requiring recertification
        batch.update(doc.ref, {
          'videoRecordingCapability.recertificationRequired': true,
          'updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create notification
        const notificationPromise = db.collection('notifications').add({
          userId: driverId,
          type: 'certification_expiry',
          title: '🎥 Video Recording Certification Expiring',
          message: `Your video recording certification expires in ${daysUntilExpiry} days. Please complete recertification to continue accepting recorded rides.`,
          priority: 'high',
          actionRequired: true,
          actionUrl: '/settings/video-recording',
          data: {
            expiresAt: expiresAt,
            daysRemaining: daysUntilExpiry
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
          sentVia: 'scheduled_function'
        });
        
        notificationPromises.push(notificationPromise);
        count++;
      });
      
      await batch.commit();
      await Promise.all(notificationPromises);
      
      console.log(`✅ Successfully sent ${count} certification expiry reminder(s)`);
      
      // Log analytics
      await db.collection('analyticsEvents').add({
        eventType: 'certification_expiry_reminders_sent',
        eventData: {
          remindersSent: count,
          sentAt: admin.firestore.Timestamp.now()
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, remindersSent: count };
      
    } catch (error) {
      console.error('❌ Error in certificationExpiryReminder:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================
// 3. Update Recording Statistics
// Triggered when a ride with recording completes
// ============================================

exports.updateRecordingStatistics = functions.firestore
  .document('rides/{rideId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if ride just completed
    const wasCompleted = before.status !== 'completed' && after.status === 'completed';
    
    if (!wasCompleted) {
      return null; // Not interested in this update
    }
    
    // Check if ride had recording
    const hadRecording = after.activeRecording?.isRecording === true || 
                        after.recordingStatus?.durationSeconds > 0;
    
    if (!hadRecording) {
      return null; // No recording, nothing to update
    }
    
    try {
      const driverId = after.driverId;
      const durationSeconds = after.recordingStatus?.durationSeconds || 0;
      const durationHours = durationSeconds / 3600;
      const estimatedSizeGB = after.recordingStatus?.videoMetadata?.estimatedFileSizeMB / 1024 || 0;
      const incidentFlagged = after.activeRecording?.incidentFlagged || false;
      
      // Update driver's recording statistics
      const driverRef = db.collection('driverApplications').doc(driverId);
      
      await driverRef.update({
        'videoRecordingCapability.totalRecordedRides': admin.firestore.FieldValue.increment(1),
        'videoRecordingCapability.totalRecordingHours': admin.firestore.FieldValue.increment(durationHours),
        'videoRecordingCapability.totalRecordingSizeGB': admin.firestore.FieldValue.increment(estimatedSizeGB),
        'videoRecordingCapability.lastRecordingDate': admin.firestore.Timestamp.now(),
        'updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      
      // If incident was flagged, increment incident count
      if (incidentFlagged) {
        await driverRef.update({
          'videoRecordingCapability.incidentsReported': admin.firestore.FieldValue.increment(1)
        });
      }
      
      console.log(`✅ Updated recording stats for driver ${driverId}`);
      
      return { success: true, driverId };
      
    } catch (error) {
      console.error('❌ Error updating recording statistics:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================
// 4. Clean Up Old Video Incidents
// Runs monthly on the 1st at 3 AM
// Deletes closed incidents older than 90 days
// ============================================

exports.cleanupOldVideoIncidents = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .pubsub
  .schedule('0 3 1 * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('🧹 Starting cleanup of old video incidents...');
    
    try {
      const ninetyDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );
      
      // Find closed incidents older than 90 days
      const oldIncidentsQuery = db.collection('videoIncidents')
        .where('reviewStatus', '==', 'closed')
        .where('closedAt', '<=', ninetyDaysAgo)
        .limit(100); // Process in batches
      
      const snapshot = await oldIncidentsQuery.get();
      
      if (snapshot.empty) {
        console.log('✅ No old incidents to clean up');
        return null;
      }
      
      console.log(`📊 Found ${snapshot.size} old incident(s) to delete`);
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });
      
      await batch.commit();
      
      console.log(`✅ Successfully deleted ${count} old incident(s)`);
      
      return { success: true, deletedCount: count };
      
    } catch (error) {
      console.error('❌ Error in cleanupOldVideoIncidents:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================
// 5. Monitor Storage Usage
// Runs daily to check driver storage capacity
// ============================================

exports.monitorStorageUsage = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .pubsub
  .schedule('0 4 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('📊 Starting storage usage monitoring...');
    
    try {
      // Find drivers currently recording or with high storage usage
      const driversQuery = db.collection('driverApplications')
        .where('videoRecordingCapability.hasEquipment', '==', true)
        .where('videoRecordingCapability.certificationStatus', '==', 'certified');
      
      const snapshot = await driversQuery.get();
      
      if (snapshot.empty) {
        console.log('✅ No video-capable drivers to monitor');
        return null;
      }
      
      console.log(`📊 Monitoring ${snapshot.size} video-capable driver(s)`);
      
      const warningThreshold = 102; // 80% of 128GB = ~102GB
      const criticalThreshold = 115; // 90% of 128GB = ~115GB
      
      let warningsCount = 0;
      const notificationPromises = [];
      
      snapshot.forEach(doc => {
        const driverId = doc.id;
        const driverData = doc.data();
        const totalSizeGB = driverData.videoRecordingCapability?.totalRecordingSizeGB || 0;
        const storageCapacityGB = driverData.videoRecordingCapability?.cameraInfo?.storageCapacityGB || 128;
        
        const usagePercent = (totalSizeGB / storageCapacityGB) * 100;
        
        if (usagePercent >= criticalThreshold) {
          // Critical storage warning
          notificationPromises.push(
            db.collection('notifications').add({
              userId: driverId,
              type: 'storage_critical',
              title: '🚨 Critical: Camera Storage Almost Full',
              message: `Your camera storage is ${Math.round(usagePercent)}% full (${Math.round(totalSizeGB)}GB / ${storageCapacityGB}GB). Please free up space immediately or risk recording failures.`,
              priority: 'critical',
              actionRequired: true,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              read: false
            })
          );
          warningsCount++;
        } else if (usagePercent >= warningThreshold) {
          // Warning storage alert
          notificationPromises.push(
            db.collection('notifications').add({
              userId: driverId,
              type: 'storage_warning',
              title: '⚠️ Camera Storage Running Low',
              message: `Your camera storage is ${Math.round(usagePercent)}% full (${Math.round(totalSizeGB)}GB / ${storageCapacityGB}GB). Consider freeing up space soon.`,
              priority: 'medium',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              read: false
            })
          );
          warningsCount++;
        }
      });
      
      await Promise.all(notificationPromises);
      
      if (warningsCount > 0) {
        console.log(`⚠️  Sent ${warningsCount} storage warning(s)`);
      } else {
        console.log('✅ All drivers have adequate storage');
      }
      
      return { success: true, warningsSent: warningsCount };
      
    } catch (error) {
      console.error('❌ Error in monitorStorageUsage:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================
// 6. Video Incident Created Notification
// Triggers when a new video incident is created
// ============================================

exports.onVideoIncidentCreated = functions.firestore
  .document('videoIncidents/{incidentId}')
  .onCreate(async (snap, context) => {
    const incident = snap.data();
    const incidentId = context.params.incidentId;
    
    console.log(`🚨 New video incident created: ${incidentId}`);
    
    try {
      // Notify admins/support
      const adminsSnapshot = await db.collection('users')
        .where('role', 'in', ['admin', 'super_admin', 'support'])
        .get();
      
      const notificationPromises = adminsSnapshot.docs.map(adminDoc => {
        return db.collection('notifications').add({
          userId: adminDoc.id,
          type: 'video_incident_created',
          title: `🚨 New Video Incident - ${incident.incidentType}`,
          message: `Driver ${incident.driverId} reported a ${incident.incidentType} incident. Severity: ${incident.incidentSeverity}`,
          priority: incident.incidentSeverity === 'critical' ? 'critical' : 'high',
          actionRequired: true,
          actionUrl: `/admin/video-incidents/${incidentId}`,
          data: {
            incidentId,
            rideId: incident.rideId,
            incidentType: incident.incidentType,
            severity: incident.incidentSeverity
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        });
      });
      
      await Promise.all(notificationPromises);
      
      console.log(`✅ Notified ${adminsSnapshot.size} admin(s) about incident`);
      
      return { success: true, notified: adminsSnapshot.size };
      
    } catch (error) {
      console.error('❌ Error in onVideoIncidentCreated:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================
// Export all functions
// ============================================

// ============================================
// 7. Validate Bid Submission (VAL-001)
// Callable function to validate bids before submission
// ============================================

exports.validateBid = functions.https.onCall(async (data, context) => {
  // Verify the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to submit a bid');
  }

  const { rideRequestId, bidAmount, driverId, estimatedArrivalMinutes } = data;

  // Validate required fields
  if (!rideRequestId || !bidAmount || !driverId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: rideRequestId, bidAmount, driverId');
  }

  // Validate driverId matches authenticated user
  if (context.auth.uid !== driverId) {
    throw new functions.https.HttpsError('permission-denied', 'Driver ID must match authenticated user');
  }

  try {
    // Get the ride request
    const rideRequestRef = db.collection('rideRequests').doc(rideRequestId);
    const rideRequestDoc = await rideRequestRef.get();

    if (!rideRequestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Ride request not found');
    }

    const rideRequest = rideRequestDoc.data();

    // Check if ride is still open for bids
    const validStatuses = ['pending', 'open_for_bids', 'awaiting_bids'];
    if (!validStatuses.includes(rideRequest.status)) {
      throw new functions.https.HttpsError('failed-precondition', `Ride is no longer accepting bids. Current status: ${rideRequest.status}`);
    }

    // Check if bidding window has expired
    if (rideRequest.biddingExpiresAt) {
      const expiryTime = rideRequest.biddingExpiresAt.toDate ? rideRequest.biddingExpiresAt.toDate() : new Date(rideRequest.biddingExpiresAt);
      if (new Date() > expiryTime) {
        throw new functions.https.HttpsError('deadline-exceeded', 'Bidding window has expired');
      }
    }

    // Validate bid amount
    const parsedBidAmount = parseFloat(bidAmount);
    if (isNaN(parsedBidAmount) || parsedBidAmount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Bid amount must be a positive number');
    }

    // Check minimum bid amount (e.g., $5 minimum)
    const MINIMUM_BID = 5.00;
    if (parsedBidAmount < MINIMUM_BID) {
      throw new functions.https.HttpsError('invalid-argument', `Bid amount must be at least $${MINIMUM_BID}`);
    }

    // Check maximum bid amount (prevent typos, e.g., $9999 max)
    const MAXIMUM_BID = 9999.00;
    if (parsedBidAmount > MAXIMUM_BID) {
      throw new functions.https.HttpsError('invalid-argument', `Bid amount exceeds maximum allowed ($${MAXIMUM_BID})`);
    }

    // Check if bid is reasonable compared to estimated fare (if available)
    if (rideRequest.estimatedFare) {
      const estimatedFare = parseFloat(rideRequest.estimatedFare);
      const minReasonableBid = estimatedFare * 0.5; // At least 50% of estimate
      const maxReasonableBid = estimatedFare * 3.0; // At most 300% of estimate

      if (parsedBidAmount < minReasonableBid) {
        console.warn(`Bid ${parsedBidAmount} is below 50% of estimated fare ${estimatedFare}`);
        // Allow but flag as suspicious
      }

      if (parsedBidAmount > maxReasonableBid) {
        throw new functions.https.HttpsError('invalid-argument', `Bid amount is unreasonably high compared to estimated fare`);
      }
    }

    // Check if driver is eligible (driver exists and is active)
    const driverRef = db.collection('driverApplications').doc(driverId);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Driver profile not found');
    }

    const driver = driverDoc.data();

    // Check driver status
    if (driver.applicationStatus !== 'approved' && driver.status !== 'active') {
      throw new functions.https.HttpsError('permission-denied', 'Driver is not approved to accept rides');
    }

    // Check if driver is currently online
    if (driver.isOnline === false) {
      throw new functions.https.HttpsError('failed-precondition', 'Driver must be online to submit bids');
    }

    // Check if driver is already on another ride
    if (driver.currentRideId && driver.currentRideId !== rideRequestId) {
      throw new functions.https.HttpsError('failed-precondition', 'Driver is currently on another ride');
    }

    // Check if driver has already submitted a bid for this ride
    const existingBids = rideRequest.driverBids || [];
    const hasBid = existingBids.some(bid => bid.driverId === driverId);
    if (hasBid) {
      throw new functions.https.HttpsError('already-exists', 'Driver has already submitted a bid for this ride');
    }

    // Check if driver is in the availableDrivers list (if applicable)
    if (rideRequest.availableDrivers && rideRequest.availableDrivers.length > 0) {
      if (!rideRequest.availableDrivers.includes(driverId)) {
        throw new functions.https.HttpsError('permission-denied', 'Driver is not eligible for this ride request');
      }
    }

    // All validations passed
    console.log(`✅ Bid validation passed for driver ${driverId} on ride ${rideRequestId}: $${parsedBidAmount}`);

    return {
      valid: true,
      rideRequestId,
      driverId,
      bidAmount: parsedBidAmount,
      estimatedArrivalMinutes: estimatedArrivalMinutes || null,
      validatedAt: new Date().toISOString()
    };

  } catch (error) {
    // Re-throw HttpsError as-is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    // Wrap other errors
    console.error('❌ Bid validation error:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while validating the bid');
  }
});

// ============================================
// 8. Validate Payment (VAL-002)
// Callable function to validate payment before processing
// ============================================

exports.validatePayment = functions.https.onCall(async (data, context) => {
  // Verify the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to process payment');
  }

  const { rideId, paymentAmount, paymentMethodId, riderId } = data;

  // Validate required fields
  if (!rideId || !paymentAmount) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: rideId, paymentAmount');
  }

  try {
    // Get the ride
    const rideRef = db.collection('rideRequests').doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Ride not found');
    }

    const ride = rideDoc.data();

    // Verify the user is the rider for this ride
    const riderIdToCheck = riderId || context.auth.uid;
    if (ride.riderId !== riderIdToCheck && ride.userId !== riderIdToCheck) {
      throw new functions.https.HttpsError('permission-denied', 'User is not authorized to pay for this ride');
    }

    // Check if ride is in a payable status
    const payableStatuses = ['completed', 'trip_completed', 'awaiting_payment'];
    if (!payableStatuses.includes(ride.status)) {
      throw new functions.https.HttpsError('failed-precondition', `Ride is not ready for payment. Current status: ${ride.status}`);
    }

    // Check if ride is already paid
    if (ride.paymentStatus === 'paid' || ride.paymentStatus === 'completed') {
      throw new functions.https.HttpsError('already-exists', 'This ride has already been paid');
    }

    // Validate payment amount
    const parsedPaymentAmount = parseFloat(paymentAmount);
    if (isNaN(parsedPaymentAmount) || parsedPaymentAmount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment amount must be a positive number');
    }

    // Get the expected fare
    const expectedFare = ride.finalFare || ride.acceptedBidAmount || ride.estimatedFare || 0;
    const parsedExpectedFare = parseFloat(expectedFare);

    if (parsedExpectedFare <= 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Ride does not have a valid fare amount');
    }

    // Validate payment amount matches expected fare (with small tolerance for rounding)
    const tolerance = 0.01; // $0.01 tolerance
    if (Math.abs(parsedPaymentAmount - parsedExpectedFare) > tolerance) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Payment amount ($${parsedPaymentAmount.toFixed(2)}) does not match expected fare ($${parsedExpectedFare.toFixed(2)})`
      );
    }

    // Validate payment method if provided
    if (paymentMethodId) {
      // Get user's payment methods from Firestore
      const userRef = db.collection('users').doc(riderIdToCheck);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const paymentMethods = userData.paymentMethods || [];
        const validMethod = paymentMethods.find(pm => pm.id === paymentMethodId || pm.stripePaymentMethodId === paymentMethodId);

        if (!validMethod) {
          // Check default payment method
          if (userData.defaultPaymentMethodId !== paymentMethodId) {
            console.warn(`Payment method ${paymentMethodId} not found in user's saved methods`);
            // Don't fail - Stripe will validate the actual method
          }
        }
      }
    }

    // Check for suspicious activity (multiple payment attempts)
    const recentPaymentAttempts = await db.collection('paymentAttempts')
      .where('rideId', '==', rideId)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000))) // Last 5 minutes
      .get();

    if (recentPaymentAttempts.size >= 5) {
      console.warn(`⚠️ Multiple payment attempts detected for ride ${rideId}`);
      throw new functions.https.HttpsError('resource-exhausted', 'Too many payment attempts. Please try again later.');
    }

    // Log the payment attempt
    await db.collection('paymentAttempts').add({
      rideId,
      riderId: riderIdToCheck,
      paymentAmount: parsedPaymentAmount,
      paymentMethodId: paymentMethodId || null,
      status: 'validated',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Payment validation passed for ride ${rideId}: $${parsedPaymentAmount}`);

    return {
      valid: true,
      rideId,
      paymentAmount: parsedPaymentAmount,
      expectedFare: parsedExpectedFare,
      riderId: riderIdToCheck,
      validatedAt: new Date().toISOString()
    };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('❌ Payment validation error:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while validating the payment');
  }
});

// ============================================
// 9. Validate and Update Ride Status (VAL-003)
// Callable function to validate ride status transitions
// ============================================

exports.updateRideStatus = functions.https.onCall(async (data, context) => {
  // Verify the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to update ride status');
  }

  const { rideId, newStatus, driverId, riderId, reason } = data;

  // Validate required fields
  if (!rideId || !newStatus) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: rideId, newStatus');
  }

  // Define valid status transitions
  const VALID_TRANSITIONS = {
    'pending': ['open_for_bids', 'cancelled'],
    'open_for_bids': ['awaiting_bids', 'accepted', 'cancelled', 'expired'],
    'awaiting_bids': ['accepted', 'cancelled', 'expired', 'no_bids'],
    'accepted': ['en_route_pickup', 'cancelled'],
    'en_route_pickup': ['arrived_pickup', 'cancelled'],
    'arrived_pickup': ['customer_onboard', 'cancelled', 'no_show'],
    'customer_onboard': ['trip_active', 'cancelled'],
    'trip_active': ['trip_completed', 'cancelled'],
    'trip_completed': ['completed', 'awaiting_payment'],
    'awaiting_payment': ['completed', 'payment_failed'],
    'completed': [], // Terminal state
    'cancelled': [], // Terminal state
    'expired': [], // Terminal state
    'no_bids': ['pending', 'cancelled'], // Can retry
    'no_show': ['cancelled'], // Terminal
    'payment_failed': ['awaiting_payment', 'cancelled']
  };

  // Define who can perform which transitions
  const DRIVER_TRANSITIONS = [
    'en_route_pickup', 'arrived_pickup', 'customer_onboard', 
    'trip_active', 'trip_completed', 'no_show'
  ];

  const RIDER_TRANSITIONS = [
    'cancelled', 'completed'
  ];

  const SYSTEM_TRANSITIONS = [
    'expired', 'no_bids', 'payment_failed', 'awaiting_payment'
  ];

  try {
    // Get the ride
    const rideRef = db.collection('rideRequests').doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Ride not found');
    }

    const ride = rideDoc.data();
    const currentStatus = ride.status;

    // Check if this is a valid transition
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`
      );
    }

    // Determine user role and verify permission
    const userId = context.auth.uid;
    const isDriver = driverId === userId || ride.driverId === userId || ride.acceptedDriver?.driverId === userId;
    const isRider = riderId === userId || ride.riderId === userId || ride.userId === userId;

    // Check if user has permission for this transition
    if (DRIVER_TRANSITIONS.includes(newStatus) && !isDriver) {
      throw new functions.https.HttpsError('permission-denied', 'Only the driver can set this status');
    }

    if (RIDER_TRANSITIONS.includes(newStatus) && !isRider && !isDriver) {
      throw new functions.https.HttpsError('permission-denied', 'Only the rider or driver can set this status');
    }

    // Additional validation for specific transitions
    if (newStatus === 'accepted' && !ride.acceptedDriver && !driverId) {
      throw new functions.https.HttpsError('invalid-argument', 'Accepted status requires a driver assignment');
    }

    if (newStatus === 'cancelled' && !reason) {
      console.warn(`Ride ${rideId} cancelled without reason`);
      // Allow but log warning
    }

    // Prepare update data
    const updateData = {
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status: newStatus,
        previousStatus: currentStatus,
        changedBy: userId,
        changedAt: new Date().toISOString(),
        reason: reason || null
      })
    };

    // Add timestamp for specific statuses
    const statusTimestamps = {
      'en_route_pickup': 'enRouteAt',
      'arrived_pickup': 'arrivedAt',
      'customer_onboard': 'pickupAt',
      'trip_active': 'tripStartedAt',
      'trip_completed': 'tripCompletedAt',
      'completed': 'completedAt',
      'cancelled': 'cancelledAt'
    };

    if (statusTimestamps[newStatus]) {
      updateData[statusTimestamps[newStatus]] = admin.firestore.FieldValue.serverTimestamp();
    }

    // If cancelled, record cancellation details
    if (newStatus === 'cancelled') {
      updateData.cancellation = {
        cancelledBy: isDriver ? 'driver' : 'rider',
        cancelledById: userId,
        reason: reason || 'No reason provided',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp()
      };
    }

    // Perform the update
    await rideRef.update(updateData);

    // Log the status change for audit
    await db.collection('rideStatusAudit').add({
      rideId,
      previousStatus: currentStatus,
      newStatus,
      changedBy: userId,
      userRole: isDriver ? 'driver' : (isRider ? 'rider' : 'system'),
      reason: reason || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Ride ${rideId} status updated: ${currentStatus} → ${newStatus} by ${userId}`);

    return {
      success: true,
      rideId,
      previousStatus: currentStatus,
      newStatus,
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('❌ Ride status update error:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while updating ride status');
  }
});
