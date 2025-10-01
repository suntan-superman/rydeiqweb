import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp,
  onSnapshot,
  addDoc,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Driver Assignment Service for Medical Rides
 * Handles driver matching, notifications, and real-time tracking
 */
class DriverAssignmentService {
  constructor() {
    this.activeListeners = new Map();
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {Object} coord1 - {lat, lng}
   * @param {Object} coord2 - {lat, lng}
   * @returns {number} Distance in miles
   */
  calculateDistance(coord1, coord2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Find available drivers within specified radius of pickup location
   * @param {Object} pickupCoords - {lat, lng}
   * @param {number} radiusMiles - Search radius in miles
   * @param {Object} rideRequirements - {requiresWheelchair, requiresAssistance, etc.}
   * @param {Object} medicalRequirements - Enhanced medical requirements for filtering
   * @returns {Array} Array of available drivers
   */
  async findNearbyDrivers(pickupCoords, radiusMiles = 15, rideRequirements = {}, medicalRequirements = null) {
    try {
      // Query for online, available drivers
      const driversQuery = query(
        collection(db, 'drivers'),
        where('isOnline', '==', true),
        where('status', '==', 'available'),
        where('approvalStatus.status', '==', 'approved')
      );

      const snapshot = await getDocs(driversQuery);
      const nearbyDrivers = [];

      snapshot.forEach((doc) => {
        const driver = { id: doc.id, ...doc.data() };
        
        // Check if driver has valid location
        if (!driver.location || !driver.location.latitude || !driver.location.longitude) {
          return;
        }

        const driverCoords = {
          lat: driver.location.latitude,
          lng: driver.location.longitude
        };

        const distance = this.calculateDistance(pickupCoords, driverCoords);
        
        // Filter by distance
        if (distance <= radiusMiles) {
          // Check ride requirements
          let meetsRequirements = true;
          
          // Check specialty vehicle type requirements
          if (rideRequirements.rideType && ['tow_truck', 'companion_driver', 'medical', 'wheelchair'].includes(rideRequirements.rideType)) {
            const driverSpecialtyTypes = driver.vehicleInfo?.specialtyVehicleTypes || driver.specialtyVehicleTypes || [];
            if (!driverSpecialtyTypes.includes(rideRequirements.rideType)) {
              console.log(`🚫 Driver ${driver.id} cannot fulfill request: vehicle type mismatch (${rideRequirements.rideType} vs ${driverSpecialtyTypes.join(', ') || 'none'})`);
              meetsRequirements = false;
            }
          }
          
          // Legacy requirements check
          if (rideRequirements.requiresWheelchair && !driver.vehicleInfo?.vehicle_info?.features?.includes('wheelchair_accessible')) {
            meetsRequirements = false;
          }
          
          if (rideRequirements.requiresAssistance && !driver.availability?.petFriendly) {
            // Using petFriendly as a proxy for assistance capability
            // You might want to add a specific field for this
          }

          // Enhanced medical requirements check
          if (medicalRequirements && meetsRequirements) {
            meetsRequirements = this.meetsMedicalRequirements(driver, medicalRequirements);
          }

          if (meetsRequirements) {
            nearbyDrivers.push({
              ...driver,
              distance: Math.round(distance * 10) / 10, // Round to 1 decimal
              estimatedArrival: this.calculateETA(distance),
              medicalQualified: medicalRequirements ? this.hasValidMedicalCertifications(driver) : false
            });
          }
        }
      });

      // Sort by distance
      return nearbyDrivers.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error finding nearby drivers:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated time of arrival
   * @param {number} distance - Distance in miles
   * @returns {number} ETA in minutes
   */
  calculateETA(distance) {
    // Assume average speed of 30 mph in city
    const avgSpeedMph = 30;
    const etaHours = distance / avgSpeedMph;
    return Math.ceil(etaHours * 60); // Convert to minutes and round up
  }

  /**
   * Check if driver meets medical requirements
   * @param {Object} driver - Driver object
   * @param {Object} medicalRequirements - Medical requirements object
   * @returns {boolean} Whether driver meets requirements
   */
  meetsMedicalRequirements(driver, medicalRequirements) {
    // Check wheelchair accessibility
    if (medicalRequirements.wheelchairAccessible) {
      const hasWheelchairAccess = driver.vehicleInfo?.vehicle_info?.features?.includes('wheelchair_accessible') ||
                                  driver.vehicleCapabilities?.wheelchairAccessible;
      if (!hasWheelchairAccess) return false;
    }

    // Check stretcher requirement
    if (medicalRequirements.stretcherRequired && !driver.vehicleCapabilities?.stretcherCapable) {
      return false;
    }

    // Check oxygen support
    if (medicalRequirements.oxygenSupport && !driver.vehicleCapabilities?.oxygenSafe) {
      return false;
    }

    // Check priority level - emergency requires special qualification
    if (medicalRequirements.priorityLevel === 'emergency' && !driver.servicePreferences?.acceptsEmergencyRides) {
      return false;
    }

    return true;
  }

  /**
   * Check if driver has valid medical certifications
   * @param {Object} driver - Driver object
   * @returns {boolean} Whether driver has valid certifications
   */
  hasValidMedicalCertifications(driver) {
    const now = new Date();
    const certifications = driver.medicalCertifications;

    if (!certifications) return false;

    // Check medical transport license
    if (!certifications.medicalTransportLicense?.certified) return false;
    if (certifications.medicalTransportLicense.expirationDate && 
        new Date(certifications.medicalTransportLicense.expirationDate) <= now) return false;

    // Check background check
    if (!certifications.backgroundCheck?.completed) return false;
    if (certifications.backgroundCheck.expirationDate && 
        new Date(certifications.backgroundCheck.expirationDate) <= now) return false;

    return true;
  }

  /**
   * Convert address to coordinates using geocoding
   * @param {string} address 
   * @returns {Object} {lat, lng} coordinates
   */
  async geocodeAddress(address) {
    try {
      // Note: You'll need to implement this with your preferred geocoding service
      // For now, return Bakersfield coordinates as fallback
      console.warn('Geocoding not implemented, using Bakersfield default coords');
      return {
        lat: 35.3733,
        lng: -119.0187
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      // Return Bakersfield default
      return {
        lat: 35.3733,
        lng: -119.0187
      };
    }
  }

  /**
   * Send notification to drivers about new ride request
   * @param {Array} drivers - Array of driver objects
   * @param {Object} rideData - Medical ride data
   * @returns {Promise} Notification results
   */
  async notifyDrivers(drivers, rideData) {
    try {
      const notifications = [];
      
      for (const driver of drivers) {
        // Create notification record
        const notificationData = {
          type: 'medical_ride_request',
          driverId: driver.id,
          rideId: rideData.id,
          title: 'New Medical Ride Request',
          message: `${rideData.appointmentType} appointment for Patient ${rideData.patientId}`,
          data: {
            rideId: rideData.id,
            patientId: rideData.patientId,
            appointmentType: rideData.appointmentType,
            appointmentDateTime: rideData.appointmentDateTime,
            pickup: {
              address: rideData.pickupLocation?.address,
              facilityName: rideData.pickupLocation?.facilityName,
              coordinates: rideData.pickupCoordinates
            },
            destination: {
              address: rideData.dropoffLocation?.address,
              facilityName: rideData.dropoffLocation?.facilityName,
              coordinates: rideData.destinationCoordinates
            },
            estimatedFare: this.calculateEstimatedFare(driver.distance, rideData.estimatedDuration),
            distance: driver.distance,
            estimatedArrival: driver.estimatedArrival,
            requiresWheelchair: rideData.requiresWheelchair,
            requiresAssistance: rideData.requiresAssistance,
            specialInstructions: rideData.specialInstructions,
            organizationName: rideData.organizationName
          },
          status: 'sent',
          sentAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes to respond
        };

        // Store notification in Firebase
        const notificationRef = await addDoc(collection(db, 'driverNotifications'), notificationData);
        
        notifications.push({
          notificationId: notificationRef.id,
          driverId: driver.id,
          driverName: driver.displayName,
          distance: driver.distance
        });

        // Here you would integrate with Firebase Cloud Messaging (FCM)
        // For now, we'll just update the driver's document to include pending request
        await updateDoc(doc(db, 'drivers', driver.id), {
          pendingRideRequests: {
            [rideData.id]: {
              notificationId: notificationRef.id,
              sentAt: serverTimestamp(),
              expiresAt: notificationData.expiresAt
            }
          },
          lastNotificationUpdate: serverTimestamp()
        });
      }

      // Update the ride document with notification info
      await updateDoc(doc(db, 'medicalRideSchedule', rideData.id), {
        assignmentStatus: 'notifications_sent',
        notificationsSent: notifications,
        notificationSentAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      return notifications;
    } catch (error) {
      console.error('Error notifying drivers:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated fare for medical ride
   * @param {number} distance - Distance in miles
   * @param {number} duration - Estimated duration in minutes
   * @returns {number} Estimated fare in dollars
   */
  calculateEstimatedFare(distance, duration) {
    const baseFare = 5.00;
    const perMile = 2.50;
    const perMinute = 0.35;
    
    const fare = baseFare + (distance * perMile) + (duration * perMinute);
    return Math.round(fare * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Assign specific driver to ride
   * @param {string} rideId 
   * @param {string} driverId 
   * @returns {Promise}
   */
  async assignDriver(rideId, driverId) {
    try {
      // Get driver info
      const driverRef = doc(db, 'drivers', driverId);
      const driverDoc = await getDocs(query(collection(db, 'drivers'), where('__name__', '==', driverId)));
      
      if (driverDoc.empty) {
        throw new Error('Driver not found');
      }

      const driverData = driverDoc.docs[0].data();

      // Update ride with assignment
      await updateDoc(doc(db, 'medicalRideSchedule', rideId), {
        assignmentStatus: 'assigned',
        assignedDriverId: driverId,
        driverInfo: {
          id: driverId,
          name: driverData.displayName,
          phone: driverData.personalInfo?.personal_info?.phoneNumber,
          vehicle: `${driverData.vehicleInfo?.vehicle_info?.year} ${driverData.vehicleInfo?.vehicle_info?.make} ${driverData.vehicleInfo?.vehicle_info?.model}`,
          licensePlate: driverData.vehicleInfo?.vehicle_info?.licensePlate,
          color: driverData.vehicleInfo?.vehicle_info?.color
        },
        assignedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // Update driver status
      await updateDoc(driverRef, {
        status: 'assigned',
        currentRideId: rideId,
        assignedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw error;
    }
  }

  /**
   * Handle driver response to ride request
   * @param {string} notificationId 
   * @param {string} driverId 
   * @param {string} response - 'accept' or 'decline'
   * @param {Object} driverLocation - Current driver location
   * @returns {Promise}
   */
  async handleDriverResponse(notificationId, driverId, response, driverLocation = null) {
    try {
      // Update notification
      await updateDoc(doc(db, 'driverNotifications', notificationId), {
        status: response === 'accept' ? 'accepted' : 'declined',
        respondedAt: serverTimestamp(),
        driverLocation: driverLocation
      });

      // Get ride ID from notification
      const notificationDoc = await getDocs(query(
        collection(db, 'driverNotifications'), 
        where('__name__', '==', notificationId)
      ));
      
      if (notificationDoc.empty) {
        throw new Error('Notification not found');
      }

      const notification = notificationDoc.docs[0].data();
      const rideId = notification.rideId;

      if (response === 'accept') {
        // Assign driver to ride
        await this.assignDriver(rideId, driverId);
        
        // Cancel other pending notifications for this ride
        await this.cancelOtherNotifications(rideId, driverId);
      }

      return { success: true, rideId };
    } catch (error) {
      console.error('Error handling driver response:', error);
      throw error;
    }
  }

  /**
   * Cancel other pending notifications when ride is accepted
   * @param {string} rideId 
   * @param {string} acceptingDriverId 
   */
  async cancelOtherNotifications(rideId, acceptingDriverId) {
    try {
      const pendingNotifications = query(
        collection(db, 'driverNotifications'),
        where('rideId', '==', rideId),
        where('status', '==', 'sent')
      );

      const snapshot = await getDocs(pendingNotifications);
      
      snapshot.forEach(async (doc) => {
        const notification = doc.data();
        if (notification.driverId !== acceptingDriverId) {
          await updateDoc(doc.ref, {
            status: 'cancelled',
            cancelledAt: serverTimestamp(),
            cancelReason: 'ride_accepted_by_other_driver'
          });
        }
      });
    } catch (error) {
      console.error('Error cancelling other notifications:', error);
    }
  }

  /**
   * Get real-time updates for ride assignment
   * @param {string} rideId 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  subscribeToRideUpdates(rideId, callback) {
    const unsubscribe = onSnapshot(
      doc(db, 'medicalRideSchedule', rideId),
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() });
        }
      },
      (error) => {
        console.error('Error in ride updates subscription:', error);
        callback(null, error);
      }
    );

    this.activeListeners.set(rideId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Clean up listeners
   * @param {string} rideId 
   */
  unsubscribeFromRideUpdates(rideId) {
    const unsubscribe = this.activeListeners.get(rideId);
    if (unsubscribe) {
      unsubscribe();
      this.activeListeners.delete(rideId);
    }
  }

  /**
   * Subscribe to ride requests filtered by driver capabilities
   * @param {string} driverId 
   * @param {Array} driverSpecialtyTypes 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  subscribeToDriverRideRequests(driverId, driverSpecialtyTypes = [], callback) {
    const q = query(
      collection(db, 'rideRequests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(request => {
          // Filter out specialty requests that this driver can't fulfill
          if (['tow_truck', 'companion_driver', 'medical', 'wheelchair'].includes(request.rideType)) {
            const canFulfill = driverSpecialtyTypes.includes(request.rideType);
            if (!canFulfill) {
              console.log(`🚫 Driver ${driverId} cannot fulfill request: vehicle type mismatch (${request.rideType} vs ${driverSpecialtyTypes.join(', ') || 'none'})`);
            }
            return canFulfill;
          }
          // Allow standard requests for all drivers
          return true;
        });
      
      callback(requests);
    }, (error) => {
      console.error('Error in driver ride requests subscription:', error);
      callback([], error);
    });

    this.activeListeners.set(`driver-requests-${driverId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Get driver tracking info for assigned ride
   * @param {string} driverId 
   * @returns {Object} Driver location and status
   */
  async getDriverTrackingInfo(driverId) {
    try {
      const driverDoc = await getDocs(query(collection(db, 'drivers'), where('__name__', '==', driverId)));
      
      if (driverDoc.empty) {
        return null;
      }

      const driver = driverDoc.docs[0].data();
      return {
        location: driver.location,
        status: driver.status,
        lastLocationUpdate: driver.lastLocationUpdate,
        estimatedArrival: driver.estimatedArrival
      };
    } catch (error) {
      console.error('Error getting driver tracking info:', error);
      return null;
    }
  }

  /**
   * Update ride status (for driver app integration)
   * @param {string} rideId 
   * @param {string} status 
   * @param {Object} additionalData 
   */
  async updateRideStatus(rideId, status, additionalData = {}) {
    try {
      const updateData = {
        status: status,
        lastUpdated: serverTimestamp(),
        ...additionalData
      };

      // Add status-specific data
      switch (status) {
        case 'en_route':
          updateData.enRouteAt = serverTimestamp();
          break;
        case 'arrived':
          updateData.arrivedAt = serverTimestamp();
          break;
        case 'picked_up':
          updateData.pickedUpAt = serverTimestamp();
          break;
        case 'completed':
          updateData.completedAt = serverTimestamp();
          break;
        default:
          // No additional timestamp needed for other statuses
          break;
      }

      await updateDoc(doc(db, 'medicalRideSchedule', rideId), updateData);
      return true;
    } catch (error) {
      console.error('Error updating ride status:', error);
      throw error;
    }
  }
}

const driverAssignmentServiceInstance = new DriverAssignmentService();
export default driverAssignmentServiceInstance;
