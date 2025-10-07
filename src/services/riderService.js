import { 
  collection, 
  doc, 
  addDoc,
  getDoc,
  getDocs,
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { processPayment as processPaymentWithService } from './paymentService';
import { notificationService } from './notificationService';
import multiStopRideService from './multiStopRideService';

// ===== RIDE REQUEST MANAGEMENT =====

// Create a new ride request
export const createRideRequest = async (rideData) => {
  try {
    const {
      customerId,
      pickup,
      destination,
      rideType = 'standard',
      specialRequests = [],
      scheduledTime = null,
      paymentMethod = 'card'
    } = rideData;

    // Calculate estimated fare (basic calculation - can be enhanced)
    const estimatedFare = calculateEstimatedFare(pickup, destination, rideType);
    
    const rideRequest = {
      customerId,
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
      rideType,
      specialRequests,
      estimatedFare,
      companyBid: estimatedFare, // Company's estimated price
      scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : null,
      paymentMethod,
      status: 'pending', // pending -> bidding -> matched -> active -> completed/cancelled
      driverBids: [],
      selectedDriverId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      biddingExpiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes for bidding
    };

    const docRef = await addDoc(collection(db, 'rideRequests'), rideRequest);
    
    // Send notification to nearby drivers about new ride request
    try {
      const nearbyDrivers = await getNearbyDrivers(pickup.coordinates, 10);
      if (nearbyDrivers.length > 0) {
        await notificationService.sendRideRequestToDrivers(
          { id: docRef.id, ...rideRequest },
          nearbyDrivers
        );
      }
    } catch (error) {
      console.error('Failed to send ride request notifications:', error);
    }
    
    return {
      success: true,
      data: {
        id: docRef.id,
        ...rideRequest
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Get ride request details
export const getRideRequest = async (rideRequestId) => {
  try {
    const docRef = doc(db, 'rideRequests', rideRequestId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Ride request not found');
    }

    return {
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Listen to real-time updates for a ride request (for bidding)
export const subscribeToRideRequest = (rideRequestId, callback) => {
  const docRef = doc(db, 'rideRequests', rideRequestId);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({
        success: true,
        data: {
          id: doc.id,
          ...doc.data()
        }
      });
    } else {
      callback({
        success: false,
        error: { message: 'Ride request not found' }
      });
    }
  }, (error) => {
    callback({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      }
    });
  });
};

// ===== DRIVER BIDDING MANAGEMENT =====

// Submit a driver bid (called from driver app)
export const submitDriverBid = async (rideRequestId, bidData) => {
  try {
    const {
      driverId,
      bidAmount,
      estimatedArrival,
      message = '',
      vehicleInfo
    } = bidData;

    // Get current ride request
    const rideResult = await getRideRequest(rideRequestId);
    if (!rideResult.success) {
      throw new Error('Ride request not found');
    }

    const rideRequest = rideResult.data;
    
    // Check if bidding is still open
    if (new Date() > new Date(rideRequest.biddingExpiresAt)) {
      throw new Error('Bidding period has expired');
    }

    // Check if driver already bid
    const existingBidIndex = rideRequest.driverBids.findIndex(bid => bid.driverId === driverId);
    
    const newBid = {
      driverId,
      bidAmount: parseFloat(bidAmount),
      estimatedArrival: parseInt(estimatedArrival),
      message,
      vehicleInfo,
      bidTime: new Date().toISOString()
    };

    let updatedBids;
    if (existingBidIndex >= 0) {
      // Update existing bid
      updatedBids = [...rideRequest.driverBids];
      updatedBids[existingBidIndex] = newBid;
    } else {
      // Add new bid
      updatedBids = [...rideRequest.driverBids, newBid];
    }

    // Update ride request with new bid
    const docRef = doc(db, 'rideRequests', rideRequestId);
    await updateDoc(docRef, {
      driverBids: updatedBids,
      status: 'bidding',
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Select a driver bid (rider chooses a driver)
export const selectDriverBid = async (rideRequestId, driverId) => {
  try {
    const docRef = doc(db, 'rideRequests', rideRequestId);
    
    await updateDoc(docRef, {
      selectedDriverId: driverId,
      status: 'matched',
      matchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Send notification to customer about driver selection
    try {
      const rideRequest = await getRideRequest(rideRequestId);
      if (rideRequest.success) {
        await notificationService.sendRideStatusUpdate(
          rideRequestId,
          rideRequest.data.customerId,
          'matched',
          { driverId }
        );
      }
    } catch (error) {
      console.error('Failed to send ride status notification:', error);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// ===== RIDE TRACKING =====

// Start the ride (when driver picks up customer)
export const startRide = async (rideRequestId) => {
  try {
    const docRef = doc(db, 'rideRequests', rideRequestId);
    
    await updateDoc(docRef, {
      status: 'active',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Send notification to customer about ride start
    try {
      const rideRequest = await getRideRequest(rideRequestId);
      if (rideRequest.success) {
        await notificationService.sendRideStatusUpdate(
          rideRequestId,
          rideRequest.data.customerId,
          'started'
        );
      }
    } catch (error) {
      console.error('Failed to send ride status notification:', error);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Complete the ride
export const completeRide = async (rideRequestId, completionData = {}) => {
  try {
    const {
      finalFare,
      tip = 0,
      distance,
      duration,
      route
    } = completionData;

    const docRef = doc(db, 'rideRequests', rideRequestId);
    
    await updateDoc(docRef, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      finalFare: finalFare || 0,
      tip,
      distance,
      duration,
      route,
      updatedAt: new Date().toISOString()
    });

    // Send notification to customer about ride completion
    try {
      const rideRequest = await getRideRequest(rideRequestId);
      if (rideRequest.success) {
        await notificationService.sendRideStatusUpdate(
          rideRequestId,
          rideRequest.data.customerId,
          'completed',
          { finalFare, tip }
        );
      }
    } catch (error) {
      console.error('Failed to send ride status notification:', error);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Cancel ride
export const cancelRide = async (rideRequestId, reason, cancelledBy) => {
  try {
    const docRef = doc(db, 'rideRequests', rideRequestId);
    
    await updateDoc(docRef, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason,
      cancelledBy, // 'customer' or 'driver'
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// ===== RIDE HISTORY =====

// Get customer's ride history
export const getRideHistory = async (customerId, limit = 20) => {
  try {
    const q = query(
      collection(db, 'rideRequests'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const rides = [];
    
    querySnapshot.forEach((doc) => {
      rides.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: rides
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// ===== RATING SYSTEM =====

// Rate driver after ride
export const rateDriver = async (rideRequestId, rating, review = '') => {
  try {
    const docRef = doc(db, 'rideRequests', rideRequestId);
    
    await updateDoc(docRef, {
      customerRating: {
        rating: parseInt(rating),
        review,
        ratedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    });

    // TODO: Update driver's overall rating

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// ===== FARE CALCULATION =====

// Basic fare calculation (can be enhanced with real-time pricing)
export const calculateEstimatedFare = (pickup, destination, rideType = 'standard') => {
  // This is a simplified calculation - in production you'd use:
  // - Google Distance Matrix API
  // - Real-time traffic data  
  // - Dynamic pricing algorithms
  // - Local market rates

  const baseRates = {
    standard: {
      base: 3.50,
      perMile: 1.75,
      perMinute: 0.25,
      minimum: 5.00
    },
    premium: {
      base: 5.00,
      perMile: 2.50,
      perMinute: 0.35,
      minimum: 8.00
    },
    wheelchair: {
      base: 4.00,
      perMile: 2.00,
      perMinute: 0.30,
      minimum: 6.00
    }
  };

  const rates = baseRates[rideType] || baseRates.standard;
  
  // Estimate distance (this would come from Google Maps API)
  const estimatedDistance = calculateDistance(pickup.coordinates, destination.coordinates);
  const estimatedDuration = estimatedDistance * 2; // rough estimate: 2 minutes per mile
  
  const calculatedFare = rates.base + 
                        (estimatedDistance * rates.perMile) + 
                        (estimatedDuration * rates.perMinute);
  
  return Math.max(calculatedFare, rates.minimum);
};

// Simple distance calculation (Haversine formula)
const calculateDistance = (coord1, coord2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

// ===== PAYMENT INTEGRATION =====

// Process payment (now integrated with comprehensive payment system)
export const processPayment = async (rideRequestId, paymentData) => {
  try {
    const result = await processPaymentWithService(rideRequestId, paymentData);
    return result;
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Get nearby available drivers (for map display)
export const getNearbyDrivers = async (location, radiusMiles = 10) => {
  try {
    // In production, you'd use geospatial queries
    // For now, we'll get all active drivers and filter by distance
    const q = query(
      collection(db, 'driverApplications'),
      where('status', '==', 'approved')
    );
    
    const querySnapshot = await getDocs(q);
    const nearbyDrivers = [];
    
    querySnapshot.forEach((doc) => {
      const driver = doc.data();
      if (driver.currentLocation) {
        const distance = calculateDistance(location, driver.currentLocation);
        if (distance <= radiusMiles) {
          nearbyDrivers.push({
            id: doc.id,
            ...driver,
            distance
          });
        }
      }
    });

    // Sort by distance
    nearbyDrivers.sort((a, b) => a.distance - b.distance);

    return {
      success: true,
      data: nearbyDrivers
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

const riderService = {
  // Ride Management
  createRideRequest,
  getRideRequest,
  subscribeToRideRequest,
  
  // Bidding
  submitDriverBid,
  selectDriverBid,
  
  // Ride Lifecycle
  startRide,
  completeRide,
  cancelRide,
  
  // History & Rating
  getRideHistory,
  rateDriver,
  
  // Fare & Payment
  calculateEstimatedFare,
  processPayment,
  
  // Driver Discovery
  getNearbyDrivers,
  
  // Multi-stop Rides
  createMultiStopRideRequest,
  calculateStopDelta,
  addStopToRide
};

// ===== MULTI-STOP RIDE MANAGEMENT =====

/**
 * Create a multi-stop ride request
 * Uses MultiStopRideService for route optimization and pricing
 */
export async function createMultiStopRideRequest(rideData) {
  try {
    const {
      customerId,
      pickup,
      stops = [], // Array of stop locations
      finalDestination = null, // Optional final destination separate from stops
      rideType = 'standard',
      specialRequests = [],
      scheduledTime = null,
      paymentMethod = 'card',
      driverPreferences = {}
    } = rideData;

    // Validate stops
    if (!stops || stops.length === 0) {
      return {
        success: false,
        error: {
          code: 'invalid-stops',
          message: 'At least one stop is required for multi-stop rides'
        }
      };
    }

    if (stops.length > 5) {
      return {
        success: false,
        error: {
          code: 'too-many-stops',
          message: 'Maximum 5 stops allowed per ride'
        }
      };
    }

    // Create multi-stop ride using the dedicated service
    const result = await multiStopRideService.createMultiStopRequest({
      customerId,
      pickup,
      stops,
      finalDestination,
      rideType,
      specialRequests,
      scheduledTime,
      paymentMethod,
      driverPreferences
    });

    if (!result.success) {
      return {
        success: false,
        error: {
          code: 'multi-stop-creation-failed',
          message: result.error
        }
      };
    }

    // Send notifications to nearby drivers
    try {
      const nearbyDrivers = await getNearbyDrivers(pickup.coordinates, 10);
      if (nearbyDrivers.length > 0) {
        await notificationService.sendRideRequestToDrivers(
          result.rideRequest,
          nearbyDrivers,
          { isMultiStop: true }
        );
      }
    } catch (error) {
      console.error('Failed to send multi-stop ride request notifications:', error);
      // Don't fail the whole request if notifications fail
    }

    return {
      success: true,
      data: result.rideRequest
    };

  } catch (error) {
    console.error('❌ Create multi-stop ride request failed:', error);
    return {
      success: false,
      error: {
        code: error.code || 'unknown-error',
        message: error.message
      }
    };
  }
}

/**
 * Calculate delta fare for adding a stop to existing ride
 * Can be used pre-ride (planning) or in-ride (on-the-fly)
 */
export async function calculateStopDelta(rideId, newStop) {
  try {
    // Get current ride
    const rideDoc = await getDoc(doc(db, 'rides', rideId));
    
    if (!rideDoc.exists()) {
      const requestDoc = await getDoc(doc(db, 'rideRequests', rideId));
      if (!requestDoc.exists()) {
        return {
          success: false,
          error: {
            code: 'ride-not-found',
            message: 'Ride or ride request not found'
          }
        };
      }
      
      // Use ride request data
      const currentRoute = requestDoc.data();
      const delta = await multiStopRideService.calculateStopDelta(
        rideId,
        newStop,
        currentRoute
      );
      
      return {
        success: true,
        data: delta
      };
    }

    // Use active ride data
    const currentRoute = rideDoc.data();
    const delta = await multiStopRideService.calculateStopDelta(
      rideId,
      newStop,
      currentRoute
    );

    return {
      success: true,
      data: delta
    };

  } catch (error) {
    console.error('❌ Calculate stop delta failed:', error);
    return {
      success: false,
      error: {
        code: error.code || 'unknown-error',
        message: error.message
      }
    };
  }
}

/**
 * Add a stop to an existing ride (pre-ride or in-ride)
 * Implements the auto-adjust with guardrails compensation model
 */
export async function addStopToRide(rideId, newStop, options = {}) {
  try {
    // Calculate delta first
    const deltaResult = await calculateStopDelta(rideId, newStop);
    
    if (!deltaResult.success) {
      return deltaResult;
    }

    const delta = deltaResult.data;

    // Check if requires approval or can be auto-applied
    if (delta.suggestedAction === 'request_new_bid') {
      return {
        success: false,
        requiresNewBid: true,
        delta,
        message: 'Change exceeds threshold - new bid required'
      };
    }

    if (delta.requiresApproval && !options.forceApprove) {
      return {
        success: false,
        requiresApproval: true,
        delta,
        message: 'Stop addition requires driver and/or rider approval'
      };
    }

    // Auto-apply if within thresholds or approved
    const rideRef = doc(db, 'rideRequests', rideId);
    const rideDoc = await getDoc(rideRef);

    if (!rideDoc.exists()) {
      return {
        success: false,
        error: {
          code: 'ride-not-found',
          message: 'Ride request not found'
        }
      };
    }

    const currentRide = rideDoc.data();

    // Update ride with new stop and pricing
    const updatedStops = [...currentRide.stops, {
      id: newStop.id || `stop_${currentRide.stops.length + 1}`,
      address: newStop.address,
      coordinates: newStop.coordinates,
      placeId: newStop.placeId,
      order: currentRide.stops.length + 1,
      estimatedArrival: new Date(Date.now() + delta.deltaDuration * 60 * 1000).toISOString(),
      specialInstructions: newStop.specialInstructions || null,
      contactInfo: newStop.contactInfo || null,
      completed: false,
      addedAt: new Date().toISOString()
    }];

    const pricingAdjustment = {
      kind: 'add_stop',
      calc: {
        dMiles: delta.deltaDistance,
        dMins: delta.deltaDuration,
        dWaitMins: 0
      },
      suggested: delta.deltaFare,
      driverEdited: null,
      riderApproved: delta.riderAutoAccept,
      driverApproved: delta.driverAutoAccept,
      timestamp: new Date().toISOString()
    };

    await updateDoc(rideRef, {
      stops: updatedStops,
      stopCount: updatedStops.length,
      'pricing.estimatedFare': currentRide.pricing.estimatedFare + delta.deltaFare,
      'pricing.adjustments': [...(currentRide.pricing?.adjustments || []), pricingAdjustment],
      'routeOptimization': delta.newRoute.routeOptimization || currentRide.routeOptimization,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      delta,
      updatedFare: currentRide.pricing.estimatedFare + delta.deltaFare,
      message: 'Stop added successfully'
    };

  } catch (error) {
    console.error('❌ Add stop to ride failed:', error);
    return {
      success: false,
      error: {
        code: error.code || 'unknown-error',
        message: error.message
      }
    };
  }
}

export default riderService; 