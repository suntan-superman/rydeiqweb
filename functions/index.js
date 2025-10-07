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

