// Driver Reliability Service (for Admin Web App)
// Manages reliability scores, exemptions, and analytics

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

class DriverReliabilityService {
  /**
   * Get reliability score for a driver
   * @param {string} driverId 
   * @returns {Promise<Object>}
   */
  async getDriverReliabilityScore(driverId) {
    try {
      const scoreRef = doc(db, 'driver_reliability_scores', driverId);
      const scoreDoc = await getDoc(scoreRef);

      if (!scoreDoc.exists()) {
        return {
          success: false,
          message: 'No reliability data found for this driver',
          data: null
        };
      }

      return {
        success: true,
        data: scoreDoc.data()
      };
    } catch (error) {
      console.error('Error fetching driver reliability score:', error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Get all driver reliability scores with pagination
   * @param {Object} options - { limit, sortBy, minScore, maxScore }
   * @returns {Promise<Object>}
   */
  async getAllDriverReliabilityScores(options = {}) {
    try {
      const {
        limitCount = 50,
        sortBy = 'score', // 'score', 'updated_at'
        minScore = 0,
        maxScore = 100
      } = options;

      const scoresRef = collection(db, 'driver_reliability_scores');
      let q = query(scoresRef);

      // Apply sorting
      if (sortBy === 'score') {
        q = query(q, orderBy('score', 'desc'));
      } else if (sortBy === 'updated_at') {
        q = query(q, orderBy('updated_at', 'desc'));
      }

      // Apply limit
      q = query(q, limit(limitCount));

      const snapshot = await getDocs(q);
      
      let scores = snapshot.docs.map(doc => ({
        driverId: doc.id,
        ...doc.data()
      }));

      // Filter by score range (client-side since Firestore doesn't support range on non-indexed fields easily)
      scores = scores.filter(score => score.score >= minScore && score.score <= maxScore);

      return {
        success: true,
        data: scores,
        count: scores.length
      };
    } catch (error) {
      console.error('Error fetching all reliability scores:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  /**
   * Get driver metrics (daily breakdown)
   * @param {string} driverId 
   * @param {number} days - Number of days to fetch
   * @returns {Promise<Object>}
   */
  async getDriverMetrics(driverId, days = 30) {
    try {
      const metricsRef = collection(db, 'driver_metrics_daily');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        metricsRef,
        where('driver_id', '==', driverId),
        where('date', '>=', startDate.toISOString().split('T')[0]),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const metrics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      console.error('Error fetching driver metrics:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  /**
   * Get driver cancellation events
   * @param {string} driverId 
   * @param {number} limitCount 
   * @returns {Promise<Object>}
   */
  async getDriverCancelEvents(driverId, limitCount = 20) {
    try {
      const eventsRef = collection(db, 'ride_driver_cancel_events');
      const q = query(
        eventsRef,
        where('driver_id', '==', driverId),
        orderBy('ts', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: events
      };
    } catch (error) {
      console.error('Error fetching cancel events:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  /**
   * Override/validate a cancellation exemption
   * @param {string} eventId - Cancel event ID
   * @param {boolean} isExempt - Whether to mark as exempt
   * @param {string} adminNote - Admin note
   * @returns {Promise<Object>}
   */
  async updateCancellationExemption(eventId, isExempt, adminNote = '') {
    try {
      const eventRef = doc(db, 'ride_driver_cancel_events', eventId);
      
      await updateDoc(eventRef, {
        validated: true,
        provisional: !isExempt,
        admin_override: true,
        admin_note: adminNote,
        validated_at: serverTimestamp()
      });

      return {
        success: true,
        message: `Cancellation marked as ${isExempt ? 'exempt' : 'non-exempt'}`
      };
    } catch (error) {
      console.error('Error updating exemption:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Manually adjust driver reliability score
   * @param {string} driverId 
   * @param {number} newScore - New score (0-100)
   * @param {string} reason - Admin reason
   * @returns {Promise<Object>}
   */
  async adjustDriverScore(driverId, newScore, reason = '') {
    try {
      const scoreRef = doc(db, 'driver_reliability_scores', driverId);
      
      await updateDoc(scoreRef, {
        score: Math.max(0, Math.min(100, newScore)),
        manual_adjustment: true,
        adjustment_reason: reason,
        adjusted_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      return {
        success: true,
        message: 'Driver score updated successfully'
      };
    } catch (error) {
      console.error('Error adjusting score:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get reliability system statistics
   * @returns {Promise<Object>}
   */
  async getSystemStatistics() {
    try {
      const scoresRef = collection(db, 'driver_reliability_scores');
      const snapshot = await getDocs(scoresRef);
      
      const scores = snapshot.docs.map(doc => doc.data().score);
      
      const stats = {
        totalDrivers: scores.length,
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length || 0,
        excellent: scores.filter(s => s >= 90).length,
        good: scores.filter(s => s >= 75 && s < 90).length,
        fair: scores.filter(s => s >= 60 && s < 75).length,
        low: scores.filter(s => s < 60).length
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching system statistics:', error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Get drivers flagged for review (low scores, high cancel rates)
   * @returns {Promise<Object>}
   */
  async getFlaggedDrivers() {
    try {
      const scoresRef = collection(db, 'driver_reliability_scores');
      const q = query(
        scoresRef,
        where('score', '<', 60),
        orderBy('score', 'asc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const flaggedDrivers = snapshot.docs.map(doc => ({
        driverId: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: flaggedDrivers
      };
    } catch (error) {
      console.error('Error fetching flagged drivers:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  /**
   * Send coaching message to driver
   * @param {string} driverId 
   * @param {string} message 
   * @returns {Promise<Object>}
   */
  async sendCoachingMessage(driverId, message) {
    try {
      // This would integrate with your notification service
      const notificationRef = collection(db, 'notifications');
      
      await setDoc(doc(notificationRef), {
        userId: driverId,
        type: 'coaching',
        title: 'Reliability Score Coaching',
        message: message,
        createdAt: serverTimestamp(),
        read: false
      });

      return {
        success: true,
        message: 'Coaching message sent successfully'
      };
    } catch (error) {
      console.error('Error sending coaching message:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Bulk update reliability config
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>}
   */
  async updateReliabilityConfig(config) {
    try {
      const configRef = doc(db, 'appConfig', 'reliability_settings');
      
      await setDoc(configRef, {
        ...config,
        updated_at: serverTimestamp()
      }, { merge: true });

      return {
        success: true,
        message: 'Configuration updated successfully'
      };
    } catch (error) {
      console.error('Error updating config:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get current reliability configuration
   * @returns {Promise<Object>}
   */
  async getReliabilityConfig() {
    try {
      const configRef = doc(db, 'appConfig', 'reliability_settings');
      const configDoc = await getDoc(configRef);

      if (!configDoc.exists()) {
        // Return default config
        return {
          success: true,
          data: {
            SCORE_WINDOW_DAYS: 90,
            SCORE_MIN_AWARDED: 20,
            SCORE_WEIGHTS: {
              AR: 0.30,
              CR: 0.30,
              OTA: 0.25,
              BH: 0.15
            },
            CANCEL_GLOBAL_COOLDOWN_SEC: 120,
            BID_EDIT_LIMIT_PER_RIDE: 3,
            BID_EDIT_LIMIT_WINDOW_SEC: 120,
            ON_TIME_THRESHOLD_MIN: 3,
            EXEMPT_CANCEL_CODES: [
              'RIDER_NO_SHOW',
              'PLATFORM_FAULT',
              'EMERGENCY_APPROVED',
              'VEHICLE_ISSUE'
            ]
          }
        };
      }

      return {
        success: true,
        data: configDoc.data()
      };
    } catch (error) {
      console.error('Error fetching config:', error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }
}

// Export singleton instance
const driverReliabilityService = new DriverReliabilityService();
export default driverReliabilityService;


