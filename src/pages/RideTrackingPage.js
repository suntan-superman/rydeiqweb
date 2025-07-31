import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRide } from '../contexts/RideContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RideMap from '../components/rider/RideMap';
import DriverInfo from '../components/rider/DriverInfo';
import RideProgress from '../components/rider/RideProgress';
import RideRating from '../components/rider/RideRating';
import CommunicationWidget from '../components/communication/CommunicationWidget';
import SafetyWidget from '../components/safety/SafetyWidget';
import GpsTrackingWidget from '../components/tracking/GpsTrackingWidget';
import { rideMapService } from '../services/rideMapService';
import toast from 'react-hot-toast';

const RideTrackingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    currentRide,
    rideStatus,
    selectedDriver,
    loading,
    error,
    hasActiveRide,
    cancelCurrentRide,
    rateCurrentDriver,
    RIDE_STATUS
  } = useRide();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [estimatedArrival, setEstimatedArrival] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [geofenceStatus, setGeofenceStatus] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Redirect if no active ride
  useEffect(() => {
    if (!hasActiveRide && rideStatus !== RIDE_STATUS.COMPLETED) {
      navigate('/request-ride');
      return;
    }
  }, [hasActiveRide, rideStatus, navigate, RIDE_STATUS.COMPLETED]);

  // Handle ride completion
  useEffect(() => {
    if (rideStatus === RIDE_STATUS.COMPLETED) {
      setShowRatingModal(true);
    }
  }, [rideStatus, RIDE_STATUS.COMPLETED]);

  // Start simulated tracking (fallback)
  const startSimulatedTracking = useCallback(() => {
    if (hasActiveRide && selectedDriver) {
      const interval = setInterval(() => {
        // Simulate driver moving towards pickup/destination
        const newLocation = {
          lat: 40.7128 + (Math.random() - 0.5) * 0.01,
          lng: -74.0060 + (Math.random() - 0.5) * 0.01
        };
        setDriverLocation(newLocation);
        
        // Update estimated arrival
        const randomETA = Math.floor(Math.random() * 15) + 2; // 2-17 minutes
        setEstimatedArrival(randomETA);

        // Update geofence status
        if (currentRide?.pickup?.location && currentRide?.destination?.location) {
          const status = rideMapService.getGeofenceStatus(
            newLocation,
            currentRide.pickup.location,
            currentRide.destination.location
          );
          setGeofenceStatus(status);
        }
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [hasActiveRide, selectedDriver, currentRide]);

  // Initialize real-time tracking
  const initializeTracking = useCallback(async () => {
    if (!hasActiveRide || !currentRide?.id) return;

    try {
      // Initialize ride tracking service
      const result = await rideMapService.initializeRideTracking(
        currentRide.id,
        (location) => {
          setDriverLocation(location);
          
          // Update geofence status
          if (currentRide?.pickup?.location && currentRide?.destination?.location) {
            const status = rideMapService.getGeofenceStatus(
              location,
              currentRide.pickup.location,
              currentRide.destination.location
            );
            setGeofenceStatus(status);
          }
        }
      );

      if (result.success) {
        setTrackingActive(true);
        console.log('Real-time tracking initialized');
      }
    } catch (error) {
      console.error('Failed to initialize tracking:', error);
      // Fallback to simulated tracking
      startSimulatedTracking();
    }
  }, [hasActiveRide, currentRide, startSimulatedTracking]);

  // Initialize tracking when ride becomes active
  useEffect(() => {
    if (hasActiveRide && currentRide?.id && !trackingActive) {
      initializeTracking();
    }
  }, [hasActiveRide, currentRide, trackingActive, initializeTracking]);

  // Calculate route information when map is ready
  const handleMapReady = useCallback(async (map) => {
    
    if (currentRide?.pickup?.location && currentRide?.destination?.location) {
      try {
        const routeResult = await rideMapService.calculateOptimalRoute(
          currentRide.pickup.location,
          currentRide.destination.location
        );
        
        if (routeResult.success) {
          setRouteInfo(routeResult.selectedRoute);
          
          // Calculate ETA
          const etaResult = await rideMapService.calculateETA(
            currentRide.pickup.location,
            currentRide.destination.location
          );
          
          if (etaResult.success) {
            setEstimatedArrival(Math.ceil(etaResult.durationInTraffic.value / 60));
          }
        }
      } catch (error) {
        console.error('Failed to calculate route:', error);
      }
    }
  }, [currentRide]);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      if (trackingActive) {
        rideMapService.stopLocationTracking();
      }
    };
  }, [trackingActive]);

  const handleCancelRide = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this ride? You may be charged a cancellation fee.'
    );
    
    if (confirmed) {
      const result = await cancelCurrentRide('Customer cancelled during ride');
      if (result.success) {
        navigate('/request-ride');
      }
    }
  };

  const handleRatingSubmit = async (rating, review) => {
    const result = await rateCurrentDriver(rating, review);
    if (result.success) {
      setShowRatingModal(false);
      navigate('/ride-history');
    }
  };

  const handleContactDriver = () => {
    // In production, this would open a masked calling/messaging interface
    toast.success('Contacting driver... (Feature coming soon)');
  };

  const handleReportIssue = () => {
    // In production, this would open a support ticket interface
    toast.success('Report submitted to support team (Feature coming soon)');
  };

  const handleEmergencyLocation = async () => {
    if (!currentRide?.id || !driverLocation) return;

    try {
      const result = await rideMapService.shareEmergencyLocation(driverLocation, currentRide.id);
      if (result.success) {
        toast.success('Emergency location shared with support team');
      } else {
        toast.error('Failed to share emergency location');
      }
    } catch (error) {
      toast.error('Emergency location sharing failed');
    }
  };

  const formatRideTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRideStatusMessage = () => {
    switch (rideStatus) {
      case RIDE_STATUS.MATCHED:
        return 'Driver assigned and on the way';
      case RIDE_STATUS.ACTIVE:
        return 'Trip in progress';
      case RIDE_STATUS.COMPLETED:
        return 'Trip completed';
      default:
        return 'Processing ride...';
    }
  };

  const getStatusColor = () => {
    switch (rideStatus) {
      case RIDE_STATUS.MATCHED:
        return 'text-blue-600';
      case RIDE_STATUS.ACTIVE:
        return 'text-green-600';
      case RIDE_STATUS.COMPLETED:
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isAuthenticated || loading) {
    return <LoadingSpinner message="Loading ride information..." />;
  }

  if (!hasActiveRide && rideStatus !== RIDE_STATUS.COMPLETED) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🚗</div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">No Active Ride</h2>
          <p className="text-gray-600 mb-4">You don't have any active rides at the moment.</p>
          <Button onClick={() => navigate('/request-ride')} variant="primary">
            Request a Ride
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Ride</h1>
              <p className={`text-sm font-medium ${getStatusColor()}`}>
                {getRideStatusMessage()}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {rideStatus === RIDE_STATUS.MATCHED && (
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleCancelRide}
                  loading={loading}
                >
                  Cancel Ride
                </Button>
              )}
              <Button
                variant="ghost"
                size="small"
                onClick={() => navigate('/ride-history')}
              >
                Ride History
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ride Map */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <RideMap
                pickup={currentRide?.pickup}
                destination={currentRide?.destination}
                driverLocation={driverLocation}
                rideStatus={rideStatus}
                onMapReady={handleMapReady}
                className="h-96"
              />
              
              {/* Tracking Status */}
              {trackingActive && (
                <div className="p-3 bg-green-50 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-700">Live tracking active</span>
                    </div>
                    {geofenceStatus && (
                      <div className="text-xs text-green-600">
                        {geofenceStatus.nearPickup ? 'Near pickup' : 
                         geofenceStatus.nearDropoff ? 'Near destination' : 
                         `${Math.round(geofenceStatus.pickupDistance)}m to pickup`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Ride Progress */}
            <RideProgress
              rideStatus={rideStatus}
              currentRide={currentRide}
              estimatedArrival={estimatedArrival}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver Information */}
            {selectedDriver && (
              <DriverInfo
                driver={selectedDriver}
                onContactDriver={handleContactDriver}
                onReportIssue={handleReportIssue}
              />
            )}

            {/* Communication Widget */}
            {selectedDriver && (
              <CommunicationWidget
                rideId={currentRide?.id}
                otherUserId={selectedDriver.id}
                otherUserName={selectedDriver.displayName || selectedDriver.firstName}
                rideStatus={rideStatus}
              />
            )}

            {/* Safety Widget */}
            <SafetyWidget
              rideId={currentRide?.id}
              rideData={currentRide}
              onEmergencyTriggered={(emergencyId) => {
                console.log('Emergency triggered:', emergencyId);
                toast.success('Emergency alert sent! Support team notified.');
              }}
            />

            {/* GPS Tracking Widget */}
            <GpsTrackingWidget
              rideId={currentRide?.id}
              rideData={currentRide}
              isDriver={false}
            />

            {/* Trip Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup</label>
                  <p className="text-gray-900 text-sm">{currentRide?.pickup?.address}</p>
                  {currentRide?.startedAt && (
                    <p className="text-xs text-gray-500">
                      Picked up at {formatRideTime(currentRide.startedAt)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <p className="text-gray-900 text-sm">{currentRide?.destination?.address}</p>
                  {currentRide?.completedAt && (
                    <p className="text-xs text-gray-500">
                      Arrived at {formatRideTime(currentRide.completedAt)}
                    </p>
                  )}
                </div>
                
                {/* Route Information */}
                {routeInfo && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Distance</span>
                      <span className="font-medium">{routeInfo.distance.text}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-700">Duration</span>
                      <span className="font-medium">{routeInfo.duration.text}</span>
                    </div>
                    {routeInfo.durationInTraffic && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-700">With Traffic</span>
                        <span className="font-medium">{routeInfo.durationInTraffic.text}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Fare</span>
                    <span className="font-medium">${currentRide?.estimatedFare?.toFixed(2) || '0.00'}</span>
                  </div>
                  {currentRide?.finalFare && currentRide.finalFare !== currentRide.estimatedFare && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-700">Final Fare</span>
                      <span className="font-medium">${currentRide.finalFare.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ride Type</label>
                  <p className="text-gray-900 text-sm capitalize">
                    {currentRide?.rideType?.replace('_', ' ') || 'Standard'}
                  </p>
                </div>
                
                {currentRide?.specialRequests?.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                    <p className="text-gray-900 text-sm">
                      {currentRide.specialRequests.length} request{currentRide.specialRequests.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Emergency Actions */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-900 mb-2">Quick Emergency Actions</h4>
              <p className="text-xs text-red-700 mb-3">
                Immediate assistance options
              </p>
              <div className="space-y-2">
                <Button
                  variant="danger"
                  size="small"
                  className="w-full"
                  onClick={() => {
                    if (window.confirm('Call emergency services?')) {
                      window.location.href = 'tel:911';
                    }
                  }}
                >
                  🚨 Call 911
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  className="w-full"
                  onClick={handleEmergencyLocation}
                >
                  📍 Share Location
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  className="w-full"
                  onClick={() => {
                    // This will be handled by the SafetyWidget
                    toast.info('Use the Safety Widget above for comprehensive emergency features');
                  }}
                >
                  🛡️ Safety Features
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <RideRating
          driver={selectedDriver}
          ride={currentRide}
          onSubmit={handleRatingSubmit}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  );
};

export default RideTrackingPage; 