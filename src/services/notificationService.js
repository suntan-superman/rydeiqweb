// Notification Service
// Handles push notifications, in-app notifications, and notification preferences

import { db } from './firebase';

class NotificationService {
  constructor() {
    this.messaging = null;
    this.notificationPermission = null;
    this.currentToken = null;
    this.notificationPreferences = {};
    this.isInitialized = false;
    this.notificationQueue = [];
    this.maxRetries = 3;
  }

  // Initialize notification service
  async initialize(userId) {
    try {
      // Store the user ID for later use
      this.currentUserId = userId;
      
      // Check if Firebase Messaging is available
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const { getMessaging } = await import('firebase/messaging');
        const { app } = await import('./firebase');
        
        this.messaging = getMessaging(app);
        
        // Request notification permission
        await this.requestNotificationPermission();
        
        // Get FCM token
        await this.getFCMToken();
        
        // Set up message listener
        this.setupMessageListener();
        
        // Load user notification preferences
        await this.loadNotificationPreferences(userId);
        
        this.isInitialized = true;
        console.log('Notification service initialized successfully');
        
        return { success: true };
      } else {
        console.warn('Push notifications not supported in this environment');
        return { success: false, error: 'Push notifications not supported' };
      }
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return { success: false, error: error.message };
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    try {
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      if (Notification.permission === 'granted') {
        this.notificationPermission = 'granted';
        return true;
      }

      if (Notification.permission === 'denied') {
        this.notificationPermission = 'denied';
        throw new Error('Notification permission denied');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        throw new Error('Notification permission denied by user');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw error;
    }
  }

  // Get FCM token
  async getFCMToken() {
    try {
      if (!this.messaging) {
        throw new Error('Messaging not initialized');
      }

      const { getToken } = await import('firebase/messaging');
      
      // Get token with VAPID key
      const token = await getToken(this.messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });

      if (token) {
        this.currentToken = token;
        console.log('FCM token obtained:', token);
        
        // Save token to user's profile
        await this.saveTokenToUser(token);
        
        return token;
      } else {
        throw new Error('No registration token available');
      }
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      throw error;
    }
  }

  // Save FCM token to user profile
  async saveTokenToUser(token) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      
      // Update user's FCM token
      const userRef = doc(db, 'users', this.currentUserId);
      await updateDoc(userRef, {
        fcmToken: token,
        lastTokenUpdate: new Date()
      });
      
      console.log('FCM token saved to user profile');
    } catch (error) {
      console.error('Failed to save FCM token to user:', error);
    }
  }

  // Set up message listener for foreground notifications
  setupMessageListener() {
    if (!this.messaging) return;

    const { onMessage } = require('firebase/messaging');
    
    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Show in-app notification
      this.showInAppNotification(payload);
      
      // Handle different notification types
      this.handleNotificationPayload(payload);
    });
  }

  // Show in-app notification
  showInAppNotification(payload) {
    const { data, notification } = payload;
    
    if (notification) {
      // Create browser notification
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/logo192.png',
        badge: '/logo192.png',
        tag: data?.notificationId || 'anyryde-notification',
        data: data,
        requireInteraction: data?.requireInteraction === 'true',
        actions: this.getNotificationActions(data)
      });

      // Handle notification click
      browserNotification.onclick = (event) => {
        event.preventDefault();
        this.handleNotificationClick(data);
        browserNotification.close();
      };

      // Auto-close after 10 seconds (unless requireInteraction is true)
      if (data?.requireInteraction !== 'true') {
        setTimeout(() => {
          browserNotification.close();
        }, 10000);
      }
    }
  }

  // Get notification actions based on type
  getNotificationActions(data) {
    const actions = [];
    
    switch (data?.type) {
      case 'ride_request':
        actions.push(
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' }
        );
        break;
      case 'ride_update':
        actions.push(
          { action: 'view', title: 'View Details' }
        );
        break;
      case 'emergency':
        actions.push(
          { action: 'respond', title: 'Respond Now' }
        );
        break;
      case 'payment':
        actions.push(
          { action: 'view', title: 'View Receipt' }
        );
        break;
      default:
        // No specific actions for this type, return empty array
        break;
    }
    
    return actions;
  }

  // Handle notification click
  handleNotificationClick(data) {
    const { type, rideId } = data;
    
    switch (type) {
      case 'ride_request':
        // Navigate to ride request page
        window.location.href = `/ride-request/${rideId}`;
        break;
      case 'ride_update':
        // Navigate to ride tracking page
        window.location.href = `/ride-tracking/${rideId}`;
        break;
      case 'emergency':
        // Navigate to emergency page
        window.location.href = `/emergency/${rideId}`;
        break;
      case 'payment':
        // Navigate to payment page
        window.location.href = `/payment/${rideId}`;
        break;
      case 'driver_available':
        // Navigate to driver dashboard
        window.location.href = `/driver-dashboard`;
        break;
      case 'rider_booking':
        // Navigate to rider dashboard
        window.location.href = `/rider-dashboard`;
        break;
      default:
        // Navigate to home page
        window.location.href = '/';
    }
  }

  // Handle notification payload
  handleNotificationPayload(payload) {
    const { data } = payload;
    
    // Store notification in history
    this.storeNotificationHistory(data);
    
    // Update notification count
    this.updateNotificationCount();
    
    // Trigger custom events for specific notification types
    this.triggerCustomEvents(data);
  }

  // Store notification in history
  async storeNotificationHistory(data) {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { getAuth } = await import('firebase/auth');
      const { app } = await import('./firebase');
      
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (user) {
        const notificationData = {
          userId: user.uid,
          type: data.type,
          title: data.title,
          body: data.body,
          rideId: data.rideId,
          timestamp: serverTimestamp(),
          read: false,
          data: data
        };
        
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, notificationData);
      }
    } catch (error) {
      console.error('Failed to store notification history:', error);
    }
  }

  // Update notification count
  updateNotificationCount() {
    // Dispatch custom event for notification count update
    const event = new CustomEvent('notificationCountUpdate', {
      detail: { increment: 1 }
    });
    window.dispatchEvent(event);
  }

  // Trigger custom events for specific notification types
  triggerCustomEvents(data) {
    const eventMap = {
      'ride_request': 'rideRequestReceived',
      'ride_update': 'rideStatusUpdated',
      'emergency': 'emergencyAlert',
      'payment': 'paymentNotification',
      'driver_available': 'driverAvailable',
      'rider_booking': 'riderBooking'
    };
    
    const eventName = eventMap[data.type];
    if (eventName) {
      const event = new CustomEvent(eventName, {
        detail: data
      });
      window.dispatchEvent(event);
    }
  }

  // Send notification to specific user
  async sendNotificationToUser(userId, notificationData) {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      const notification = {
        userId,
        ...notificationData,
        timestamp: serverTimestamp(),
        sent: true,
        delivered: false,
        read: false
      };
      
      const notificationsRef = collection(db, 'notifications');
      const docRef = await addDoc(notificationsRef, notification);
      
      // Send via FCM if user has token
      await this.sendFCMNotification(userId, notificationData);
      
      return { success: true, notificationId: docRef.id };
    } catch (error) {
      console.error('Failed to send notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send FCM notification
  async sendFCMNotification(userId, notificationData) {
    try {
      // Get user's FCM token
      const userToken = await this.getUserFCMToken(userId);
      
      if (!userToken) {
        console.warn('No FCM token found for user:', userId);
        return;
      }
      
      // Send via Cloud Function (recommended approach)
      const { httpsCallable } = await import('firebase/functions');
      const { getFunctions } = await import('firebase/functions');
      const { app } = await import('./firebase');
      
      const functions = getFunctions(app);
      const sendNotification = httpsCallable(functions, 'sendNotification');
      
      await sendNotification({
        token: userToken,
        notification: {
          title: notificationData.title,
          body: notificationData.body
        },
        data: notificationData.data || {}
      });
      
    } catch (error) {
      console.error('Failed to send FCM notification:', error);
    }
  }

  // Get user's FCM token
  async getUserFCMToken(userId) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.fcmToken;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get user FCM token:', error);
      return null;
    }
  }

  // Send ride request notification to drivers
  async sendRideRequestToDrivers(rideRequest, nearbyDrivers) {
    try {
      const notificationData = {
        type: 'ride_request',
        title: 'New Ride Request',
        body: `Ride from ${rideRequest.pickup.address} to ${rideRequest.destination.address}`,
        data: {
          rideId: rideRequest.id,
          pickup: rideRequest.pickup,
          destination: rideRequest.destination,
          estimatedFare: rideRequest.estimatedFare,
          rideType: rideRequest.rideType,
          requireInteraction: 'true'
        }
      };
      
      const promises = nearbyDrivers.map(driver => 
        this.sendNotificationToUser(driver.id, notificationData)
      );
      
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      
      console.log(`Sent ride request to ${successful} drivers`);
      
      return { success: true, sentTo: successful };
    } catch (error) {
      console.error('Failed to send ride request notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Send ride status update
  async sendRideStatusUpdate(rideId, userId, status, additionalData = {}) {
    try {
      const statusMessages = {
        'accepted': 'Your ride has been accepted!',
        'arrived': 'Your driver has arrived',
        'started': 'Your ride has started',
        'completed': 'Your ride has been completed',
        'cancelled': 'Your ride has been cancelled'
      };
      
      const notificationData = {
        type: 'ride_update',
        title: 'Ride Update',
        body: statusMessages[status] || 'Your ride status has been updated',
        data: {
          rideId,
          status,
          ...additionalData
        }
      };
      
      return await this.sendNotificationToUser(userId, notificationData);
    } catch (error) {
      console.error('Failed to send ride status update:', error);
      return { success: false, error: error.message };
    }
  }

  // Send emergency notification
  async sendEmergencyNotification(rideId, userId, emergencyData) {
    try {
      const notificationData = {
        type: 'emergency',
        title: '🚨 Emergency Alert',
        body: 'Emergency situation detected. Please respond immediately.',
        data: {
          rideId,
          emergencyType: emergencyData.type,
          location: emergencyData.location,
          requireInteraction: 'true'
        }
      };
      
      return await this.sendNotificationToUser(userId, notificationData);
    } catch (error) {
      console.error('Failed to send emergency notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send payment notification
  async sendPaymentNotification(rideId, userId, paymentData) {
    try {
      const notificationData = {
        type: 'payment',
        title: 'Payment Processed',
        body: `Payment of $${paymentData.amount} has been processed`,
        data: {
          rideId,
          amount: paymentData.amount,
          paymentMethod: paymentData.method,
          transactionId: paymentData.transactionId
        }
      };
      
      return await this.sendNotificationToUser(userId, notificationData);
    } catch (error) {
      console.error('Failed to send payment notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Load notification preferences
  async loadNotificationPreferences(userId) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.notificationPreferences = userData.notificationPreferences || this.getDefaultPreferences();
      } else {
        this.notificationPreferences = this.getDefaultPreferences();
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      this.notificationPreferences = this.getDefaultPreferences();
    }
  }

  // Get default notification preferences
  getDefaultPreferences() {
    return {
      rideRequests: true,
      rideUpdates: true,
      payments: true,
      promotions: false,
      safety: true,
      system: true,
      sound: true,
      vibration: true
    };
  }

  // Update notification preferences
  async updateNotificationPreferences(userId, preferences) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationPreferences: preferences,
        updatedAt: new Date().toISOString()
      });
      
      this.notificationPreferences = preferences;
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if notification type is enabled
  isNotificationEnabled(type) {
    return this.notificationPreferences[type] !== false;
  }

  // Get unread notification count
  async getUnreadNotificationCount(userId) {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Failed to get unread notification count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    try {
      const { collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: new Date().toISOString()
        });
      });
      
      await batch.commit();
      
      return { success: true, updated: querySnapshot.size };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Get notification history
  async getNotificationHistory(userId, queryLimit = 50) {
    try {
      const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(queryLimit)
      );
      
      const querySnapshot = await getDocs(q);
      const notifications = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, notifications };
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Test notification
  async sendTestNotification(userId) {
    try {
      const notificationData = {
        type: 'system',
        title: 'Test Notification',
        body: 'This is a test notification from AnyRyde',
        data: {
          test: true,
          timestamp: Date.now()
        }
      };
      
      return await this.sendNotificationToUser(userId, notificationData);
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Cleanup
  cleanup() {
    // Clean up any resources
    this.messaging = null;
    this.currentToken = null;
    this.isInitialized = false;
  }
}

// Create and export a singleton instance
export const notificationService = new NotificationService();
export default notificationService; 