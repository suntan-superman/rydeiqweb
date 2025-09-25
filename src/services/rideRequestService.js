import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  serverTimestamp,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import driverBidService from './driverBidService';
import rideMatchingService from './rideMatchingService';

class RideRequestService {
  constructor() {
    this.collection = 'rideRequests';
  }

  // Create a new ride request
  async createRideRequest(rideData) {
    try {
      const request = {
        ...rideData,
        status: 'pending',
        createdAt: serverTimestamp(),
        estimatedFare: this.calculateEstimatedFare(rideData),
        rideType: rideData.rideType || 'standard',
        preferences: rideData.preferences || {},
        specialtyData: rideData.specialtyData || null, // Add specialty ride data
        isSpecialtyRide: ['tow_truck', 'companion_driver', 'medical'].includes(rideData.rideType),
        requiresSpecialDrivers: this.requiresSpecialDrivers(rideData.rideType)
      };
      
      const docRef = await addDoc(collection(db, this.collection), request);
      
      // Automatically trigger driver matching
      await this.triggerDriverMatching(docRef.id, request);
      
      return { success: true, requestId: docRef.id };
    } catch (error) {
      console.error('Error creating ride request:', error);
      return { success: false, error: error.message };
    }
  }

  // Get ride requests for a specific rider
  async getRideRequestsForRider(riderId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collection),
        where('riderId', '==', riderId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching ride requests for rider:', error);
      return [];
    }
  }

  // Get active ride requests
  async getActiveRideRequests(limitCount = 100) {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', 'in', ['pending', 'driver_assigned', 'in_progress']),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching active ride requests:', error);
      return [];
    }
  }

  // Get ride request by ID
  async getRideRequestById(requestId) {
    try {
      const docSnap = await getDocs(query(collection(db, this.collection), where('__name__', '==', requestId)));
      
      if (!docSnap.empty) {
        const doc = docSnap.docs[0];
        return { success: true, data: { id: doc.id, ...doc.data() } };
      } else {
        return { success: false, error: 'Ride request not found' };
      }
    } catch (error) {
      console.error('Error fetching ride request:', error);
      return { success: false, error: error.message };
    }
  }

  // Update ride request status
  async updateRideRequestStatus(requestId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData
      };
      
      await updateDoc(doc(db, this.collection, requestId), updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating ride request status:', error);
      return { success: false, error: error.message };
    }
  }

  // Assign driver to ride request
  async assignDriver(requestId, driverId, bidId) {
    try {
      await updateDoc(doc(db, this.collection, requestId), {
        driverId,
        bidId,
        status: 'driver_assigned',
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update the bid status
      await driverBidService.updateDriverBidStatus(bidId, 'accepted');
      
      return { success: true };
    } catch (error) {
      console.error('Error assigning driver:', error);
      return { success: false, error: error.message };
    }
  }

  // Start ride
  async startRide(requestId, driverId) {
    try {
      await updateDoc(doc(db, this.collection, requestId), {
        status: 'in_progress',
        startTime: serverTimestamp(),
        actualPickupTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error starting ride:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete ride
  async completeRide(requestId, completionData = {}) {
    try {
      await updateDoc(doc(db, this.collection, requestId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        actualDropoffTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...completionData
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error completing ride:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel ride request
  async cancelRideRequest(requestId, reason = '') {
    try {
      await updateDoc(doc(db, this.collection, requestId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancellationReason: reason,
        updatedAt: serverTimestamp()
      });
      
      // Cancel any associated bids
      const bids = await driverBidService.getBidsForRideRequest(requestId);
      for (const bid of bids) {
        await driverBidService.updateDriverBidStatus(bid.id, 'cancelled');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error cancelling ride request:', error);
      return { success: false, error: error.message };
    }
  }

  // Get available drivers for ride request
  async getAvailableDrivers(rideData) {
    try {
      // This would typically query drivers based on location, availability, etc.
      // For now, return mock data - in production, this would integrate with driver location service
      const mockDrivers = [
        {
          id: 'driver1',
          name: 'John Doe',
          rating: 4.8,
          vehicle: 'Toyota Camry 2020',
          estimatedArrival: '5 min',
          distance: '2.1 miles',
          baseFare: 8.50,
          perMileRate: 1.25,
          perMinuteRate: 0.35,
          profilePicture: null,
          isVideoEnabled: true,
          isPairedDriver: false,
          certifications: ['standard', 'medical']
        },
        {
          id: 'driver2',
          name: 'Jane Smith',
          rating: 4.9,
          vehicle: 'Honda Accord 2021',
          estimatedArrival: '7 min',
          distance: '3.2 miles',
          baseFare: 9.00,
          perMileRate: 1.30,
          perMinuteRate: 0.40,
          profilePicture: null,
          isVideoEnabled: false,
          isPairedDriver: true,
          certifications: ['standard', 'medical', 'special_needs']
        },
        {
          id: 'driver3',
          name: 'Mike Johnson',
          rating: 4.7,
          vehicle: 'Nissan Altima 2019',
          estimatedArrival: '10 min',
          distance: '4.5 miles',
          baseFare: 7.50,
          perMileRate: 1.20,
          perMinuteRate: 0.30,
          profilePicture: null,
          isVideoEnabled: true,
          isPairedDriver: false,
          certifications: ['standard']
        }
      ];

      return { success: true, data: mockDrivers };
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate estimated fare based on ride data
  calculateEstimatedFare(rideData) {
    const baseFare = 5.00;
    const perMileRate = 1.25;
    const perMinuteRate = 0.35;
    
    // Mock calculation - in production, this would use real distance/time calculations
    const estimatedDistance = 5.2; // miles
    const estimatedTime = 15; // minutes
    
    const distanceFare = estimatedDistance * perMileRate;
    const timeFare = estimatedTime * perMinuteRate;
    const subtotal = baseFare + distanceFare + timeFare;
    
    // Apply ride type multipliers
    let multiplier = 1.0;
    if (rideData.rideType === 'tow_back') multiplier = 1.5;
    if (rideData.rideType === 'paired_driver') multiplier = 2.0;
    if (rideData.rideType === 'medical') multiplier = 1.2;
    
    const total = subtotal * multiplier;
    
    return {
      baseFare,
      distanceFare,
      timeFare,
      subtotal,
      multiplier,
      total: Math.round(total * 100) / 100,
      estimatedDistance,
      estimatedTime
    };
  }

  // Determine if ride type requires special drivers
  requiresSpecialDrivers(rideType) {
    const specialRideTypes = {
      tow_truck: true,
      companion_driver: true,
      medical: true,
      wheelchair: true
    };
    
    return specialRideTypes[rideType] || false;
  }

  // Trigger driver matching for a ride request
  async triggerDriverMatching(requestId, rideData) {
    try {
      // Get available drivers
      const driversResult = await this.getAvailableDrivers(rideData);
      if (!driversResult.success) return;

      // Create ride matching entry
      const matchData = {
        rideRequestId: requestId,
        riderId: rideData.riderId,
        pickupLocation: rideData.pickupLocation,
        dropoffLocation: rideData.dropoffLocation,
        scheduledTime: rideData.scheduledTime,
        rideType: rideData.rideType,
        preferences: rideData.preferences,
        status: 'matching',
        createdAt: serverTimestamp()
      };

      const matchResult = await rideMatchingService.createRideMatch(matchData);
      if (matchResult.success) {
        // Notify drivers about the new ride request
        // This would typically send push notifications or use a real-time system
        console.log('Driver matching triggered for ride request:', requestId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error triggering driver matching:', error);
      return { success: false, error: error.message };
    }
  }

  // Get ride request statistics
  async getRideRequestStatistics(timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);
      const q = query(
        collection(db, this.collection),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const stats = {
        totalRequests: requests.length,
        pendingRequests: requests.filter(req => req.status === 'pending').length,
        assignedRequests: requests.filter(req => req.status === 'driver_assigned').length,
        inProgressRequests: requests.filter(req => req.status === 'in_progress').length,
        completedRequests: requests.filter(req => req.status === 'completed').length,
        cancelledRequests: requests.filter(req => req.status === 'cancelled').length,
        averageFare: this.calculateAverageFare(requests),
        completionRate: this.calculateCompletionRate(requests),
        mostPopularRideType: this.getMostPopularRideType(requests)
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching ride request statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time listener for ride requests
  subscribeToRideRequests(riderId, callback) {
    const q = query(
      collection(db, this.collection),
      where('riderId', '==', riderId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    });
  }

  // Search ride requests by criteria
  async searchRideRequests(criteria = {}) {
    try {
      let q = query(collection(db, this.collection));

      // Add filters based on criteria
      if (criteria.riderId) {
        q = query(q, where('riderId', '==', criteria.riderId));
      }
      if (criteria.driverId) {
        q = query(q, where('driverId', '==', criteria.driverId));
      }
      if (criteria.status) {
        q = query(q, where('status', '==', criteria.status));
      }
      if (criteria.rideType) {
        q = query(q, where('rideType', '==', criteria.rideType));
      }
      if (criteria.startDate) {
        q = query(q, where('createdAt', '>=', criteria.startDate));
      }
      if (criteria.endDate) {
        q = query(q, where('createdAt', '<=', criteria.endDate));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      if (criteria.limit) {
        q = query(q, limit(criteria.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error searching ride requests:', error);
      return [];
    }
  }

  // Helper method to calculate average fare
  calculateAverageFare(requests) {
    const completedRequests = requests.filter(req => req.status === 'completed' && req.estimatedFare);
    if (completedRequests.length === 0) return 0;
    
    const totalFare = completedRequests.reduce((sum, req) => sum + req.estimatedFare.total, 0);
    return Math.round((totalFare / completedRequests.length) * 100) / 100;
  }

  // Helper method to calculate completion rate
  calculateCompletionRate(requests) {
    if (requests.length === 0) return 0;
    const completedCount = requests.filter(req => req.status === 'completed').length;
    return (completedCount / requests.length) * 100;
  }

  // Helper method to get most popular ride type
  getMostPopularRideType(requests) {
    const types = {};
    requests.forEach(req => {
      const type = req.rideType || 'standard';
      types[type] = (types[type] || 0) + 1;
    });
    
    return Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b, 'standard');
  }

  // Helper method to get start date for time range
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  // Format ride request data for display
  formatRideRequestForDisplay(request) {
    return {
      ...request,
      formattedCreatedAt: request.createdAt ? 
        new Date(request.createdAt).toLocaleString() : 'N/A',
      formattedScheduledTime: request.scheduledTime ? 
        new Date(request.scheduledTime).toLocaleString() : 'N/A',
      duration: request.startTime && request.completedAt ? 
        this.calculateDuration(request.startTime, request.completedAt) : null
    };
  }

  // Calculate duration between two timestamps
  calculateDuration(startTime, endTime) {
    const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
    const end = endTime.toDate ? endTime.toDate() : new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours}h ${minutes}m`;
  }
}

const rideRequestService = new RideRequestService();
export default rideRequestService;
