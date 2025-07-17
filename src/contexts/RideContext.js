import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  createRideRequest,
  getRideRequest,
  subscribeToRideRequest,
  selectDriverBid,
  cancelRide,
  rateDriver,
  getRideHistory,
  calculateEstimatedFare,
  getNearbyDrivers
} from '../services/riderService';
import toast from 'react-hot-toast';

const RideContext = createContext();

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};

// Ride status constants
export const RIDE_STATUS = {
  NONE: 'none',
  REQUESTING: 'requesting',
  PENDING: 'pending',
  BIDDING: 'bidding',
  MATCHED: 'matched',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Ride types
export const RIDE_TYPES = {
  STANDARD: 'standard',
  PREMIUM: 'premium',
  WHEELCHAIR: 'wheelchair',
  PET_FRIENDLY: 'pet_friendly'
};

export const RideProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Core ride state
  const [currentRide, setCurrentRide] = useState(null);
  const [rideStatus, setRideStatus] = useState(RIDE_STATUS.NONE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Location state
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(0);
  
  // Ride preferences
  const [rideType, setRideType] = useState(RIDE_TYPES.STANDARD);
  const [specialRequests, setSpecialRequests] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Real-time data
  const [driverBids, setDriverBids] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  
  // Real-time subscription
  const [rideSubscription, setRideSubscription] = useState(null);



  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (rideSubscription) {
        rideSubscription();
      }
    };
  }, [rideSubscription]);

  // ===== LOCATION MANAGEMENT =====

  const setPickup = (location) => {
    setPickupLocation(location);
    setError(null);
  };

  const setDestination = (location) => {
    setDestinationLocation(location);
    setError(null);
  };

  const swapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(destinationLocation);
    setDestinationLocation(temp);
  };

  const clearLocations = () => {
    setPickupLocation(null);
    setDestinationLocation(null);
    setEstimatedFare(0);
  };

  // ===== FARE CALCULATION =====

  const updateEstimatedFare = useCallback(async () => {
    try {
      if (pickupLocation && destinationLocation) {
        const fare = calculateEstimatedFare(pickupLocation, destinationLocation, rideType);
        setEstimatedFare(fare);
      }
    } catch (error) {
      console.error('Error calculating fare:', error);
    }
  }, [pickupLocation, destinationLocation, rideType]);

  // ===== RIDE REQUEST MANAGEMENT =====

  const requestRide = async (additionalData = {}) => {
    if (!user?.uid) {
      setError('You must be logged in to request a ride');
      return { success: false };
    }

    if (!pickupLocation || !destinationLocation) {
      setError('Please select pickup and destination locations');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const rideData = {
        customerId: user.uid,
        pickup: pickupLocation,
        destination: destinationLocation,
        rideType,
        specialRequests,
        paymentMethod,
        ...additionalData
      };

      const result = await createRideRequest(rideData);

      if (result.success) {
        setCurrentRide(result.data);
        setRideStatus(RIDE_STATUS.PENDING);
        setDriverBids([]);
        
        // Start listening for real-time updates
        startRideSubscription(result.data.id);
        
        // Load nearby drivers for map display
        loadNearbyDrivers();
        
        toast.success('Ride requested! Waiting for driver bids...');
        return { success: true, rideId: result.data.id };
      } else {
        setError(result.error.message);
        toast.error('Failed to request ride');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error requesting ride:', error);
      setError('Failed to request ride');
      toast.error('Failed to request ride');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ===== REAL-TIME SUBSCRIPTION =====

  const startRideSubscription = (rideId) => {
    // Clean up existing subscription
    if (rideSubscription) {
      rideSubscription();
    }

    const unsubscribe = subscribeToRideRequest(rideId, (result) => {
      if (result.success) {
        const updatedRide = result.data;
        setCurrentRide(updatedRide);
        setRideStatus(updatedRide.status);
        setDriverBids(updatedRide.driverBids || []);
        
        // Find selected driver if one exists
        if (updatedRide.selectedDriverId) {
          const driver = updatedRide.driverBids.find(bid => bid.driverId === updatedRide.selectedDriverId);
          setSelectedDriver(driver);
        }

        // Handle status changes
        handleRideStatusChange(updatedRide.status, updatedRide);
      } else {
        console.error('Error in ride subscription:', result.error);
        setError('Connection error. Please check your internet connection.');
      }
    });

    setRideSubscription(() => unsubscribe);
  };

  const handleRideStatusChange = (status, rideData) => {
    switch (status) {
      case 'bidding':
        if (driverBids.length === 1) {
          toast.success('First driver bid received!');
        }
        break;
      case 'matched':
        toast.success('Driver assigned! They are on their way.');
        break;
      case 'active':
        toast.success('Ride started! Enjoy your trip.');
        break;
      case 'completed':
        toast.success('Ride completed! Please rate your driver.');
        // Refresh ride history
        loadRideHistory();
        break;
      case 'cancelled':
        toast.error('Ride was cancelled.');
        resetRideState();
        break;
      default:
        break;
    }
  };

  // ===== DRIVER SELECTION =====

  const selectDriver = async (driverId) => {
    if (!currentRide) {
      setError('No active ride request');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await selectDriverBid(currentRide.id, driverId);
      
      if (result.success) {
        const driver = driverBids.find(bid => bid.driverId === driverId);
        setSelectedDriver(driver);
        toast.success(`Driver selected! ${driver?.vehicleInfo?.make} ${driver?.vehicleInfo?.model} is coming to pick you up.`);
        return { success: true };
      } else {
        setError(result.error.message);
        toast.error('Failed to select driver');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error selecting driver:', error);
      setError('Failed to select driver');
      toast.error('Failed to select driver');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ===== RIDE CANCELLATION =====

  const cancelCurrentRide = async (reason = 'Customer cancelled') => {
    if (!currentRide) {
      setError('No active ride to cancel');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await cancelRide(currentRide.id, reason, 'customer');
      
      if (result.success) {
        toast.success('Ride cancelled successfully');
        resetRideState();
        return { success: true };
      } else {
        setError(result.error.message);
        toast.error('Failed to cancel ride');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error cancelling ride:', error);
      setError('Failed to cancel ride');
      toast.error('Failed to cancel ride');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ===== RATING SYSTEM =====

  const rateCurrentDriver = async (rating, review = '') => {
    if (!currentRide) {
      setError('No ride to rate');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await rateDriver(currentRide.id, rating, review);
      
      if (result.success) {
        toast.success('Thank you for your rating!');
        resetRideState();
        return { success: true };
      } else {
        setError(result.error.message);
        toast.error('Failed to submit rating');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error rating driver:', error);
      setError('Failed to submit rating');
      toast.error('Failed to submit rating');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ===== DATA LOADING =====

  const loadRideHistory = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const result = await getRideHistory(user.uid, 20);
      if (result.success) {
        setRideHistory(result.data);
      } else {
        console.error('Error loading ride history:', result.error);
      }
    } catch (error) {
      console.error('Error loading ride history:', error);
    }
  }, [user]);

  const loadNearbyDrivers = async () => {
    if (!pickupLocation?.coordinates) return;

    try {
      const result = await getNearbyDrivers(pickupLocation.coordinates, 10);
      if (result.success) {
        setNearbyDrivers(result.data);
      } else {
        console.error('Error loading nearby drivers:', result.error);
      }
    } catch (error) {
      console.error('Error loading nearby drivers:', error);
    }
  };

  // ===== STATE MANAGEMENT =====

  const resetRideState = useCallback(() => {
    setCurrentRide(null);
    setRideStatus(RIDE_STATUS.NONE);
    setDriverBids([]);
    setSelectedDriver(null);
    setError(null);
    
    // Clean up subscription
    if (rideSubscription) {
      rideSubscription();
      setRideSubscription(null);
    }
  }, [rideSubscription]);

  // Load ride history when user changes
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      loadRideHistory();
    } else {
      resetRideState();
    }
  }, [user, isAuthenticated, loadRideHistory, resetRideState]);

  // Update estimated fare when locations or ride type change
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      updateEstimatedFare();
    }
  }, [pickupLocation, destinationLocation, rideType, updateEstimatedFare]);

  const refreshCurrentRide = async () => {
    if (!currentRide?.id) return;

    try {
      const result = await getRideRequest(currentRide.id);
      if (result.success) {
        setCurrentRide(result.data);
        setRideStatus(result.data.status);
        setDriverBids(result.data.driverBids || []);
      }
    } catch (error) {
      console.error('Error refreshing ride:', error);
    }
  };

  // ===== COMPUTED VALUES =====

  const hasActiveRide = currentRide && [RIDE_STATUS.PENDING, RIDE_STATUS.BIDDING, RIDE_STATUS.MATCHED, RIDE_STATUS.ACTIVE].includes(rideStatus);
  const canRequestRide = pickupLocation && destinationLocation && !hasActiveRide;
  const hasBids = driverBids.length > 0;
  const biddingTimeRemaining = currentRide ? Math.max(0, new Date(currentRide.biddingExpiresAt) - new Date()) : 0;

  const value = {
    // Core state
    currentRide,
    rideStatus,
    loading,
    error,
    
    // Location state
    pickupLocation,
    destinationLocation,
    estimatedFare,
    
    // Ride preferences
    rideType,
    specialRequests,
    paymentMethod,
    
    // Real-time data
    driverBids,
    selectedDriver,
    nearbyDrivers,
    rideHistory,
    
    // Actions - Location
    setPickup,
    setDestination,
    swapLocations,
    clearLocations,
    
    // Actions - Ride preferences
    setRideType,
    setSpecialRequests,
    setPaymentMethod,
    
    // Actions - Ride management
    requestRide,
    selectDriver,
    cancelCurrentRide,
    rateCurrentDriver,
    refreshCurrentRide,
    resetRideState,
    
    // Actions - Data loading
    loadRideHistory,
    loadNearbyDrivers,
    updateEstimatedFare,
    
    // Computed values
    hasActiveRide,
    canRequestRide,
    hasBids,
    biddingTimeRemaining,
    
    // Constants
    RIDE_STATUS,
    RIDE_TYPES
  };

  return (
    <RideContext.Provider value={value}>
      {children}
    </RideContext.Provider>
  );
};

export default RideContext; 