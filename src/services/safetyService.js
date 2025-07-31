// Safety Service
// Handles emergency situations, audio recording, background checks, and safety monitoring

import { db } from './firebase';

class SafetyService {
  constructor() {
    this.audioRecorder = null;
    this.recordingStream = null;
    this.isRecording = false;
    this.emergencyContacts = [];
    this.safetyScore = 100;
    this.incidentReports = [];
  }

  // Initialize safety service
  async initialize(userId) {
    try {
      // Load user safety preferences
      await this.loadSafetyPreferences(userId);
      
      // Set up emergency contacts
      await this.loadEmergencyContacts(userId);
      
      // Initialize audio recording capabilities
      await this.initializeAudioRecording();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize safety service:', error);
      return { success: false, error: error.message };
    }
  }

  // Load safety preferences
  async loadSafetyPreferences(userId) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.safetyPreferences = userData.safetyPreferences || this.getDefaultSafetyPreferences();
      } else {
        this.safetyPreferences = this.getDefaultSafetyPreferences();
      }
    } catch (error) {
      console.error('Failed to load safety preferences:', error);
      this.safetyPreferences = this.getDefaultSafetyPreferences();
    }
  }

  // Get default safety preferences
  getDefaultSafetyPreferences() {
    return {
      enableAudioRecording: true,
      enableLocationSharing: true,
      enableEmergencyContacts: true,
      enableBackgroundChecks: true,
      enableIncidentReporting: true,
      autoShareLocation: false,
      panicButtonEnabled: true,
      safetyNotifications: true
    };
  }

  // Load emergency contacts
  async loadEmergencyContacts(userId) {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      
      const contactsRef = collection(db, 'users', userId, 'emergencyContacts');
      const snapshot = await getDocs(contactsRef);
      
      this.emergencyContacts = [];
      snapshot.forEach(doc => {
        this.emergencyContacts.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
      this.emergencyContacts = [];
    }
  }

  // Initialize audio recording
  async initializeAudioRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording not supported');
      }

      // Request microphone permission
      this.recordingStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to initialize audio recording:', error);
      return { success: false, error: error.message };
    }
  }

  // Start audio recording
  async startAudioRecording(rideId, reason = 'safety') {
    if (this.isRecording) {
      return { success: false, error: 'Already recording' };
    }

    if (!this.recordingStream) {
      const initResult = await this.initializeAudioRecording();
      if (!initResult.success) {
        return initResult;
      }
    }

    try {
      this.audioRecorder = new MediaRecorder(this.recordingStream);
      const audioChunks = [];

      this.audioRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      this.audioRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await this.saveAudioRecording(audioBlob, rideId, reason);
      };

      this.audioRecorder.start();
      this.isRecording = true;

      // Log recording start
      await this.logSafetyEvent(rideId, 'audio_recording_started', {
        reason,
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop audio recording
  async stopAudioRecording(rideId) {
    if (!this.isRecording || !this.audioRecorder) {
      return { success: false, error: 'Not recording' };
    }

    try {
      this.audioRecorder.stop();
      this.isRecording = false;

      // Log recording stop
      await this.logSafetyEvent(rideId, 'audio_recording_stopped', {
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to stop audio recording:', error);
      return { success: false, error: error.message };
    }
  }

  // Save audio recording
  async saveAudioRecording(audioBlob, rideId, reason) {
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      // Upload to Firebase Storage
      const storageRef = ref(db, `safety-recordings/${rideId}/${Date.now()}.wav`);
      await uploadBytes(storageRef, audioBlob);
      const downloadURL = await getDownloadURL(storageRef);

      // Save recording metadata
      const recordingData = {
        rideId,
        reason,
        downloadURL,
        duration: audioBlob.size, // Approximate duration
        timestamp: serverTimestamp(),
        type: 'audio_recording'
      };

      const recordingsRef = collection(db, 'safetyRecordings');
      await addDoc(recordingsRef, recordingData);

      return { success: true, downloadURL };
    } catch (error) {
      console.error('Failed to save audio recording:', error);
      return { success: false, error: error.message };
    }
  }

  // Trigger emergency panic button
  async triggerPanicButton(rideId, userId, location, reason = 'emergency') {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      // Create emergency alert
      const emergencyData = {
        rideId,
        userId,
        location,
        reason,
        timestamp: serverTimestamp(),
        status: 'active',
        type: 'panic_button'
      };

      const emergencyRef = collection(db, 'emergencyAlerts');
      const emergencyDoc = await addDoc(emergencyRef, emergencyData);

      // Notify emergency contacts
      await this.notifyEmergencyContacts(userId, location, reason);

      // Notify support team
      await this.notifySupportTeam(emergencyData);

      // Start audio recording if enabled
      if (this.safetyPreferences.enableAudioRecording) {
        await this.startAudioRecording(rideId, 'emergency');
      }

      // Log emergency event
      await this.logSafetyEvent(rideId, 'panic_button_triggered', {
        reason,
        location,
        timestamp: new Date().toISOString()
      });

      return { success: true, emergencyId: emergencyDoc.id };
    } catch (error) {
      console.error('Failed to trigger panic button:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify emergency contacts
  async notifyEmergencyContacts(userId, location, reason) {
    try {
      for (const contact of this.emergencyContacts) {
        // In production, this would integrate with SMS/email services
        console.log(`Emergency notification sent to ${contact.name} at ${contact.phone}`);
        
        // Log notification
        await this.logSafetyEvent(null, 'emergency_contact_notified', {
          contactId: contact.id,
          contactName: contact.name,
          reason,
          location,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to notify emergency contacts:', error);
    }
  }

  // Notify support team
  async notifySupportTeam(emergencyData) {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      const supportNotification = {
        ...emergencyData,
        priority: 'high',
        assignedTo: null,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const supportRef = collection(db, 'supportTickets');
      await addDoc(supportRef, supportNotification);

      return { success: true };
    } catch (error) {
      console.error('Failed to notify support team:', error);
      return { success: false, error: error.message };
    }
  }

  // Report safety incident
  async reportIncident(rideId, userId, incidentData) {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      const incident = {
        rideId,
        userId,
        ...incidentData,
        timestamp: serverTimestamp(),
        status: 'reported',
        type: 'safety_incident'
      };

      const incidentsRef = collection(db, 'safetyIncidents');
      const incidentDoc = await addDoc(incidentsRef, incident);

      // Update safety score
      await this.updateSafetyScore(rideId, -10); // Deduct points for incident

      // Log incident
      await this.logSafetyEvent(rideId, 'incident_reported', {
        incidentType: incidentData.type,
        description: incidentData.description,
        timestamp: new Date().toISOString()
      });

      return { success: true, incidentId: incidentDoc.id };
    } catch (error) {
      console.error('Failed to report incident:', error);
      return { success: false, error: error.message };
    }
  }

  // Update safety score
  async updateSafetyScore(rideId, points) {
    try {
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      
      const rideRef = doc(db, 'rides', rideId);
      await updateDoc(rideRef, {
        safetyScore: increment(points),
        lastSafetyUpdate: new Date().toISOString()
      });

      this.safetyScore = Math.max(0, Math.min(100, this.safetyScore + points));
    } catch (error) {
      console.error('Failed to update safety score:', error);
    }
  }

  // Log safety event
  async logSafetyEvent(rideId, eventType, eventData) {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      const event = {
        rideId,
        eventType,
        ...eventData,
        timestamp: serverTimestamp()
      };

      const eventsRef = collection(db, 'safetyEvents');
      await addDoc(eventsRef, event);
    } catch (error) {
      console.error('Failed to log safety event:', error);
    }
  }

  // Get safety analytics
  async getSafetyAnalytics(rideId) {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const eventsRef = collection(db, 'safetyEvents');
      const eventsQuery = query(eventsRef, where('rideId', '==', rideId));
      const snapshot = await getDocs(eventsQuery);

      const events = [];
      snapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        events,
        safetyScore: this.safetyScore,
        incidentCount: events.filter(e => e.eventType === 'incident_reported').length,
        emergencyCount: events.filter(e => e.eventType === 'panic_button_triggered').length
      };
    } catch (error) {
      console.error('Failed to get safety analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Add emergency contact
  async addEmergencyContact(userId, contactData) {
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      
      const contact = {
        ...contactData,
        createdAt: new Date().toISOString()
      };

      const contactsRef = collection(db, 'users', userId, 'emergencyContacts');
      const contactDoc = await addDoc(contactsRef, contact);

      // Update local contacts
      this.emergencyContacts.push({
        id: contactDoc.id,
        ...contact
      });

      return { success: true, contactId: contactDoc.id };
    } catch (error) {
      console.error('Failed to add emergency contact:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove emergency contact
  async removeEmergencyContact(userId, contactId) {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      
      const contactRef = doc(db, 'users', userId, 'emergencyContacts', contactId);
      await deleteDoc(contactRef);

      // Update local contacts
      this.emergencyContacts = this.emergencyContacts.filter(c => c.id !== contactId);

      return { success: true };
    } catch (error) {
      console.error('Failed to remove emergency contact:', error);
      return { success: false, error: error.message };
    }
  }

  // Update safety preferences
  async updateSafetyPreferences(userId, preferences) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        safetyPreferences: preferences,
        updatedAt: new Date().toISOString()
      });

      this.safetyPreferences = preferences;
      return { success: true };
    } catch (error) {
      console.error('Failed to update safety preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if location is in safe zone
  isLocationSafe(location, safeZones = []) {
    // Simple distance-based safety check
    // In production, this would use more sophisticated geofencing
    for (const zone of safeZones) {
      const distance = this.calculateDistance(location, zone.center);
      if (distance <= zone.radius) {
        return true;
      }
    }
    return false;
  }

  // Calculate distance between two points
  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Get safety recommendations
  getSafetyRecommendations(rideData) {
    const recommendations = [];

    // Check ride time
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      recommendations.push({
        type: 'warning',
        message: 'Late night ride - consider sharing your location with emergency contacts',
        priority: 'high'
      });
    }

    // Check ride distance
    if (rideData.distance > 50000) { // 50km
      recommendations.push({
        type: 'info',
        message: 'Long distance ride - ensure you have emergency contacts set up',
        priority: 'medium'
      });
    }

    // Check if audio recording is enabled
    if (!this.safetyPreferences.enableAudioRecording) {
      recommendations.push({
        type: 'suggestion',
        message: 'Enable audio recording for enhanced safety',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  // Cleanup resources
  cleanup() {
    if (this.audioRecorder && this.isRecording) {
      this.audioRecorder.stop();
    }
    
    if (this.recordingStream) {
      this.recordingStream.getTracks().forEach(track => track.stop());
    }
    
    this.isRecording = false;
    this.audioRecorder = null;
    this.recordingStream = null;
  }
}

// Create and export a singleton instance
export const safetyService = new SafetyService();
export default safetyService; 