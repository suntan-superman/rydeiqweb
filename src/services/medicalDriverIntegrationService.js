import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

/**
 * Medical Driver Integration Service
 * Connects medical scheduling with driver availability and criteria matching
 * Integrates with existing systems: AdvancedScheduling, DriverScheduleView, medicalAppointmentService
 */
class MedicalDriverIntegrationService {
  constructor() {
    this.medicalScheduleCollection = 'medicalRideSchedule'; // Existing collection
    this.driverApplicationsCollection = 'driverApplications'; // Existing collection
    this.scheduledRidesCollection = 'scheduledRides'; // Existing collection
  }

  /**
   * Create a medical ride with driver availability checking
   * Integrates with AdvancedScheduling.js component
   * @param {Object} medicalRideData - Medical ride data from AdvancedScheduling form
   * @returns {Promise<Object>} Result with available drivers
   */
  async createMedicalRideWithDriverMatching(medicalRideData) {
    try {
      const {
        patientId,
        appointmentType,
        pickupLocation,
        dropoffLocation,
        appointmentDateTime,
        medicalRequirements = {},
        bufferTime = 15,
        organizationId,
        dispatcherId
      } = medicalRideData;

      // Validate required fields
      if (!patientId || !appointmentType || !pickupLocation || !dropoffLocation || !appointmentDateTime) {
        throw new Error('Missing required fields for medical ride');
      }

      // Calculate ride duration with buffer time (integrates with existing logic)
      const scheduledTime = new Date(appointmentDateTime);
      const estimatedDuration = this.calculateMedicalRideDuration(appointmentType, bufferTime);
      const pickupTime = new Date(scheduledTime.getTime() - bufferTime * 60000); // Pickup before appointment

      // Find available drivers for the medical ride
      const availableDrivers = await this.findAvailableMedicalDrivers({
        pickupLocation,
        scheduledTime: pickupTime,
        appointmentType,
        medicalRequirements,
        estimatedDuration
      });

      // Create the medical ride record (integrates with existing medicalRideSchedule collection)
      const medicalRide = {
        patientId,
        appointmentType,
        pickupLocation: {
          address: pickupLocation.address,
          coordinates: pickupLocation.coordinates,
          facilityName: pickupLocation.facilityName || null
        },
        dropoffLocation: {
          address: dropoffLocation.address,
          coordinates: dropoffLocation.coordinates,
          facilityName: dropoffLocation.facilityName || null
        },
        appointmentDateTime: scheduledTime.toISOString(),
        pickupDateTime: pickupTime.toISOString(),
        estimatedDuration,
        bufferTime,
        medicalRequirements,
        organizationId,
        dispatcherId,
        status: 'scheduled',
        availableDrivers: availableDrivers.map(driver => ({
          driverId: driver.id,
          driverInfo: {
            name: `${driver.personalInfo?.firstName || ''} ${driver.personalInfo?.lastName || ''}`.trim(),
            phone: driver.personalInfo?.phoneNumber || '',
            vehicle: driver.vehicleInfo?.make && driver.vehicleInfo?.model 
              ? `${driver.vehicleInfo.make} ${driver.vehicleInfo.model}` 
              : 'Vehicle info not available',
            capabilities: driver.vehicleInfo?.serviceCapabilities || [],
            rating: driver.rating || 4.0
          },
          availability: driver.availability,
          distance: driver.distance,
          estimatedArrival: driver.estimatedArrival,
          matchScore: driver.matchScore
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to existing medical ride schedule collection
      const rideRef = await addDoc(collection(db, this.medicalScheduleCollection), medicalRide);

      // If drivers are available, notify them
      if (availableDrivers.length > 0) {
        await this.notifyAvailableDrivers(rideRef.id, availableDrivers, medicalRide);
      }

      return {
        success: true,
        data: {
          rideId: rideRef.id,
          ...medicalRide,
          availableDriverCount: availableDrivers.length
        }
      };
    } catch (error) {
      console.error('Error creating medical ride with driver matching:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find available medical drivers based on criteria and schedule
   * Integrates with existing driverApplications collection
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Available drivers
   */
  async findAvailableMedicalDrivers(criteria) {
    try {
      const {
        pickupLocation,
        scheduledTime,
        estimatedDuration
      } = criteria;

      // Query all approved drivers from existing driverApplications collection
      const driversQuery = query(
        collection(db, this.driverApplicationsCollection),
        where('status', '==', 'approved')
      );

      const driversSnapshot = await getDocs(driversQuery);
      const availableDrivers = [];

      driversSnapshot.forEach((doc) => {
        const driver = { id: doc.id, ...doc.data() };
        
        // Debug: Log driver capabilities
        console.log('Checking driver:', driver.firstName, driver.lastName, {
          serviceCapabilities: driver.vehicleInfo?.serviceCapabilities,
          medicalTransport: driver.vehicleInfo?.serviceCapabilities?.includes('medical_transport')
        });
        
        // Check if driver meets medical ride requirements
        if (this.isDriverEligibleForMedicalRide(driver, criteria)) {
          // Check if driver is available at the scheduled time
          if (this.isDriverAvailableAtTime(driver, scheduledTime, estimatedDuration)) {
            // Calculate distance and match score
            let distance = 0;
            let estimatedArrival = 30; // Default 30 minutes if no location data
            
        // Debug: Log the pickup location structure
        console.log('Pickup location structure:', pickupLocation);
        console.log('Coordinates object:', pickupLocation?.coordinates);
        console.log('Lat:', pickupLocation?.coordinates?.lat, 'Lng:', pickupLocation?.coordinates?.lng);
        console.log('Driver current location:', driver.currentLocation);
        
        // Convert coordinates to plain numbers if they're Google Maps objects
        let pickupCoords = pickupLocation?.coordinates;
        if (pickupCoords && typeof pickupCoords.lat === 'function') {
          pickupCoords = {
            lat: pickupCoords.lat(),
            lng: pickupCoords.lng()
          };
        }
        
        // Additional check for different coordinate formats
        if (!pickupCoords && pickupLocation?.coordinates) {
          const coords = pickupLocation.coordinates;
          if (coords.latitude && coords.longitude) {
            pickupCoords = { lat: coords.latitude, lng: coords.longitude };
          } else if (coords.lat !== undefined && coords.lng !== undefined) {
            pickupCoords = { lat: coords.lat, lng: coords.lng };
          }
        }
        
        console.log('Processed pickup coordinates:', pickupCoords);
        
        // Only calculate distance if we have valid coordinates
        if (pickupCoords?.lat && pickupCoords?.lng) {
          distance = this.calculateDistance(
            driver.currentLocation || { lat: 0, lng: 0 },
            pickupCoords
          );
          estimatedArrival = this.calculateEstimatedArrival(distance);
        } else {
          console.warn('No valid pickup coordinates available, using default distance calculation');
          console.warn('Pickup location coordinates:', pickupLocation?.coordinates);
          // Use a default distance based on service radius
          distance = driver.availability?.serviceRadius || 15;
        }

            const matchScore = this.calculateMedicalDriverMatchScore(driver, criteria);

            availableDrivers.push({
              ...driver,
              distance,
              estimatedArrival,
              matchScore
            });
          }
        }
      });

      // Sort by match score (highest first) then by distance
      availableDrivers.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return a.distance - b.distance;
      });

      return availableDrivers;
    } catch (error) {
      console.error('Error finding available medical drivers:', error);
      return [];
    }
  }

  /**
   * Check if driver is eligible for medical ride based on capabilities
   * Integrates with existing driver capabilities system
   * @param {Object} driver - Driver data from driverApplications
   * @param {Object} criteria - Ride criteria
   * @returns {boolean} Whether driver is eligible
   */
  isDriverEligibleForMedicalRide(driver, criteria) {
    const { medicalRequirements, appointmentType } = criteria;

    // Check basic medical transport capability
    const serviceCapabilities = driver.vehicleInfo?.serviceCapabilities || [];
    
    // Medical transport is required for all medical rides
    if (!serviceCapabilities.includes('medical_transport')) {
      return false;
    }

    // Check specific medical requirements
    if (medicalRequirements.wheelchairAccessible) {
      if (!serviceCapabilities.includes('wheelchair_accessible')) {
        return false;
      }
    }

    if (medicalRequirements.stretcherRequired) {
      if (!serviceCapabilities.includes('stretcher_equipped')) {
        return false;
      }
    }

    if (medicalRequirements.oxygenSupport) {
      if (!serviceCapabilities.includes('oxygen_equipped')) {
        return false;
      }
    }

    // Check appointment type specific requirements
    if (appointmentType === 'Dialysis' && medicalRequirements.requiresAssistance) {
      if (!serviceCapabilities.includes('assistance_available')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if driver is available at specific time
   * Integrates with existing driver availability system from AvailabilityForm.js
   * @param {Object} driver - Driver data
   * @param {Date} scheduledTime - Scheduled time
   * @param {number} duration - Ride duration in minutes
   * @returns {boolean} Whether driver is available
   */
  isDriverAvailableAtTime(driver, scheduledTime, duration) {
    const dayOfWeek = scheduledTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hour = scheduledTime.getHours();
    const endTime = new Date(scheduledTime.getTime() + duration * 60000);
    const endHour = endTime.getHours();

    // Check weekly schedule (integrates with AvailabilityForm.js weekly schedule)
    const weeklySchedule = driver.availability?.weeklySchedule;
    if (!weeklySchedule || !weeklySchedule[dayOfWeek]?.enabled) {
      return false;
    }

    const schedule = weeklySchedule[dayOfWeek];
    const startHour = parseInt(schedule.startTime.split(':')[0]);
    const scheduleEndHour = parseInt(schedule.endTime.split(':')[0]);

    // Check if ride fits within driver's available hours
    if (hour < startHour || endHour > scheduleEndHour) {
      return false;
    }

    // Check for existing scheduled rides that conflict
    return this.checkForSchedulingConflicts(driver.id, scheduledTime, duration);
  }

  /**
   * Check for scheduling conflicts with existing rides
   * Integrates with both medicalRideSchedule and scheduledRides collections
   * @param {string} driverId - Driver ID
   * @param {Date} scheduledTime - Scheduled time
   * @param {number} duration - Ride duration
   * @returns {Promise<boolean>} Whether there are conflicts
   */
  async checkForSchedulingConflicts(driverId, scheduledTime, duration) {
    try {
      const rideEndTime = new Date(scheduledTime.getTime() + duration * 60000);

      // Check medical ride schedule (existing collection)
      const medicalRidesQuery = query(
        collection(db, this.medicalScheduleCollection),
        where('assignedDriverId', '==', driverId),
        where('status', 'in', ['scheduled', 'assigned', 'in_progress'])
      );

      // Check scheduled rides (existing collection)
      const scheduledRidesQuery = query(
        collection(db, this.scheduledRidesCollection),
        where('assignedDriverId', '==', driverId),
        where('status', 'in', ['scheduled', 'confirmed', 'active'])
      );

      let medicalSnapshot, scheduledSnapshot;
      
      try {
        [medicalSnapshot, scheduledSnapshot] = await Promise.all([
          getDocs(medicalRidesQuery),
          getDocs(scheduledRidesQuery)
        ]);
      } catch (permissionError) {
        console.warn('Permission denied for scheduling conflict check, assuming no conflicts:', permissionError.message);
        // Return true (no conflicts) if we can't check due to permissions
        return true;
      }

      // Check for conflicts in medical rides
      for (const doc of medicalSnapshot.docs) {
        const ride = doc.data();
        const existingStart = new Date(ride.pickupDateTime || ride.appointmentDateTime);
        const existingEnd = new Date(existingStart.getTime() + (ride.estimatedDuration || 60) * 60000);

        if (this.timesOverlap(scheduledTime, rideEndTime, existingStart, existingEnd)) {
          return false; // Conflict found
        }
      }

      // Check for conflicts in scheduled rides
      for (const doc of scheduledSnapshot.docs) {
        const ride = doc.data();
        const existingStart = new Date(ride.scheduledDateTime);
        const existingEnd = new Date(existingStart.getTime() + 60 * 60000); // Assume 1 hour duration

        if (this.timesOverlap(scheduledTime, rideEndTime, existingStart, existingEnd)) {
          return false; // Conflict found
        }
      }

      return true; // No conflicts
    } catch (error) {
      console.error('Error checking scheduling conflicts:', error);
      return false; // Assume conflict if error
    }
  }

  /**
   * Check if two time ranges overlap
   * @param {Date} start1 - First range start
   * @param {Date} end1 - First range end
   * @param {Date} start2 - Second range start
   * @param {Date} end2 - Second range end
   * @returns {boolean} Whether ranges overlap
   */
  timesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Calculate medical ride duration based on appointment type
   * Integrates with existing appointment types from AdvancedScheduling.js
   * @param {string} appointmentType - Type of appointment
   * @param {number} bufferTime - Buffer time in minutes
   * @returns {number} Duration in minutes
   */
  calculateMedicalRideDuration(appointmentType, bufferTime) {
    const baseDurations = {
      'Dialysis': 240, // 4 hours
      'Chemotherapy': 180, // 3 hours
      'Surgery': 120, // 2 hours
      'Physical Therapy': 90, // 1.5 hours
      'Doctor Visit': 60, // 1 hour
      'Lab Work': 45, // 45 minutes
      'X-Ray': 30, // 30 minutes
      'default': 60 // 1 hour default
    };

    return (baseDurations[appointmentType] || baseDurations.default) + bufferTime;
  }

  /**
   * Calculate medical driver match score
   * @param {Object} driver - Driver data
   * @param {Object} criteria - Ride criteria
   * @returns {number} Match score (0-100)
   */
  calculateMedicalDriverMatchScore(driver, criteria) {
    let score = 50; // Base score

    const serviceCapabilities = driver.vehicleInfo?.serviceCapabilities || [];

    // Capability matching
    if (serviceCapabilities.includes('medical_transport')) score += 20;
    if (serviceCapabilities.includes('wheelchair_accessible')) score += 15;
    if (serviceCapabilities.includes('oxygen_equipped')) score += 10;
    if (serviceCapabilities.includes('stretcher_equipped')) score += 10;
    if (serviceCapabilities.includes('assistance_available')) score += 10;

    // Experience bonus
    const completedRides = driver.completedRides || 0;
    if (completedRides > 100) score += 10;
    else if (completedRides > 50) score += 5;

    // Rating bonus
    const rating = driver.rating || 4.0;
    score += (rating - 4.0) * 10; // 0-10 points based on rating above 4.0

    // Medical certification bonus
    if (driver.medicalCertifications?.cpr) score += 5;
    if (driver.medicalCertifications?.firstAid) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Notify available drivers about medical ride opportunity
   * @param {string} rideId - Medical ride ID
   * @param {Array} drivers - Available drivers
   * @param {Object} rideData - Ride data
   */
  async notifyAvailableDrivers(rideId, drivers, rideData) {
    for (const driver of drivers.slice(0, 5)) { // Notify top 5 drivers
      try {
        // Create notification document in Firestore
        await addDoc(collection(db, 'notifications'), {
          userId: driver.id,
          type: 'medical_ride_request',
          title: 'Medical Transport Request',
          message: `${rideData.appointmentType} transport for ${rideData.patientId} - ${new Date(rideData.pickupDateTime).toLocaleString()}`,
          data: {
            rideId,
            patientId: rideData.patientId,
            appointmentType: rideData.appointmentType,
            pickupDateTime: rideData.pickupDateTime,
            estimatedDuration: rideData.estimatedDuration,
            medicalRequirements: rideData.medicalRequirements
          },
          status: 'pending',
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error(`Error notifying driver ${driver.id}:`, error);
      }
    }
  }

  /**
   * Assign driver to medical ride
   * Integrates with existing medicalAppointmentService.js
   * @param {string} rideId - Medical ride ID
   * @param {string} driverId - Driver ID
   * @param {string} dispatcherId - Dispatcher ID
   * @returns {Promise<Object>} Result of assignment
   */
  async assignDriverToMedicalRide(rideId, driverId, dispatcherId) {
    try {
      const rideRef = doc(db, this.medicalScheduleCollection, rideId);
      
      await updateDoc(rideRef, {
        assignedDriverId: driverId,
        dispatcherId,
        assignedAt: serverTimestamp(),
        status: 'assigned',
        updatedAt: serverTimestamp()
      });

      // Create notification for driver
      await addDoc(collection(db, 'notifications'), {
        userId: driverId,
        type: 'medical_ride_assigned',
        title: 'Medical Transport Assigned',
        message: 'You have been assigned a medical transport. Check your schedule for details.',
        data: { rideId },
        read: false,
        createdAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error assigning driver to medical ride:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get driver's medical ride schedule
   * Integrates with existing DriverScheduleView.js
   * @param {string} driverId - Driver ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Driver's medical schedule
   */
  async getDriverMedicalSchedule(driverId, startDate, endDate) {
    try {
      const ridesQuery = query(
        collection(db, this.medicalScheduleCollection),
        where('assignedDriverId', '==', driverId),
        where('pickupDateTime', '>=', startDate.toISOString()),
        where('pickupDateTime', '<=', endDate.toISOString()),
        orderBy('pickupDateTime', 'asc')
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
      console.error('Error getting driver medical schedule:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Update medical ride status
   * @param {string} rideId - Medical ride ID
   * @param {string} status - New status
   * @param {Object} updateData - Additional update data
   * @returns {Promise<Object>} Result of update
   */
  async updateMedicalRideStatus(rideId, status, updateData = {}) {
    try {
      const rideRef = doc(db, this.medicalScheduleCollection, rideId);
      
      const updateFields = {
        status,
        updatedAt: serverTimestamp(),
        ...updateData
      };

      // Add status-specific timestamps
      switch (status) {
        case 'in_progress':
          updateFields.startedAt = serverTimestamp();
          break;
        case 'completed':
          updateFields.completedAt = serverTimestamp();
          break;
        case 'cancelled':
          updateFields.cancelledAt = serverTimestamp();
          break;
        default:
          // No additional timestamp needed for other statuses
          break;
      }

      await updateDoc(rideRef, updateFields);

      return { success: true };
    } catch (error) {
      console.error('Error updating medical ride status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Subscribe to medical ride notifications for driver
   * @param {string} driverId - Driver ID
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToMedicalRideNotifications(driverId, callback) {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', driverId),
      where('type', 'in', ['medical_ride_opportunity', 'medical_ride_assigned']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    }, (error) => {
      console.error('Error in medical ride notifications subscription:', error);
      callback([], error);
    });
  }

  /**
   * Calculate distance between two points
   * @param {Object} point1 - First point
   * @param {Object} point2 - Second point
   * @returns {number} Distance in miles
   */
  calculateDistance(point1, point2) {
    // Check for null or invalid coordinates
    if (!point1 || !point2 || 
        typeof point1.lat !== 'number' || typeof point1.lng !== 'number' ||
        typeof point2.lat !== 'number' || typeof point2.lng !== 'number') {
      console.warn('Invalid coordinates provided to calculateDistance:', { point1, point2 });
      return Infinity; // Return large distance for invalid coordinates
    }

    const R = 3959; // Earth's radius in miles
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calculate estimated arrival time
   * @param {number} distance - Distance in miles
   * @returns {number} Estimated arrival in minutes
   */
  calculateEstimatedArrival(distance) {
    const averageSpeed = 25; // mph in city
    return Math.ceil((distance / averageSpeed) * 60);
  }
}

// Create singleton instance
const medicalDriverIntegrationService = new MedicalDriverIntegrationService();
export default medicalDriverIntegrationService;