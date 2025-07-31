// Communication Service
// Handles in-app messaging, masked calling, and communication features

import { db } from './firebase';

class CommunicationService {
  constructor() {
    this.messageListeners = new Map();
    this.callListeners = new Map();
    this.isInitialized = false;
  }

  // Initialize communication service
  async initialize(userId) {
    if (this.isInitialized) return { success: true };

    try {
      // Import Firebase modules dynamically
      const { onSnapshot, collection, query, orderBy, limit } = await import('firebase/firestore');
      
      // Set up real-time message listeners for the user
      const userMessagesRef = collection(db, 'users', userId, 'messages');
      const messagesQuery = query(userMessagesRef, orderBy('timestamp', 'desc'), limit(50));
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            this.handleNewMessage(change.doc.data());
          }
        });
      });

      this.messageListeners.set(userId, unsubscribe);
      this.isInitialized = true;

      return { success: true };
    } catch (error) {
      console.error('Failed to initialize communication service:', error);
      return { success: false, error: error.message };
    }
  }

  // Send a message
  async sendMessage(rideId, senderId, receiverId, message, messageType = 'text') {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      const messageData = {
        rideId,
        senderId,
        receiverId,
        message,
        messageType, // text, image, location, template
        timestamp: serverTimestamp(),
        read: false,
        status: 'sent' // sent, delivered, read
      };

      // Add to ride messages collection
      const rideMessagesRef = collection(db, 'rides', rideId, 'messages');
      const messageRef = await addDoc(rideMessagesRef, messageData);

      // Add to user's message history
      const userMessagesRef = collection(db, 'users', senderId, 'messages');
      await addDoc(userMessagesRef, {
        ...messageData,
        messageId: messageRef.id
      });

      // Add to receiver's message history
      const receiverMessagesRef = collection(db, 'users', receiverId, 'messages');
      await addDoc(receiverMessagesRef, {
        ...messageData,
        messageId: messageRef.id
      });

      return { success: true, messageId: messageRef.id };
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false, error: error.message };
    }
  }

  // Get messages for a ride
  async getRideMessages(rideId, limit = 50) {
    try {
      const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
      
      const messagesRef = collection(db, 'rides', rideId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(limit));
      
      const snapshot = await getDocs(messagesQuery);
      const messages = [];

      snapshot.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { success: true, messages: messages.reverse() };
    } catch (error) {
      console.error('Failed to get ride messages:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId, userId) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      
      const messageRef = doc(db, 'users', userId, 'messages', messageId);
      await updateDoc(messageRef, {
        read: true,
        readAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Create masked phone call
  async createMaskedCall(rideId, callerId, receiverId, callType = 'voice') {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      // Generate masked phone numbers
      const maskedCallerNumber = this.generateMaskedNumber();
      const maskedReceiverNumber = this.generateMaskedNumber();

      const callData = {
        rideId,
        callerId,
        receiverId,
        maskedCallerNumber,
        maskedReceiverNumber,
        callType, // voice, video
        status: 'initiated', // initiated, connecting, connected, ended, failed
        timestamp: serverTimestamp(),
        duration: 0,
        recordingUrl: null
      };

      const callsRef = collection(db, 'calls');
      const callRef = await addDoc(callsRef, callData);

      // Send notification to receiver
      await this.sendCallNotification(receiverId, callData);

      return { 
        success: true, 
        callId: callRef.id,
        maskedCallerNumber,
        maskedReceiverNumber
      };
    } catch (error) {
      console.error('Failed to create masked call:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate masked phone number
  generateMaskedNumber() {
    // Generate a temporary masked number for privacy
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    return `+1-${areaCode}-${prefix}-${lineNumber}`;
  }

  // Send call notification
  async sendCallNotification(userId, callData) {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      const notificationData = {
        type: 'incoming_call',
        title: 'Incoming Call',
        message: `Incoming ${callData.callType} call for your ride`,
        data: callData,
        timestamp: serverTimestamp(),
        read: false
      };

      const notificationsRef = collection(db, 'users', userId, 'notifications');
      await addDoc(notificationsRef, notificationData);

      return { success: true };
    } catch (error) {
      console.error('Failed to send call notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get message templates
  getMessageTemplates() {
    return {
      pickup: [
        "I'm at the pickup location",
        "I'll be there in 2 minutes",
        "Please wait, I'm running a bit late",
        "I can't find the exact location, can you help?"
      ],
      ride: [
        "How's the ride going?",
        "We're making good time",
        "Traffic is heavy, we might be delayed",
        "We're almost at the destination"
      ],
      safety: [
        "I feel unsafe, please help",
        "There's an emergency",
        "I need to report an issue",
        "Please contact support"
      ],
      general: [
        "Thank you for the ride",
        "Great service!",
        "Have a nice day",
        "See you next time"
      ]
    };
  }

  // Send template message
  async sendTemplateMessage(rideId, senderId, receiverId, templateCategory, templateIndex) {
    const templates = this.getMessageTemplates();
    const categoryTemplates = templates[templateCategory] || templates.general;
    const message = categoryTemplates[templateIndex] || categoryTemplates[0];

    return await this.sendMessage(rideId, senderId, receiverId, message, 'template');
  }

  // Get unread message count
  async getUnreadMessageCount(userId) {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const messagesRef = collection(db, 'users', userId, 'messages');
      const unreadQuery = query(messagesRef, where('read', '==', false));
      
      const snapshot = await getDocs(unreadQuery);
      return { success: true, count: snapshot.size };
    } catch (error) {
      console.error('Failed to get unread message count:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle new message (called by real-time listener)
  handleNewMessage(messageData) {
    // Emit event for UI components to listen to
    const event = new CustomEvent('newMessage', { detail: messageData });
    window.dispatchEvent(event);
  }

  // Start voice-to-text recording
  async startVoiceRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Voice recording not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Here you would typically send the audio to a speech-to-text service
        // For now, we'll just return the blob
        return audioBlob;
      };

      mediaRecorder.start();
      return { success: true, mediaRecorder };
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop voice recording
  stopVoiceRecording(mediaRecorder) {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  // Translate message (placeholder for translation service)
  async translateMessage(message, targetLanguage = 'en') {
    // This would integrate with a translation service like Google Translate
    // For now, return the original message
    return { success: true, translatedMessage: message, targetLanguage };
  }

  // Get communication preferences
  async getCommunicationPreferences(userId) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          success: true,
          preferences: {
            allowCalls: userData.communicationPreferences?.allowCalls ?? true,
            allowMessages: userData.communicationPreferences?.allowMessages ?? true,
            allowNotifications: userData.communicationPreferences?.allowNotifications ?? true,
            preferredLanguage: userData.communicationPreferences?.preferredLanguage ?? 'en',
            autoTranslate: userData.communicationPreferences?.autoTranslate ?? false
          }
        };
      }

      return { success: true, preferences: this.getDefaultPreferences() };
    } catch (error) {
      console.error('Failed to get communication preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Update communication preferences
  async updateCommunicationPreferences(userId, preferences) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        communicationPreferences: preferences,
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to update communication preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Get default communication preferences
  getDefaultPreferences() {
    return {
      allowCalls: true,
      allowMessages: true,
      allowNotifications: true,
      preferredLanguage: 'en',
      autoTranslate: false
    };
  }

  // Cleanup resources
  cleanup() {
    // Unsubscribe from all listeners
    this.messageListeners.forEach(unsubscribe => unsubscribe());
    this.messageListeners.clear();
    this.callListeners.forEach(unsubscribe => unsubscribe());
    this.callListeners.clear();
    this.isInitialized = false;
  }
}

// Create and export a singleton instance
export const communicationService = new CommunicationService();
export default communicationService; 