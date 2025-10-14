/**
 * Notification Orchestrator
 * Handles multi-channel notification delivery (Push, SMS, Email)
 */

const admin = require('firebase-admin');
const {defineSecret} = require('firebase-functions/params');
const fetch = require('node-fetch');

class NotificationOrchestrator {
  constructor() {
    this.twilioClient = null;
    this.sgMail = null;
  }

  /**
   * Initialize services (lazy loading)
   */
  async initialize() {
    if (!this.twilioClient) {
      // Try to get Twilio config from environment variables
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (twilioAccountSid && twilioAuthToken) {
        const twilio = require('twilio');
        this.twilioClient = twilio(twilioAccountSid, twilioAuthToken);
        this.twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      }
    }

    if (!this.sgMail) {
      const sendGridApiKey = process.env.SENDGRID_API_KEY;
      if (sendGridApiKey) {
        this.sgMail = require('@sendgrid/mail');
        this.sgMail.setApiKey(sendGridApiKey);
      }
    }
  }

  /**
   * Send multi-channel notification
   */
  async sendNotification(userId, notificationData) {
    const {
      type,
      priority = 'medium',
      title,
      body,
      data = {},
      channels = ['push'], // Default: push only (no SMS)
      scheduleAt = null,
      requireAck = false,
      rideId = null, // For collapse keys
      collapseKey = null // Custom collapse key
    } = notificationData;

    try {
      await this.initialize();

      // Get user preferences
      const userPrefs = await this.getUserNotificationPreferences(userId);
      
      // Check if notification is allowed
      if (!this.isNotificationAllowed(type, userPrefs, priority)) {
        console.log(`📵 Notification blocked by user preference: ${type}`);
        return { success: false, reason: 'user_preference' };
      }

      // Check Do Not Disturb
      if (this.isDoNotDisturb(userPrefs) && priority !== 'critical') {
        console.log('🌙 DND active, scheduling for later');
        scheduleAt = this.getNextAllowedTime(userPrefs);
      }

      // Check rate limiting (1 notification per 30 seconds per ride)
      if (rideId && priority !== 'critical') {
        const shouldRateLimit = await this.shouldRateLimit(rideId);
        if (shouldRateLimit) {
          console.log(`⏱️ Rate limit hit for ride ${rideId}, skipping`);
          return { success: false, reason: 'rate_limited' };
        }
      }

      // Generate collapse key
      const finalCollapseKey = collapseKey || (rideId ? `ride:${rideId}` : null);

      // Store notification in Firestore
      const notificationRef = await admin.firestore()
        .collection('notifications')
        .add({
          userId,
          type,
          priority,
          title,
          body,
          data,
          channels,
          status: scheduleAt ? 'scheduled' : 'pending',
          scheduleAt,
          requireAck,
          rideId, // For tracking
          collapseKey: finalCollapseKey, // For collapsing notifications
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          deliveryAttempts: [],
          read: false
        });

      // If scheduled, return (will be processed by scheduler)
      if (scheduleAt) {
        return { success: true, notificationId: notificationRef.id, scheduled: true };
      }

      // Send immediately
      const results = await this.deliverNotification(userId, {
        notificationId: notificationRef.id,
        type,
        priority,
        title,
        body,
        data,
        channels
      }, userPrefs);

      // Update delivery status
      await notificationRef.update({
        status: results.success ? 'delivered' : 'failed',
        deliveryAttempts: admin.firestore.FieldValue.arrayUnion({
          timestamp: new Date(),
          results
        }),
        deliveredAt: results.success ? admin.firestore.FieldValue.serverTimestamp() : null
      });

      return {
        success: results.success,
        notificationId: notificationRef.id,
        results
      };

    } catch (error) {
      console.error('❌ Notification orchestration error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deliver notification via all enabled channels
   * NO SMS - Only Push + Email fallback for critical events
   */
  async deliverNotification(userId, notification, userPrefs) {
    const results = {
      push: null,
      email: null
    };

    const deliveryPromises = [];

    // PRIMARY: Push Notification (FCM + Expo)
    if (notification.channels.includes('push')) {
      deliveryPromises.push(
        this.sendPushNotification(userId, notification)
          .then(result => { results.push = result; })
          .catch(error => { results.push = { success: false, error: error.message }; })
      );
    }

    // FALLBACK: Email for critical events only
    const isCriticalEvent = this.isCriticalEvent(notification.type);
    if (isCriticalEvent || notification.channels.includes('email')) {
      if (userPrefs.emailEnabled !== false) { // Email enabled by default
        deliveryPromises.push(
          this.sendEmail(userId, notification)
            .then(result => { results.email = result; })
            .catch(error => { results.email = { success: false, error: error.message }; })
        );
      }
    }

    // SMS DISABLED: Not used per requirements
    // SMS functionality still available in code but not called

    await Promise.allSettled(deliveryPromises);

    const success = Object.values(results).some(r => r && r.success);
    
    return {
      success,
      results,
      timestamp: new Date()
    };
  }

  /**
   * Send Push Notification via FCM (web) + Expo (mobile)
   */
  async sendPushNotification(userId, notification) {
    try {
      // Try both users and drivers collections
      let userDoc = await admin.firestore().collection('users').doc(userId).get();
      if (!userDoc.exists) {
        userDoc = await admin.firestore().collection('drivers').doc(userId).get();
      }

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const fcmTokens = [];
      const expoPushToken = userData.expoPushToken;

      // Web FCM token
      if (userData.fcmToken) {
        fcmTokens.push(userData.fcmToken);
      }

      // Mobile FCM token (legacy)
      if (userData.pushToken) {
        fcmTokens.push(userData.pushToken);
      }

      // Send to both FCM and Expo if available
      const results = [];

      // Send via FCM (web browsers)
      if (fcmTokens.length > 0) {
        const fcmResult = await this.sendFCMNotification(fcmTokens, notification);
        results.push(fcmResult);
      }

      // Send via Expo (mobile apps)
      if (expoPushToken) {
        const expoResult = await this.sendExpoNotification(expoPushToken, notification);
        results.push(expoResult);
      }

      if (results.length === 0) {
        return { success: false, error: 'No push tokens found' };
      }

      // Return combined results
      const totalSent = results.reduce((sum, r) => sum + (r.sentTo || 0), 0);
      const anySuccess = results.some(r => r.success);

      return {
        success: anySuccess,
        sentTo: totalSent,
        fcm: results[0] || null,
        expo: results[1] || results[0] // Expo could be first if no FCM
      };

    } catch (error) {
      console.error('❌ Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Old FCM-only code removed - now using sendFCMNotification() and sendExpoNotification()

  /**
   * Send SMS via Twilio
   */
  async sendSMS(userId, notification) {
    try {
      if (!this.twilioClient) {
        console.warn('⚠️ Twilio not configured, skipping SMS');
        return { success: false, error: 'Twilio not configured' };
      }

      // Get user's phone number
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const phoneNumber = userData.phone || userData.phoneNumber;

      if (!phoneNumber) {
        return { success: false, error: 'No phone number found' };
      }

      // Check SMS preferences
      if (userData.notificationPreferences?.smsEnabled === false && notification.priority !== 'critical') {
        return { success: false, error: 'SMS disabled by user' };
      }

      // Format message
      const smsBody = this.formatSMSMessage(notification);

      // Send via Twilio
      const message = await this.twilioClient.messages.create({
        body: smsBody,
        to: phoneNumber,
        from: this.twilioPhone
      });

      // Log SMS delivery
      await admin.firestore()
        .collection('smsLogs')
        .add({
          userId,
          notificationId: notification.notificationId,
          to: phoneNumber,
          body: smsBody,
          twilioSid: message.sid,
          status: message.status,
          type: notification.type,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });

      console.log(`✅ SMS sent to ${phoneNumber}: ${message.sid}`);

      return {
        success: true,
        twilioSid: message.sid,
        status: message.status
      };

    } catch (error) {
      console.error('❌ SMS error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Email via SendGrid
   */
  async sendEmail(userId, notification) {
    try {
      if (!this.sgMail) {
        console.warn('⚠️ SendGrid not configured, skipping email');
        return { success: false, error: 'SendGrid not configured' };
      }

      // Get user's email
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const email = userData.email;

      if (!email) {
        return { success: false, error: 'No email found' };
      }

      // Check email preferences
      if (userData.notificationPreferences?.emailEnabled === false && notification.priority !== 'critical') {
        return { success: false, error: 'Email disabled by user' };
      }

      // Build email
      const emailData = this.buildEmail(notification, userData);

      const msg = {
        to: email,
        from: 'notifications@anyryde.com', // Update with your verified sender
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      };

      await this.sgMail.send(msg);

      console.log(`✅ Email sent to ${email}`);

      return {
        success: true,
        to: email
      };

    } catch (error) {
      console.error('❌ Email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format SMS message
   */
  formatSMSMessage(notification) {
    const templates = {
      'driver_application_approved': `🎉 Congratulations! Your AnyRyde driver application has been approved. Download the driver app to start earning.`,
      'driver_application_rejected': `Your AnyRyde driver application requires additional review. Please check your email for details.`,
      'ride_request': `🚗 New ride request! ${notification.data.pickup?.address || 'Pickup'} → ${notification.data.destination?.address || 'Destination'}. Fare: $${notification.data.estimatedFare || 'TBD'}`,
      'ride_accepted': `✅ ${notification.data.driverName || 'Your driver'} is on the way! ETA: ${notification.data.eta || '5 min'}`,
      'driver_arrived': `📍 Your driver has arrived at the pickup location.`,
      'driver_nearby': `🚗 ${notification.data.driverName || 'Your driver'} is almost here! About ${notification.data.eta || '2'} minute${notification.data.eta > 1 ? 's' : ''} away.`,
      'ride_started': `🚀 Your ride has started. Have a safe trip!`,
      'ride_completed': `✅ Ride completed! Total: $${notification.data.totalFare || '0.00'}. Thanks for riding with AnyRyde!`,
      'ride_cancelled': `❌ Your ride has been cancelled.`,
      'scheduled_ride_reminder_24hr': `📅 Reminder: You have a ride scheduled for ${notification.data.scheduledTime ? new Date(notification.data.scheduledTime).toLocaleString() : 'tomorrow'}`,
      'scheduled_ride_reminder_1hr': `⏰ Your ride is scheduled in 1 hour. Pickup at ${notification.data.pickup?.address || 'your location'}`,
      'payment_received': `💰 Payment received: $${notification.data.amount || '0.00'}`,
      'rating_reminder': `⭐ How was your ride? Rate your experience to help us improve!`,
      'emergency_alert': `🚨 Emergency alert triggered. Support team has been notified. Stay safe.`
    };

    return templates[notification.type] || notification.body;
  }

  /**
   * Build email HTML
   */
  buildEmail(notification, userData) {
    const userName = userData.displayName || userData.firstName || 'there';

    return {
      subject: notification.title,
      text: `Hi ${userName},\n\n${notification.body}\n\nBest regards,\nThe AnyRyde Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10B981; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AnyRyde</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #111827;">${notification.title}</h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Hi ${userName},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              ${notification.body}
            </p>
            ${this.getEmailActionButton(notification)}
          </div>
          <div style="background-color: #111827; padding: 20px; text-align: center;">
            <p style="color: #9CA3AF; font-size: 14px; margin: 0;">
              © ${new Date().getFullYear()} AnyRyde. All rights reserved.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 10px 0 0 0;">
              <a href="https://anyryde.com/privacy" style="color: #10B981;">Privacy Policy</a> | 
              <a href="https://anyryde.com/terms" style="color: #10B981;">Terms of Service</a>
            </p>
          </div>
        </div>
      `
    };
  }

  /**
   * Get email action button
   */
  getEmailActionButton(notification) {
    const buttons = {
      'driver_application_approved': '<a href="https://anyryde.com/driver-download" style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Download Driver App</a>',
      'ride_completed': '<a href="https://anyryde.com/ride-history" style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Receipt</a>'
    };

    return buttons[notification.type] || '';
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId) {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return this.getDefaultPreferences();
    }

    const userData = userDoc.data();
    return userData.notificationPreferences || this.getDefaultPreferences();
  }

  /**
   * Default notification preferences
   */
  getDefaultPreferences() {
    return {
      // Push notifications
      pushEnabled: true,
      rideRequests: true,
      rideUpdates: true,
      payments: true,
      promotions: false,
      safety: true,
      system: true,
      
      // SMS notifications
      smsEnabled: false, // Opt-in
      smsRideRequests: false,
      smsRideUpdates: true,
      smsEmergency: true,
      
      // Email notifications
      emailEnabled: true,
      emailReceipts: true,
      emailWeeklySummary: true,
      emailPromotions: false,
      
      // Preferences
      sound: true,
      vibration: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    };
  }

  /**
   * Check if notification is allowed
   */
  isNotificationAllowed(type, prefs, priority) {
    // Always allow critical notifications
    if (priority === 'critical') {
      return true;
    }

    // Check type-specific preferences
    const typeMap = {
      'ride_request': 'rideRequests',
      'ride_update': 'rideUpdates',
      'ride_accepted': 'rideUpdates',
      'driver_arrived': 'rideUpdates',
      'driver_nearby': 'rideUpdates',
      'ride_started': 'rideUpdates',
      'ride_completed': 'rideUpdates',
      'rating_reminder': 'rideUpdates',
      'payment': 'payments',
      'promotion': 'promotions',
      'safety': 'safety',
      'emergency_alert': 'safety',
      'system': 'system'
    };

    const prefKey = typeMap[type];
    return prefKey ? prefs[prefKey] !== false : true;
  }

  /**
   * Check if in Do Not Disturb period
   */
  isDoNotDisturb(prefs) {
    if (!prefs.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= prefs.quietHoursStart || currentTime < prefs.quietHoursEnd;
  }

  /**
   * Get next allowed time (after DND)
   */
  getNextAllowedTime(prefs) {
    const now = new Date();
    const [endHour, endMinute] = prefs.quietHoursEnd.split(':');
    
    const nextTime = new Date();
    nextTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
    
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }
    
    return admin.firestore.Timestamp.fromDate(nextTime);
  }

  /**
   * Get Android notification channel
   */
  getAndroidChannel(type) {
    const channels = {
      'ride_request': 'ride-requests',
      'ride_update': 'ride-updates',
      'ride_accepted': 'ride-updates',
      'driver_arrived': 'ride-updates',
      'driver_nearby': 'ride-updates',
      'ride_started': 'ride-updates',
      'ride_completed': 'ride-updates',
      'rating_reminder': 'ratings',
      'bid_update': 'bid-updates',
      'payment': 'payments',
      'emergency_alert': 'emergency',
      'system': 'system'
    };
    return channels[type] || 'default';
  }

  /**
   * Get notification sound
   */
  getNotificationSound(type) {
    const sounds = {
      'ride_request': 'mixkit-fast-car-drive-by-1538.wav',
      'bid_accepted': 'mixkit-achievement-bell-600.wav',
      'driver_nearby': 'default',
      'ride_completed': 'success.mp3',
      'ride_cancelled': 'ui-error-negative-mallets-om-fx-1-00-01.mp3',
      'rating_reminder': 'default',
      'emergency_alert': 'default'
    };
    return sounds[type] || 'default';
  }

  /**
   * Remove invalid FCM tokens
   */
  async removeInvalidTokens(userId, tokens) {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return;
    
    const userData = userDoc.data();
    const updates = {};
    
    if (tokens.includes(userData.fcmToken)) {
      updates.fcmToken = admin.firestore.FieldValue.delete();
    }
    
    if (tokens.includes(userData.pushToken)) {
      updates.pushToken = admin.firestore.FieldValue.delete();
    }

    if (Object.keys(updates).length > 0) {
      await userRef.update(updates);
      console.log(`🗑️ Removed invalid tokens for user ${userId}`);
    }
  }

  /**
   * Serialize data for FCM (all values must be strings)
   */
  serializeData(data) {
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'object') {
        serialized[key] = JSON.stringify(value);
      } else {
        serialized[key] = String(value);
      }
    }
    return serialized;
  }

  /**
   * Check if notification type is critical (requires email fallback)
   */
  isCriticalEvent(notificationType) {
    const criticalEvents = [
      'bid_matched',
      'bid_accepted',
      'driver_arrived',
      'wait_time_started',
      'trip_complete',
      'payment_failure',
      'payment_received',
      'emergency_alert',
      'ride_cancelled'
    ];
    return criticalEvents.includes(notificationType);
  }

  /**
   * Check if should rate limit notification (max 1 per 30 seconds per ride)
   */
  async shouldRateLimit(rideId) {
    try {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      
      const recentNotifications = await admin.firestore()
        .collection('notifications')
        .where('rideId', '==', rideId)
        .where('createdAt', '>', thirtySecondsAgo)
        .limit(1)
        .get();

      return !recentNotifications.empty;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false; // Don't block on error
    }
  }

  /**
   * Send FCM Notification (for web browsers)
   */
  async sendFCMNotification(tokens, notification) {
    try {
      const messages = tokens.map(token => ({
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: this.serializeData({
          notificationId: notification.notificationId,
          type: notification.type,
          priority: notification.priority,
          collapseKey: notification.collapseKey,
          ...notification.data
        }),
        android: {
          priority: notification.priority === 'critical' ? 'high' : 'normal',
          collapseKey: notification.collapseKey || undefined,
          notification: {
            channelId: this.getAndroidChannel(notification.type),
            sound: this.getNotificationSound(notification.type),
            priority: notification.priority === 'critical' ? 'max' : 'high',
          }
        },
        apns: {
          headers: {
            'apns-priority': notification.priority === 'critical' ? '10' : '5',
            'apns-collapse-id': notification.collapseKey || undefined,
          },
          payload: {
            aps: {
              sound: this.getNotificationSound(notification.type),
              badge: 1,
              category: notification.type,
            }
          }
        },
        token: token
      }));

      const sendPromises = messages.map(msg => 
        admin.messaging().send(msg)
          .then(() => ({ success: true }))
          .catch(error => ({ success: false, error }))
      );

      const responses = await Promise.allSettled(sendPromises);
      const successCount = responses.filter(r => r.status === 'fulfilled' && r.value.success).length;

      console.log(`✅ FCM sent: ${successCount}/${tokens.length} tokens`);

      return {
        success: successCount > 0,
        sentTo: successCount,
        totalTokens: tokens.length
      };
    } catch (error) {
      console.error('❌ FCM error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Expo Push Notification (for mobile apps)
   */
  async sendExpoNotification(expoPushToken, notification) {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: {
          notificationId: notification.notificationId,
          type: notification.type,
          priority: notification.priority,
          collapseKey: notification.collapseKey,
          ...notification.data
        },
        categoryId: notification.type,
        channelId: this.getAndroidChannel(notification.type),
        priority: notification.priority === 'critical' ? 'high' : 'default',
        badge: 1,
      };

      // Send to Expo push service
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.data && result.data[0]) {
        const status = result.data[0].status;
        if (status === 'ok') {
          console.log('✅ Expo push sent successfully');
          return { success: true, sentTo: 1 };
        } else {
          console.error('❌ Expo push error:', result.data[0].message);
          return { success: false, error: result.data[0].message };
        }
      }

      return { success: false, error: 'Unknown Expo response' };
    } catch (error) {
      console.error('❌ Expo notification error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationOrchestrator();

