import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { notificationService } from './notificationService';

/**
 * Scheduled Rides Service
 * Handles future ride bookings and driver scheduling
 */
class ScheduledRidesService {
  constructor() {
    this.collection = 'scheduledRides';
    this.driverScheduleCollection = 'driverSchedules';
  }

  /**
   * Create a scheduled ride request
   * @param {Object} rideData - Ride request data
   * @returns {Promise<Object>} Result of creation
   */
  async createScheduledRide(rideData) {
    try {
      const {
        riderId,
        pickup,
        destination,
        scheduledDateTime,
        rideType = 'standard',
        specialRequests = [],
        paymentMethod = 'card',
        specialtyData = null,
        recurringPattern = null,
        notes = ''
      } = rideData;

      // Validate scheduled time is in the future
      const scheduledTime = new Date(scheduledDateTime);
      if (scheduledTime <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      // Calculate estimated fare
      const estimatedFare = this.calculateEstimatedFare(pickup, destination, rideType);

      const scheduledRide = {
        riderId,
        pickup: {
          address: pickup.address,
          coordinates: pickup.coordinates,
          placeId: pickup.placeId
        },
        destination: {
          address: destination.address,
          coordinates: destination.coordinates,
          placeId: destination.placeId
        },
        scheduledDateTime: scheduledTime.toISOString(),
        rideType,
        specialRequests,
        estimatedFare,
        paymentMethod,
        specialtyData,
        recurringPattern,
        notes,
        status: 'scheduled', // scheduled -> confirmed -> active -> completed/cancelled
        assignedDriverId: null,
        driverBids: [],
        confirmationDeadline: new Date(scheduledTime.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours before
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collection), scheduledRide);

      // Find available drivers for the scheduled time
      await this.findAvailableDriversForSchedule(docRef.id, scheduledRide);

      // Send notification to rider
      await notificationService.sendNotification(riderId, {
        type: 'scheduled_ride_created',
        title: 'Ride Scheduled Successfully',
        message: `Your ${rideType} ride is scheduled for ${scheduledTime.toLocaleString()}`,
        data: { rideId: docRef.id }
      });

      return {
        success: true,
        data: {
          id: docRef.id,
          ...scheduledRide
        }
      };
    } catch (error) {
      console.error('Error creating scheduled ride:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find available drivers for a scheduled ride
   * @param {string} rideId - Scheduled ride ID
   * @param {Object} rideData - Ride data
   */
  async findAvailableDriversForSchedule(rideId, rideData) {
    try {
      const scheduledTime = new Date(rideData.scheduledDateTime);
      
      // Query drivers who are available during the scheduled time
      const driversQuery = query(
        collection(db, 'driverApplications'),
        where('status', '==', 'approved'),
        where('availability', '!=', null)
      );

      const driversSnapshot = await getDocs(driversQuery);
      const availableDrivers = [];

      driversSnapshot.forEach((doc) => {
        const driver = { id: doc.id, ...doc.data() };
        
        // Check if driver is available during scheduled time
        if (this.isDriverAvailableForTime(driver, scheduledTime, rideData)) {
          availableDrivers.push(driver);
        }
      });

      // Send notifications to available drivers
      for (const driver of availableDrivers) {
        await this.notifyDriverOfScheduledRide(driver.id, rideId, rideData);
      }

      return {
        success: true,
        availableDrivers: availableDrivers.length
      };
    } catch (error) {
      console.error('Error finding available drivers:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if driver is available for a specific time
   * @param {Object} driver - Driver data
   * @param {Date} scheduledTime - Scheduled time
   * @param {Object} rideData - Ride data
   * @returns {boolean} Whether driver is available
   */
  isDriverAvailableForTime(driver, scheduledTime, rideData) {
    const dayOfWeek = scheduledTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hour = scheduledTime.getHours();
    
    // Check weekly schedule
    if (driver.availability?.weeklySchedule?.[dayOfWeek]?.enabled) {
      const schedule = driver.availability.weeklySchedule[dayOfWeek];
      const startHour = parseInt(schedule.startTime.split(':')[0]);
      const endHour = parseInt(schedule.endTime.split(':')[0]);
      
      if (hour < startHour || hour >= endHour) {
        return false;
      }
    } else {
      return false;
    }

    // Check if driver can handle the ride type
    if (this.requiresSpecialDriver(rideData.rideType)) {
      const driverCapabilities = driver.vehicleInfo?.serviceCapabilities || [];
      return driverCapabilities.includes(rideData.rideType);
    }

    // Check service radius
    if (driver.availability?.serviceRadius) {
      const distance = this.calculateDistance(
        driver.currentLocation || { lat: 0, lng: 0 },
        rideData.pickup.coordinates
      );
      return distance <= driver.availability.serviceRadius;
    }

    return true;
  }

  /**
   * Notify driver of a scheduled ride opportunity
   * @param {string} driverId - Driver ID
   * @param {string} rideId - Scheduled ride ID
   * @param {Object} rideData - Ride data
   */
  async notifyDriverOfScheduledRide(driverId, rideId, rideData) {
    try {
      await notificationService.sendNotification(driverId, {
        type: 'scheduled_ride_opportunity',
        title: 'Scheduled Ride Available',
        message: `${rideData.rideType} ride scheduled for ${new Date(rideData.scheduledDateTime).toLocaleString()}`,
        data: { 
          rideId, 
          scheduledDateTime: rideData.scheduledDateTime,
          estimatedFare: rideData.estimatedFare,
          pickup: rideData.pickup.address
        }
      });
    } catch (error) {
      console.error('Error notifying driver:', error);
    }
  }

  /**
   * Get scheduled rides for a rider
   * @param {string} riderId - Rider ID
   * @returns {Promise<Object>} Scheduled rides
   */
  async getScheduledRidesForRider(riderId) {
    try {
      const ridesQuery = query(
        collection(db, this.collection),
        where('riderId', '==', riderId),
        orderBy('scheduledDateTime', 'asc')
      );

      const snapshot = await getDocs(ridesQuery);
      const rides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: rides
      };
    } catch (error) {
      console.error('Error getting scheduled rides:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get scheduled rides for a driver
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object>} Scheduled rides
   */
  async getScheduledRidesForDriver(driverId) {
    try {
      const ridesQuery = query(
        collection(db, this.collection),
        where('assignedDriverId', '==', driverId),
        orderBy('scheduledDateTime', 'asc')
      );

      const snapshot = await getDocs(ridesQuery);
      const rides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: rides
      };
    } catch (error) {
      console.error('Error getting driver scheduled rides:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Driver bids on a scheduled ride
   * @param {string} rideId - Scheduled ride ID
   * @param {string} driverId - Driver ID
   * @param {Object} bidData - Bid data
   * @returns {Promise<Object>} Result of bid
   */
  async driverBidOnScheduledRide(rideId, driverId, bidData) {
    try {
      const rideRef = doc(db, this.collection, rideId);
      const rideDoc = await getDoc(rideRef);
      
      if (!rideDoc.exists()) {
        throw new Error('Scheduled ride not found');
      }

      const rideData = rideDoc.data();
      
      // Check if bidding is still open
      if (new Date() > new Date(rideData.confirmationDeadline)) {
        throw new Error('Bidding period has expired');
      }

      const newBid = {
        driverId,
        bidAmount: bidData.bidAmount,
        message: bidData.message || '',
        bidTime: new Date().toISOString(),
        driverInfo: bidData.driverInfo
      };

      const updatedBids = [...(rideData.driverBids || []), newBid];

      await updateDoc(rideRef, {
        driverBids: updatedBids,
        updatedAt: serverTimestamp()
      });

      // Notify rider of new bid
      await notificationService.sendNotification(rideData.riderId, {
        type: 'scheduled_ride_bid',
        title: 'New Driver Bid',
        message: `Driver bid $${bidData.bidAmount} for your scheduled ride`,
        data: { rideId, driverId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error submitting driver bid:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirm a scheduled ride with a driver
   * @param {string} rideId - Scheduled ride ID
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object>} Result of confirmation
   */
  async confirmScheduledRide(rideId, driverId) {
    try {
      const rideRef = doc(db, this.collection, rideId);
      
      await updateDoc(rideRef, {
        assignedDriverId: driverId,
        status: 'confirmed',
        confirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Notify driver of confirmation
      await notificationService.sendNotification(driverId, {
        type: 'scheduled_ride_confirmed',
        title: 'Ride Confirmed',
        message: 'Your scheduled ride has been confirmed',
        data: { rideId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error confirming scheduled ride:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel a scheduled ride
   * @param {string} rideId - Scheduled ride ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Result of cancellation
   */
  async cancelScheduledRide(rideId, reason) {
    try {
      const rideRef = doc(db, this.collection, rideId);
      const rideDoc = await getDoc(rideRef);
      
      if (!rideDoc.exists()) {
        throw new Error('Scheduled ride not found');
      }

      const rideData = rideDoc.data();

      await updateDoc(rideRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancellationReason: reason,
        updatedAt: serverTimestamp()
      });

      // Notify driver if assigned
      if (rideData.assignedDriverId) {
        await notificationService.sendNotification(rideData.assignedDriverId, {
          type: 'scheduled_ride_cancelled',
          title: 'Scheduled Ride Cancelled',
          message: `Your scheduled ride has been cancelled: ${reason}`,
          data: { rideId }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling scheduled ride:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert scheduled ride to active ride when time arrives
   * @param {string} rideId - Scheduled ride ID
   * @returns {Promise<Object>} Result of activation
   */
  async activateScheduledRide(rideId) {
    try {
      const rideRef = doc(db, this.collection, rideId);
      const rideDoc = await getDoc(rideRef);
      
      if (!rideDoc.exists()) {
        throw new Error('Scheduled ride not found');
      }

      const rideData = rideDoc.data();

      if (rideData.status !== 'confirmed') {
        throw new Error('Ride must be confirmed before activation');
      }

      // Create active ride request
      const { createRideRequest } = await import('./rideRequestService');
      const activeRideData = {
        customerId: rideData.riderId,
        pickup: rideData.pickup,
        destination: rideData.destination,
        rideType: rideData.rideType,
        specialRequests: rideData.specialRequests,
        paymentMethod: rideData.paymentMethod,
        specialtyData: rideData.specialtyData,
        scheduledRideId: rideId
      };

      const activeRideResult = await createRideRequest(activeRideData);

      if (activeRideResult.success) {
        // Update scheduled ride status
        await updateDoc(rideRef, {
          status: 'active',
          activeRideId: activeRideResult.data.id,
          activatedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        return {
          success: true,
          activeRideId: activeRideResult.data.id
        };
      } else {
        throw new Error('Failed to create active ride');
      }
    } catch (error) {
      console.error('Error activating scheduled ride:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get driver's schedule for a date range
   * @param {string} driverId - Driver ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Driver schedule
   */
  async getDriverSchedule(driverId, startDate, endDate) {
    try {
      const ridesQuery = query(
        collection(db, this.collection),
        where('assignedDriverId', '==', driverId),
        where('scheduledDateTime', '>=', startDate.toISOString()),
        where('scheduledDateTime', '<=', endDate.toISOString()),
        orderBy('scheduledDateTime', 'asc')
      );

      const snapshot = await getDocs(ridesQuery);
      const schedule = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: schedule
      };
    } catch (error) {
      console.error('Error getting driver schedule:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Subscribe to driver schedule updates
   * @param {string} driverId - Driver ID
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToDriverSchedule(driverId, callback) {
    const ridesQuery = query(
      collection(db, this.collection),
      where('assignedDriverId', '==', driverId),
      orderBy('scheduledDateTime', 'asc')
    );

    return onSnapshot(ridesQuery, (snapshot) => {
      const schedule = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(schedule);
    });
  }

  /**
   * Check if ride type requires special drivers
   * @param {string} rideType - Ride type
   * @returns {boolean} Whether special drivers are required
   */
  requiresSpecialDriver(rideType) {
    const specialTypes = ['tow_truck', 'companion_driver', 'medical', 'wheelchair'];
    return specialTypes.includes(rideType);
  }

  /**
   * Calculate estimated fare
   * @param {Object} pickup - Pickup location
   * @param {Object} destination - Destination location
   * @param {string} rideType - Ride type
   * @returns {number} Estimated fare
   */
  calculateEstimatedFare(pickup, destination, rideType) {
    const baseRates = {
      standard: { base: 5.00, perMile: 1.25 },
      premium: { base: 8.00, perMile: 1.75 },
      medical: { base: 12.00, perMile: 2.00 },
      tow_truck: { base: 25.00, perMile: 3.50 },
      companion_driver: { base: 15.00, perMile: 2.50 }
    };

    const rates = baseRates[rideType] || baseRates.standard;
    const distance = this.calculateDistance(pickup.coordinates, destination.coordinates);
    
    return rates.base + (distance * rates.perMile);
  }

  /**
   * Calculate distance between two points
   * @param {Object} point1 - First point
   * @param {Object} point2 - Second point
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
const scheduledRidesService = new ScheduledRidesService();
export default scheduledRidesService;
