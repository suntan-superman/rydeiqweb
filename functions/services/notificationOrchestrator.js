/**
 * Notification Orchestrator
 * Handles multi-channel notification delivery (Push, SMS, Email)
 */

const admin = require('firebase-admin');
const {defineSecret} = require('firebase-functions/params');

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
      channels = ['push'],
      scheduleAt = null,
      requireAck = false
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
   */
  async deliverNotification(userId, notification, userPrefs) {
    const results = {
      push: null,
      sms: null,
      email: null
    };

    const deliveryPromises = [];

    // Push Notification
    if (notification.channels.includes('push')) {
      deliveryPromises.push(
        this.sendPushNotification(userId, notification)
          .then(result => { results.push = result; })
          .catch(error => { results.push = { success: false, error: error.message }; })
      );
    }

    // SMS Notification
    if (notification.channels.includes('sms') && userPrefs.smsEnabled) {
      deliveryPromises.push(
        this.sendSMS(userId, notification)
          .then(result => { results.sms = result; })
          .catch(error => { results.sms = { success: false, error: error.message }; })
      );
    }

    // Email Notification
    if (notification.channels.includes('email') && userPrefs.emailEnabled) {
      deliveryPromises.push(
        this.sendEmail(userId, notification)
          .then(result => { results.email = result; })
          .catch(error => { results.email = { success: false, error: error.message }; })
      );
    }

    await Promise.allSettled(deliveryPromises);

    const success = Object.values(results).some(r => r && r.success);
    
    return {
      success,
      results,
      timestamp: new Date()
    };
  }

  /**
   * Send Push Notification via FCM
   */
  async sendPushNotification(userId, notification) {
    try {
      // Get user's FCM tokens
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const tokens = [];

      // Web token
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }

      // Mobile token
      if (userData.pushToken) {
        tokens.push(userData.pushToken);
      }

      if (tokens.length === 0) {
        return { success: false, error: 'No FCM tokens found' };
      }

      // Build FCM messages (one per token)
      const messages = tokens.map(token => ({
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: this.serializeData({
          notificationId: notification.notificationId,
          type: notification.type,
          priority: notification.priority,
          ...notification.data
        }),
        android: {
          priority: notification.priority === 'critical' ? 'high' : 'normal',
          notification: {
            channelId: this.getAndroidChannel(notification.type),
            sound: this.getNotificationSound(notification.type),
            priority: notification.priority === 'critical' ? 'max' : 'high',
          }
        },
        apns: {
          headers: {
            'apns-priority': notification.priority === 'critical' ? '10' : '5',
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

      // Send messages individually (more reliable than batch)
      const sendPromises = messages.map(msg => 
        admin.messaging().send(msg)
          .then(() => ({ success: true }))
          .catch(error => ({ success: false, error }))
      );

      const responses = await Promise.allSettled(sendPromises);
      const successCount = responses.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failureCount = responses.length - successCount;

      // Handle invalid tokens
      const invalidTokens = [];
      responses.forEach((resp, idx) => {
        if (resp.status === 'fulfilled' && !resp.value.success) {
          const error = resp.value.error;
          if (error && error.code && (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          )) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      // Remove invalid tokens
      if (invalidTokens.length > 0) {
        await this.removeInvalidTokens(userId, invalidTokens);
      }

      console.log(`✅ Push sent: ${successCount}/${tokens.length} tokens`);

      return {
        success: successCount > 0,
        sentTo: successCount,
        totalTokens: tokens.length,
        failureCount: failureCount
      };

    } catch (error) {
      console.error('❌ Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

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
      'ride_started': `🚀 Your ride has started. Have a safe trip!`,
      'ride_completed': `✅ Ride completed! Total: $${notification.data.totalFare || '0.00'}. Thanks for riding with AnyRyde!`,
      'ride_cancelled': `❌ Your ride has been cancelled.`,
      'scheduled_ride_reminder_24hr': `📅 Reminder: You have a ride scheduled for ${notification.data.scheduledTime ? new Date(notification.data.scheduledTime).toLocaleString() : 'tomorrow'}`,
      'scheduled_ride_reminder_1hr': `⏰ Your ride is scheduled in 1 hour. Pickup at ${notification.data.pickup?.address || 'your location'}`,
      'payment_received': `💰 Payment received: $${notification.data.amount || '0.00'}`,
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
      'ride_started': 'rideUpdates',
      'ride_completed': 'rideUpdates',
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
      'ride_started': 'ride-updates',
      'ride_completed': 'ride-updates',
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
      'ride_completed': 'success.mp3',
      'ride_cancelled': 'ui-error-negative-mallets-om-fx-1-00-01.mp3',
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
}

module.exports = new NotificationOrchestrator();

