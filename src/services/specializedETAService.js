import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

/**
 * Specialized ETA Service for Different Ride Types
 * Handles ETA calculations and communication for specialized services
 */
class SpecializedETAService {
  constructor() {
    this.rideTypeConfigs = {
      standard: {
        baseETA: 5, // 5 minutes base
        maxETA: 15, // 15 minutes max
        communicationRequired: false,
        message: "Your driver will arrive shortly"
      },
      premium: {
        baseETA: 3, // 3 minutes base
        maxETA: 10, // 10 minutes max
        communicationRequired: false,
        message: "Your premium driver will arrive shortly"
      },
      wheelchair: {
        baseETA: 8, // 8 minutes base
        maxETA: 20, // 20 minutes max
        communicationRequired: true,
        message: "Your wheelchair-accessible vehicle will arrive shortly. Driver will assist with boarding."
      },
      pet_friendly: {
        baseETA: 7, // 7 minutes base
        maxETA: 18, // 18 minutes max
        communicationRequired: true,
        message: "Your pet-friendly driver will arrive shortly. Please have your pet ready."
      },
      tow_truck: {
        baseETA: 30, // 30 minutes base
        maxETA: 45, // 45 minutes max
        communicationRequired: true,
        message: "Tow truck service typically takes 30-45 minutes. Driver will contact you with exact ETA.",
        requiresConfirmation: true
      },
      companion_driver: {
        baseETA: 15, // 15 minutes base
        maxETA: 30, // 30 minutes max
        communicationRequired: true,
        message: "Companion driver service requires 15-30 minutes for team coordination.",
        requiresConfirmation: true
      },
      medical: {
        baseETA: 10, // 10 minutes base
        maxETA: 25, // 25 minutes max
        communicationRequired: true,
        message: "Medical transport driver will arrive shortly. Please have medical documents ready.",
        requiresConfirmation: true
      },
      taxi_metered: {
        baseETA: 5, // 5 minutes base
        maxETA: 12, // 12 minutes max
        communicationRequired: false,
        message: "Your metered taxi will arrive shortly"
      },
      large: {
        baseETA: 8, // 8 minutes base
        maxETA: 20, // 20 minutes max
        communicationRequired: true,
        message: "Your large vehicle will arrive shortly. Perfect for families and groups."
      }
    };
  }

  /**
   * Calculate specialized ETA based on ride type and distance
   * @param {string} rideType - Type of ride
   * @param {number} distance - Distance in miles
   * @param {Object} additionalFactors - Additional factors affecting ETA
   * @returns {Object} ETA information with communication details
   */
  calculateSpecializedETA(rideType, distance, additionalFactors = {}) {
    const config = this.rideTypeConfigs[rideType] || this.rideTypeConfigs.standard;
    
    // Calculate base ETA from distance (assuming 25 mph average in city)
    const distanceETA = Math.ceil((distance / 25) * 60); // Convert to minutes
    
    // Calculate specialized ETA
    const specializedETA = Math.max(
      config.baseETA,
      Math.min(config.maxETA, distanceETA + config.baseETA)
    );

    // Adjust for additional factors
    let adjustedETA = specializedETA;
    if (additionalFactors.traffic) {
      adjustedETA = Math.ceil(adjustedETA * 1.3); // 30% increase for traffic
    }
    if (additionalFactors.weather) {
      adjustedETA = Math.ceil(adjustedETA * 1.2); // 20% increase for weather
    }
    if (additionalFactors.timeOfDay) {
      // Rush hour adjustment
      const hour = new Date().getHours();
      if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) {
        adjustedETA = Math.ceil(adjustedETA * 1.4); // 40% increase for rush hour
      }
    }

    return {
      estimatedMinutes: adjustedETA,
      minETA: Math.ceil(adjustedETA * 0.8), // 20% buffer below estimate
      maxETA: Math.ceil(adjustedETA * 1.2), // 20% buffer above estimate
      rideType,
      requiresConfirmation: config.requiresConfirmation || false,
      communicationRequired: config.communicationRequired || false,
      message: config.message,
      factors: {
        distance,
        traffic: additionalFactors.traffic || false,
        weather: additionalFactors.weather || false,
        timeOfDay: additionalFactors.timeOfDay || false
      }
    };
  }

  /**
   * Send ETA communication to rider
   * @param {string} rideId - Ride request ID
   * @param {string} riderId - Rider ID
   * @param {Object} etaInfo - ETA information
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object>} Result of communication
   */
  async sendETACommunication(rideId, riderId, etaInfo, driverId) {
    try {
      const communicationData = {
        rideId,
        riderId,
        driverId,
        type: 'eta_communication',
        etaInfo,
        message: etaInfo.message,
        estimatedArrival: etaInfo.estimatedMinutes,
        requiresConfirmation: etaInfo.requiresConfirmation,
        sentAt: serverTimestamp(),
        status: 'sent'
      };

      // Store communication in ride messages
      const rideMessagesRef = collection(db, 'rideRequests', rideId, 'communications');
      const communicationRef = await addDoc(rideMessagesRef, communicationData);

      // If confirmation is required, create a confirmation request
      if (etaInfo.requiresConfirmation) {
        await this.createConfirmationRequest(rideId, riderId, etaInfo, driverId);
      }

      return {
        success: true,
        communicationId: communicationRef.id,
        data: communicationData
      };
    } catch (error) {
      console.error('Error sending ETA communication:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create confirmation request for specialized rides
   * @param {string} rideId - Ride request ID
   * @param {string} riderId - Rider ID
   * @param {Object} etaInfo - ETA information
   * @param {string} driverId - Driver ID
   */
  async createConfirmationRequest(rideId, riderId, etaInfo, driverId) {
    try {
      const confirmationData = {
        rideId,
        riderId,
        driverId,
        type: 'eta_confirmation',
        estimatedMinutes: etaInfo.estimatedMinutes,
        rideType: etaInfo.rideType,
        message: `Please confirm you can wait ${etaInfo.estimatedMinutes} minutes for your ${etaInfo.rideType} service.`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes to respond
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const confirmationsRef = collection(db, 'rideRequests', rideId, 'confirmations');
      await addDoc(confirmationsRef, confirmationData);

      return { success: true };
    } catch (error) {
      console.error('Error creating confirmation request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get ETA communications for a ride
   * @param {string} rideId - Ride request ID
   * @returns {Promise<Array>} List of communications
   */
  async getETACommunications(rideId) {
    try {
      const communicationsQuery = query(
        collection(db, 'rideRequests', rideId, 'communications'),
        where('type', '==', 'eta_communication'),
        orderBy('sentAt', 'desc')
      );

      const snapshot = await getDocs(communicationsQuery);
      const communications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: communications
      };
    } catch (error) {
      console.error('Error getting ETA communications:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Update driver ETA with real-time information
   * @param {string} rideId - Ride request ID
   * @param {string} driverId - Driver ID
   * @param {Object} updatedETA - Updated ETA information
   * @returns {Promise<Object>} Result of update
   */
  async updateDriverETA(rideId, driverId, updatedETA) {
    try {
      const updateData = {
        type: 'eta_update',
        driverId,
        updatedETA,
        updatedAt: serverTimestamp(),
        status: 'active'
      };

      const communicationsRef = collection(db, 'rideRequests', rideId, 'communications');
      await addDoc(communicationsRef, updateData);

      // Update the ride request with new ETA
      const rideRef = doc(db, 'rideRequests', rideId);
      await updateDoc(rideRef, {
        'driverETA.estimatedMinutes': updatedETA.estimatedMinutes,
        'driverETA.lastUpdated': serverTimestamp(),
        'driverETA.driverId': driverId
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating driver ETA:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get specialized ETA message for ride type
   * @param {string} rideType - Type of ride
   * @param {number} estimatedMinutes - Estimated minutes
   * @returns {string} Formatted message
   */
  getETACommunicationMessage(rideType, estimatedMinutes) {
    const config = this.rideTypeConfigs[rideType] || this.rideTypeConfigs.standard;
    
    const messages = {
      tow_truck: `🚚 Tow truck service: Estimated arrival ${estimatedMinutes} minutes. Our professional driver will contact you shortly with exact timing and towing details.`,
      companion_driver: `👥 Companion driver service: Estimated arrival ${estimatedMinutes} minutes. Our two-driver team is coordinating and will arrive together for enhanced safety.`,
      medical: `🏥 Medical transport: Estimated arrival ${estimatedMinutes} minutes. Our certified medical transport driver will assist with your medical needs and documentation.`,
      wheelchair: `♿ Wheelchair-accessible vehicle: Estimated arrival ${estimatedMinutes} minutes. Driver will assist with wheelchair boarding and securement.`,
      pet_friendly: `🐕 Pet-friendly vehicle: Estimated arrival ${estimatedMinutes} minutes. Please have your pet ready for safe transport.`,
      large: `🚐 Large vehicle: Estimated arrival ${estimatedMinutes} minutes. Perfect for families and groups with extra space and comfort.`,
      premium: `✨ Premium service: Estimated arrival ${estimatedMinutes} minutes. Your luxury vehicle and top-rated driver are on the way.`,
      standard: `🚗 Standard ride: Estimated arrival ${estimatedMinutes} minutes. Your reliable driver is on the way.`
    };

    return messages[rideType] || messages.standard;
  }

  /**
   * Calculate dynamic ETA based on current conditions
   * @param {string} rideType - Type of ride
   * @param {Object} driverLocation - Driver's current location
   * @param {Object} pickupLocation - Pickup location
   * @param {Object} conditions - Current conditions
   * @returns {Object} Dynamic ETA calculation
   */
  calculateDynamicETA(rideType, driverLocation, pickupLocation, conditions = {}) {
    const config = this.rideTypeConfigs[rideType] || this.rideTypeConfigs.standard;
    
    // Calculate distance between driver and pickup
    const distance = this.calculateDistance(driverLocation, pickupLocation);
    
    // Base calculation
    let etaMinutes = Math.ceil((distance / 25) * 60) + config.baseETA;
    
    // Apply condition adjustments
    if (conditions.traffic === 'heavy') etaMinutes *= 1.5;
    if (conditions.traffic === 'moderate') etaMinutes *= 1.2;
    if (conditions.weather === 'bad') etaMinutes *= 1.3;
    if (conditions.timeOfDay === 'rush') etaMinutes *= 1.4;
    
    // Apply ride type specific adjustments
    if (rideType === 'tow_truck') {
      etaMinutes = Math.max(etaMinutes, 30); // Minimum 30 minutes for tow trucks
    }
    
    return {
      estimatedMinutes: Math.ceil(etaMinutes),
      confidence: this.calculateConfidence(conditions),
      factors: {
        distance,
        traffic: conditions.traffic || 'normal',
        weather: conditions.weather || 'good',
        timeOfDay: conditions.timeOfDay || 'normal'
      }
    };
  }

  /**
   * Calculate confidence level for ETA
   * @param {Object} conditions - Current conditions
   * @returns {number} Confidence percentage
   */
  calculateConfidence(conditions) {
    let confidence = 90; // Base confidence
    
    if (conditions.traffic === 'heavy') confidence -= 20;
    if (conditions.weather === 'bad') confidence -= 15;
    if (conditions.timeOfDay === 'rush') confidence -= 10;
    
    return Math.max(confidence, 60); // Minimum 60% confidence
  }

  /**
   * Calculate distance between two points
   * @param {Object} point1 - First point with lat/lng
   * @param {Object} point2 - Second point with lat/lng
   * @returns {number} Distance in miles
   */
  calculateDistance(point1, point2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Create singleton instance
const specializedETAService = new SpecializedETAService();
export default specializedETAService;
