/**
 * AnyRyde Cloud Functions
 * Server-side notification orchestration, SMS, email, and backend logic
 */

const {onCall} = require('firebase-functions/v2/https');
const {onDocumentCreated, onDocumentUpdated} = require('firebase-functions/v2/firestore');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {setGlobalOptions} = require('firebase-functions/v2');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Set global options
setGlobalOptions({maxInstances: 10});

// Lazy load notification orchestrator to avoid timeout
let NotificationOrchestrator = null;
const getOrchestrator = () => {
  if (!NotificationOrchestrator) {
    NotificationOrchestrator = require('./services/notificationOrchestrator');
  }
  return NotificationOrchestrator;
};

/**
 * HTTP Callable Function: Send Notification
 * Used by web/mobile apps to send multi-channel notifications
 */
exports.sendNotification = onCall(async (request) => {
  const {data, auth} = request;
  try {
    // Verify authentication
    if (!auth) {
      throw new Error('User must be authenticated');
    }

    const {
      userId,
      title,
      body,
      type = 'general',
      priority = 'medium',
      channels = ['push'],
      data: customData = {},
      scheduleAt = null
    } = data;

    // Validate required fields
    if (!userId || !title || !body) {
      throw new Error('Missing required fields: userId, title, body');
    }

    // Send notification
    const orchestrator = getOrchestrator();
    const result = await orchestrator.sendNotification(userId, {
      type,
      priority,
      title,
      body,
      channels,
      data: customData,
      scheduleAt
    });

    return result;

  } catch (error) {
    console.error('❌ sendNotification error:', error);
    throw error;
  }
});

/**
 * Firestore Trigger: Driver Application Approved
 */
exports.onDriverApplicationApproved = onDocumentUpdated('driverApplications/{applicationId}', async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Check if status changed to approved
    if (before.approvalStatus?.status !== 'approved' && after.approvalStatus?.status === 'approved') {
      console.log('🎉 Driver approved:', after.userId);

      const driverName = `${after.personalInfo?.firstName || 'Driver'}`;

      await NotificationOrchestrator.sendNotification(after.userId, {
        type: 'driver_application_approved',
        priority: 'high',
        title: '🎉 Congratulations!',
        body: `${driverName}, your AnyRyde driver application has been approved! You can now start accepting rides and earning money.`,
        channels: ['push', 'sms', 'email'],
        data: {
          applicationId: event.params.applicationId,
          approvedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
    }

    // Check if status changed to rejected/pending
    if (before.approvalStatus?.status !== 'rejected' && after.approvalStatus?.status === 'rejected') {
      console.log('❌ Driver application rejected:', after.userId);

      const orchestrator = getOrchestrator();
      await orchestrator.sendNotification(after.userId, {
        type: 'driver_application_rejected',
        priority: 'high',
        title: 'Application Update Required',
        body: 'Your AnyRyde driver application requires additional review. Please check your email for details or contact support.',
        channels: ['push', 'email'],
        data: {
          applicationId: event.params.applicationId,
          reason: after.approvalStatus?.notes || 'Additional review required'
        }
      });
    }
  });

/**
 * Firestore Trigger: Ride Accepted by Driver
 */
exports.onRideAccepted = onDocumentUpdated('rides/{rideId}', async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Ride accepted
    if (before.status !== 'accepted' && after.status === 'accepted') {
      console.log('🚗 Ride accepted:', event.params.rideId);

      const driverName = after.driverName || 'Your driver';
      const eta = after.estimatedArrivalTime || '5 minutes';

      const orchestrator = getOrchestrator();
      await orchestrator.sendNotification(after.riderId, {
        type: 'ride_accepted',
        priority: 'high',
        title: 'Driver On The Way! 🚗',
        body: `${driverName} is coming to pick you up. Estimated arrival: ${eta}`,
        channels: ['push', 'sms'],
        data: {
          rideId: event.params.rideId,
          driverId: after.driverId,
          driverName,
          driverPhoto: after.driverPhoto || '',
          vehicleInfo: after.vehicleInfo || {},
          eta
        }
      });
    }

    // Driver arrived
    if (before.status !== 'driver_arrived' && after.status === 'driver_arrived') {
      console.log('📍 Driver arrived:', event.params.rideId);

      const orchestrator = getOrchestrator();
      await orchestrator.sendNotification(after.riderId, {
        type: 'driver_arrived',
        priority: 'high',
        title: 'Driver Has Arrived! 📍',
        body: 'Your driver is waiting at the pickup location.',
        channels: ['push', 'sms'],
        data: {
          rideId: event.params.rideId,
          driverId: after.driverId,
          location: after.currentLocation || {}
        }
      });
    }

    // Ride started
    if (before.status !== 'in_progress' && after.status === 'in_progress') {
      console.log('🚀 Ride started:', event.params.rideId);

      const orchestrator = getOrchestrator();
      await orchestrator.sendNotification(after.riderId, {
        type: 'ride_started',
        priority: 'medium',
        title: 'Ride Started 🚀',
        body: 'Your ride has started. Have a safe trip!',
        channels: ['push'],
        data: {
          rideId: event.params.rideId,
          startTime: admin.firestore.FieldValue.serverTimestamp()
        }
      });
    }

    // Ride completed
    if (before.status !== 'completed' && after.status === 'completed') {
      console.log('✅ Ride completed:', event.params.rideId);

      const totalFare = after.payment?.totalFare || after.estimatedFare || 0;

      // Notify rider
      const orchestrator = getOrchestrator();
      await orchestrator.sendNotification(after.riderId, {
        type: 'ride_completed',
        priority: 'medium',
        title: 'Ride Completed ✅',
        body: `Your ride is complete. Total: $${totalFare.toFixed(2)}. Thank you for riding with AnyRyde!`,
        channels: ['push', 'sms', 'email'],
        data: {
          rideId: event.params.rideId,
          totalFare,
          receipt: true
        }
      });

      // Notify driver
      if (after.driverId) {
        const earnings = after.payment?.driverEarnings || (totalFare * 0.8);
        
        await orchestrator.sendNotification(after.driverId, {
          type: 'ride_completed',
          priority: 'medium',
          title: 'Great Job! ✅',
          body: `Ride completed. You earned $${earnings.toFixed(2)}`,
          channels: ['push'],
          data: {
            rideId: event.params.rideId,
            earnings,
            totalFare
          }
        });
      }
    }

    // Ride cancelled
    if (before.status !== 'cancelled' && after.status === 'cancelled') {
      console.log('❌ Ride cancelled:', event.params.rideId);

      const cancelledBy = after.cancelledBy || 'unknown';
      const cancelReason = after.cancelReason || 'No reason provided';

      // Notify the other party
      if (cancelledBy === 'rider' && after.driverId) {
        const orchestrator = getOrchestrator();
        await orchestrator.sendNotification(after.driverId, {
          type: 'ride_cancelled',
          priority: 'high',
          title: 'Ride Cancelled',
          body: 'The rider has cancelled this ride.',
          channels: ['push', 'sms'],
          data: {
            rideId: event.params.rideId,
            cancelledBy,
            reason: cancelReason
          }
        });
      } else if (cancelledBy === 'driver' && after.riderId) {
        await orchestrator.sendNotification(after.riderId, {
          type: 'ride_cancelled',
          priority: 'high',
          title: 'Ride Cancelled',
          body: 'Your ride has been cancelled. We\'re sorry for the inconvenience.',
          channels: ['push', 'sms'],
          data: {
            rideId: event.params.rideId,
            cancelledBy,
            reason: cancelReason
          }
        });
      }
    }
  });

/**
 * Firestore Trigger: New Ride Request
 * Notify nearby drivers
 */
exports.onNewRideRequest = onDocumentCreated('rideRequests/{rideRequestId}', async (event) => {
    const rideData = event.data.data();
    
    console.log('📢 New ride request:', event.params.rideRequestId);

    // Get nearby drivers (this would typically use geolocation queries)
    // For now, we'll just demonstrate the notification
    const driversSnapshot = await admin.firestore()
      .collection('driverApplications')
      .where('status', '==', 'available')
      .where('approvalStatus.status', '==', 'approved')
      .limit(10)
      .get();

    const notificationPromises = [];

    driversSnapshot.forEach(driverDoc => {
      const driverData = driverDoc.data();
      
      // Check if driver has SMS enabled for ride requests
      const sendSMS = driverData.notificationPreferences?.smsRideRequests || false;

      const orchestrator = getOrchestrator();
      notificationPromises.push(
        orchestrator.sendNotification(driverData.userId, {
          type: 'ride_request',
          priority: 'high',
          title: 'New Ride Request! 🚗',
          body: `${rideData.pickup?.address || 'Pickup'} → ${rideData.destination?.address || 'Destination'}. Fare: $${rideData.estimatedFare?.toFixed(2) || 'TBD'}`,
          channels: sendSMS ? ['push', 'sms'] : ['push'],
          data: { 
            rideRequestId: event.params.rideRequestId,
            pickup: rideData.pickup,
            destination: rideData.destination,
            estimatedFare: rideData.estimatedFare,
            rideType: rideData.rideType,
            expiresAt: rideData.expiresAt
          }
        })
      );
    });

    await Promise.allSettled(notificationPromises);
    console.log(`✅ Notified ${driversSnapshot.size} drivers`);
  });

/**
 * Scheduled Function: Send Ride Reminders
 * Runs every 5 minutes to check for scheduled rides
 */
exports.sendScheduledRideReminders = onSchedule('every 5 minutes', async (event) => {
    console.log('⏰ Checking for scheduled ride reminders...');

    const now = admin.firestore.Timestamp.now();
    const in24Hours = admin.firestore.Timestamp.fromMillis(Date.now() + (24 * 60 * 60 * 1000));
    const in1Hour = admin.firestore.Timestamp.fromMillis(Date.now() + (60 * 60 * 1000));

    // Get scheduled rides in next 24 hours that haven't been reminded
    const scheduledRidesSnapshot = await admin.firestore()
      .collection('scheduledRides')
      .where('scheduledDateTime', '<=', in24Hours)
      .where('scheduledDateTime', '>', now)
      .where('status', '==', 'scheduled')
      .get();

    const reminderPromises = [];

    scheduledRidesSnapshot.forEach(rideDoc => {
      const ride = rideDoc.data();
      const rideTime = ride.scheduledDateTime.toMillis();
      const timeDiff = rideTime - Date.now();

      // 24-hour reminder
      if (timeDiff <= (24 * 60 * 60 * 1000) && timeDiff > (23.5 * 60 * 60 * 1000) && !ride.reminder24hrSent) {
        const orchestrator = getOrchestrator();
        reminderPromises.push(
          orchestrator.sendNotification(ride.riderId, {
            type: 'scheduled_ride_reminder_24hr',
            priority: 'medium',
            title: 'Ride Reminder 📅',
            body: `Your ride is scheduled for tomorrow at ${new Date(rideTime).toLocaleTimeString()}`,
            channels: ['push', 'sms'],
            data: {
              rideId: rideDoc.id,
              scheduledTime: rideTime,
              pickup: ride.pickup
            }
          }).then(() => {
            return rideDoc.ref.update({ reminder24hrSent: true });
          })
        );
      }

      // 1-hour reminder
      if (timeDiff <= (60 * 60 * 1000) && timeDiff > (55 * 60 * 1000) && !ride.reminder1hrSent) {
        const orchestrator = getOrchestrator();
        reminderPromises.push(
          orchestrator.sendNotification(ride.riderId, {
            type: 'scheduled_ride_reminder_1hr',
            priority: 'high',
            title: 'Ride Starting Soon! ⏰',
            body: `Your ride is scheduled in 1 hour. Pickup at ${ride.pickup?.address || 'your location'}`,
            channels: ['push', 'sms'],
            data: {
              rideId: rideDoc.id,
              scheduledTime: rideTime,
              pickup: ride.pickup
            }
          }).then(() => {
            return rideDoc.ref.update({ reminder1hrSent: true });
          })
        );
      }
    });

    await Promise.allSettled(reminderPromises);
    console.log(`✅ Sent ${reminderPromises.length} ride reminders`);
  });

/**
 * Firestore Trigger: Driver Location Update (Proximity-Based Arrival Notification)
 * Triggers when driver's location is updated during active ride
 */
exports.onDriverLocationUpdate = onDocumentUpdated('rides/{rideId}', async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Only process for accepted rides that haven't arrived yet
    if (after.status !== 'accepted' || after.proximityNotificationSent) {
      return;
    }

    // Check if driver location exists
    if (!after.driverLocation?.latitude || !after.driverLocation?.longitude) {
      return;
    }

    // Check if pickup location exists
    if (!after.pickup?.latitude || !after.pickup?.longitude) {
      return;
    }

    // Calculate distance between driver and pickup location
    const distance = calculateDistance(
      after.driverLocation.latitude,
      after.driverLocation.longitude,
      after.pickup.latitude,
      after.pickup.longitude
    );

    // Send notification if driver is within 0.5 miles (800 meters) and hasn't been sent yet
    if (distance <= 800 && !after.proximityNotificationSent) {
      console.log(`📍 Driver is ${distance.toFixed(0)}m away from pickup, sending proximity notification`);

      const driverName = after.driverName || 'Your driver';
      const eta = Math.ceil(distance / 200); // Rough estimate: 200m/min walking speed

      const orchestrator = getOrchestrator();
      await orchestrator.sendNotification(after.riderId, {
        type: 'driver_nearby',
        priority: 'high',
        title: `${driverName} is Almost Here! 🚗`,
        body: `Your driver is about ${eta} minute${eta > 1 ? 's' : ''} away. Get ready!`,
        channels: ['push'],
        rideId: event.params.rideId,
        data: {
          rideId: event.params.rideId,
          driverId: after.driverId,
          driverName,
          distance: Math.round(distance),
          eta,
          driverLocation: after.driverLocation
        }
      });

      // Mark that proximity notification has been sent
      await event.data.after.ref.update({
        proximityNotificationSent: true,
        proximityNotificationSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Scheduled Function: Send Rating Reminders
 * Runs every 5 minutes to check for completed rides without ratings
 */
exports.sendRatingReminders = onSchedule('every 5 minutes', async (event) => {
    console.log('⭐ Checking for rating reminders...');

    const fiveMinutesAgo = admin.firestore.Timestamp.fromMillis(Date.now() - (5 * 60 * 1000));
    const tenMinutesAgo = admin.firestore.Timestamp.fromMillis(Date.now() - (10 * 60 * 1000));

    // Get completed rides from 5-10 minutes ago without ratings
    const completedRidesSnapshot = await admin.firestore()
      .collection('rides')
      .where('status', '==', 'completed')
      .where('completedAt', '<=', fiveMinutesAgo)
      .where('completedAt', '>', tenMinutesAgo)
      .where('ratingReminderSent', '==', false)
      .limit(50)
      .get();

    const reminderPromises = [];

    completedRidesSnapshot.forEach(rideDoc => {
      const ride = rideDoc.data();

      // Check if rider has already rated
      if (ride.riderRating || ride.riderRating === 0) {
        // Mark as sent to avoid checking again
        rideDoc.ref.update({ ratingReminderSent: true });
        return;
      }

      // Send rating reminder to rider
      const orchestrator = getOrchestrator();
      reminderPromises.push(
        orchestrator.sendNotification(ride.riderId, {
          type: 'rating_reminder',
          priority: 'low',
          title: 'How Was Your Ride? ⭐',
          body: `Please rate your experience with ${ride.driverName || 'your driver'}. Your feedback helps us improve!`,
          channels: ['push'],
          data: {
            rideId: rideDoc.id,
            driverId: ride.driverId,
            driverName: ride.driverName,
            completedAt: ride.completedAt
          }
        }).then(() => {
          return rideDoc.ref.update({ 
            ratingReminderSent: true,
            ratingReminderSentAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }).catch(error => {
          console.error(`Error sending rating reminder for ride ${rideDoc.id}:`, error);
        })
      );

      // Send rating reminder to driver (if they haven't rated the rider)
      if (!ride.driverRating && ride.driverRating !== 0) {
        reminderPromises.push(
          orchestrator.sendNotification(ride.driverId, {
            type: 'rating_reminder',
            priority: 'low',
            title: 'Rate Your Rider ⭐',
            body: `How was your experience with ${ride.riderName || 'this rider'}? Your feedback matters!`,
            channels: ['push'],
            data: {
              rideId: rideDoc.id,
              riderId: ride.riderId,
              riderName: ride.riderName,
              completedAt: ride.completedAt
            }
          }).catch(error => {
            console.error(`Error sending rating reminder to driver for ride ${rideDoc.id}:`, error);
          })
        );
      }
    });

    await Promise.allSettled(reminderPromises);
    console.log(`✅ Sent ${reminderPromises.length} rating reminders`);
  });

/**
 * Helper: Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Emergency Alert Trigger
 */
exports.onEmergencyAlert = onDocumentCreated('emergencyAlerts/{alertId}', async (event) => {
    const alert = event.data.data();
    
    console.log('🚨 EMERGENCY ALERT:', event.params.alertId);

    // Notify the user
    if (alert.userId) {
      const orchestrator = getOrchestrator();
      await orchestrator.sendNotification(alert.userId, {
        type: 'emergency_alert',
        priority: 'critical',
        title: '🚨 Emergency Alert Received',
        body: 'Your emergency alert has been received. Help is on the way. Stay safe.',
        channels: ['push', 'sms'], // Always send SMS for emergencies
        data: {
          alertId: event.params.alertId,
          location: alert.location,
          emergencyType: alert.type
        }
      });
    }

    // Notify emergency contacts if any
    if (alert.emergencyContacts && Array.isArray(alert.emergencyContacts)) {
      const orchestrator = getOrchestrator();
      const contactPromises = alert.emergencyContacts.map(contact => {
        return orchestrator.sendNotification(contact.userId || contact.phone, {
          type: 'emergency_contact_alert',
          priority: 'critical',
          title: '🚨 Emergency Alert',
          body: `${alert.userName || 'Someone'} has triggered an emergency alert. Location: ${alert.location?.address || 'Unknown'}`,
          channels: ['sms'], // Emergency contacts get SMS
          data: {
            alertId: event.params.alertId,
            location: alert.location
          }
        });
      });

      await Promise.allSettled(contactPromises);
    }

    // Notify support team
    await admin.firestore().collection('supportTickets').add({
      type: 'emergency',
      alertId: event.params.alertId,
      userId: alert.userId,
      rideId: alert.rideId,
      location: alert.location,
      priority: 'critical',
      status: 'open',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

// ====================================================================
// STRIPE PAYMENT CLOUD FUNCTIONS
// ====================================================================

// Lazy load Stripe service to avoid deployment timeout
let stripeService = null;
const getStripeService = () => {
  if (!stripeService) {
    stripeService = require('./services/stripeService');
  }
  return stripeService;
};

/**
 * Create Payment Intent for Ride
 */
exports.createPaymentIntent = onCall(async (request) => {
  const {data, auth} = request;
  try {
    if (!auth) {
      throw new Error('User must be authenticated');
    }

    const {amount, rideId, driverId, metadata = {}} = data;

    if (!amount || !rideId || !driverId) {
      throw new Error('Missing required fields: amount, rideId, driverId');
    }

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(auth.uid).get();
    const userData = userDoc.data();

    // Get or create Stripe customer
    const stripe = getStripeService();
    const customer = await stripe.getOrCreateCustomer(
      auth.uid,
      userData.email,
      `${userData.firstName} ${userData.lastName}`
    );

    // Create payment intent
    const paymentIntent = await stripe.createPaymentIntent({
      amount,
      customerId: customer.id,
      rideId,
      riderId: auth.uid,
      driverId,
      metadata
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };

  } catch (error) {
    console.error('❌ createPaymentIntent error:', error);
    throw error;
  }
});

/**
 * Confirm Payment Intent (Server-side confirmation)
 */
exports.confirmPayment = onCall(async (request) => {
  const {data, auth} = request;
  try {
    if (!auth) {
      throw new Error('User must be authenticated');
    }

    const {paymentIntentId} = data;

    if (!paymentIntentId) {
      throw new Error('Missing required field: paymentIntentId');
    }

    const stripe = getStripeService();
    const paymentIntent = await stripe.confirmPaymentIntent(paymentIntentId);

    return {
      success: true,
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id
    };

  } catch (error) {
    console.error('❌ confirmPayment error:', error);
    throw error;
  }
});

/**
 * Create Refund
 */
exports.createRefund = onCall(async (request) => {
  const {data, auth} = request;
  try {
    if (!auth) {
      throw new Error('User must be authenticated');
    }

    const {paymentIntentId, amount, reason} = data;

    if (!paymentIntentId) {
      throw new Error('Missing required field: paymentIntentId');
    }

    const stripe = getStripeService();
    const refund = await stripe.createRefund(paymentIntentId, amount, reason);

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100
    };

  } catch (error) {
    console.error('❌ createRefund error:', error);
    throw error;
  }
});

/**
 * Create Driver Connect Account
 */
exports.createDriverConnectAccount = onCall(async (request) => {
  const {data, auth} = request;
  try {
    if (!auth) {
      throw new Error('User must be authenticated');
    }

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(auth.uid).get();
    const userData = userDoc.data();

    const driverDoc = await admin.firestore().collection('drivers').doc(auth.uid).get();
    const driverData = driverDoc.data();

    // Create Connect account
    const stripe = getStripeService();
    const account = await stripe.createConnectAccount(
      auth.uid,
      userData.email,
      driverData
    );

    // Create onboarding link
    const onboardingUrl = await stripe.createConnectOnboardingLink(
      account.id,
      data.refreshUrl || 'https://anyryde.com/driver/onboarding/refresh',
      data.returnUrl || 'https://anyryde.com/driver/dashboard'
    );

    return {
      success: true,
      accountId: account.id,
      onboardingUrl
    };

  } catch (error) {
    console.error('❌ createDriverConnectAccount error:', error);
    throw error;
  }
});

/**
 * Get Driver Earnings
 */
exports.getDriverEarnings = onCall(async (request) => {
  const {data, auth} = request;
  try {
    if (!auth) {
      throw new Error('User must be authenticated');
    }

    const {startDate, endDate} = data;

    const stripe = getStripeService();
    const earnings = await stripe.getDriverEarnings(
      auth.uid,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    return {
      success: true,
      earnings
    };

  } catch (error) {
    console.error('❌ getDriverEarnings error:', error);
    throw error;
  }
});

/**
 * Get Customer Payment Methods
 */
exports.getPaymentMethods = onCall(async (request) => {
  const {auth} = request;
  try {
    if (!auth) {
      throw new Error('User must be authenticated');
    }

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(auth.uid).get();
    const userData = userDoc.data();

    if (!userData.stripeCustomerId) {
      return {
        success: true,
        paymentMethods: []
      };
    }

    const stripe = getStripeService();
    const paymentMethods = await stripe.getPaymentMethods(userData.stripeCustomerId);

    return {
      success: true,
      paymentMethods
    };

  } catch (error) {
    console.error('❌ getPaymentMethods error:', error);
    throw error;
  }
});

/**
 * Stripe Webhook Handler
 */
exports.stripeWebhook = onCall(async (request) => {
  const {data} = request;
  try {
    const event = data.event;

    console.log('📨 Stripe webhook received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update payment status in Firestore
        const paymentsSnapshot = await admin.firestore()
          .collection('payments')
          .where('paymentIntentId', '==', paymentIntent.id)
          .limit(1)
          .get();

        if (!paymentsSnapshot.empty) {
          const paymentDoc = paymentsSnapshot.docs[0];
          await paymentDoc.ref.update({
            status: 'succeeded',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          const paymentData = paymentDoc.data();

          // Update ride status
          if (paymentData.rideId) {
            await admin.firestore().collection('rides').doc(paymentData.rideId).update({
              'payment.status': 'succeeded',
              'payment.processedAt': admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }

          // Send notifications
          const orchestrator = getOrchestrator();
          
          // Notify rider
          await orchestrator.sendNotification(paymentData.riderId, {
            type: 'payment_received',
            priority: 'medium',
            title: '💰 Payment Confirmed',
            body: `Your payment of $${paymentData.amount.toFixed(2)} has been processed successfully.`,
            channels: ['push'],
            data: {
              paymentId: paymentDoc.id,
              amount: paymentData.amount
            }
          });

          // Notify driver
          await orchestrator.sendNotification(paymentData.driverId, {
            type: 'payment_received',
            priority: 'medium',
            title: '💰 Payment Received',
            body: `You earned $${paymentData.driverAmount.toFixed(2)} from this ride.`,
            channels: ['push'],
            data: {
              paymentId: paymentDoc.id,
              earnings: paymentData.driverAmount
            }
          });
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        // Update payment status
        const failedPaymentsSnapshot = await admin.firestore()
          .collection('payments')
          .where('paymentIntentId', '==', failedPayment.id)
          .limit(1)
          .get();

        if (!failedPaymentsSnapshot.empty) {
          const paymentDoc = failedPaymentsSnapshot.docs[0];
          await paymentDoc.ref.update({
            status: 'failed',
            error: failedPayment.last_payment_error?.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          const paymentData = paymentDoc.data();

          // Notify rider
          const orchestrator = getOrchestrator();
          await orchestrator.sendNotification(paymentData.riderId, {
            type: 'payment_failed',
            priority: 'high',
            title: '❌ Payment Failed',
            body: 'Your payment could not be processed. Please update your payment method.',
            channels: ['push', 'sms'],
            data: {
              paymentId: paymentDoc.id,
              error: failedPayment.last_payment_error?.message
            }
          });
        }
        break;

      case 'account.updated':
        // Driver Connect account updated
        const account = event.data.object;
        
        // Update driver's payment status
        const driversSnapshot = await admin.firestore()
          .collection('drivers')
          .where('stripeConnectAccountId', '==', account.id)
          .limit(1)
          .get();

        if (!driversSnapshot.empty) {
          const driverDoc = driversSnapshot.docs[0];
          await driverDoc.ref.update({
            paymentStatus: account.charges_enabled ? 'active' : 'pending_verification',
            payoutsEnabled: account.payouts_enabled,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return {success: true};

  } catch (error) {
    console.error('❌ stripeWebhook error:', error);
    throw error;
  }
});

