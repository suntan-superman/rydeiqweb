import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { rideMapService } from '../../services/rideMapService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const GpsTrackingWidget = ({ rideId, rideData, isDriver = false }) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [routeDeviations, setRouteDeviations] = useState([]);
  const [geofenceEvents, setGeofenceEvents] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingMode, setTrackingMode] = useState('normal'); // normal, battery, high-accuracy
  const [locationError, setLocationError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const locationUpdateInterval = useRef(null);

  // Update analytics
  const updateAnalytics = useCallback(() => {
    const currentAnalytics = rideMapService.getLocationAnalytics();
    if (currentAnalytics) {
      setAnalytics(currentAnalytics);
    }

    const deviations = rideMapService.getRouteDeviations();
    if (deviations.length > 0) {
      setRouteDeviations(deviations.slice(-5)); // Last 5 deviations
    }

    const events = rideMapService.getGeofenceEvents();
    if (events.length > 0) {
      setGeofenceEvents(events.slice(-5)); // Last 5 events
    }
  }, []);

  // Handle location updates
  const handleLocationUpdate = useCallback((location) => {
    setCurrentLocation(location);
    setLocationError(null);

    // Update location history
    setLocationHistory(prev => {
      const newHistory = [...prev, location];
      // Keep last 50 points for display
      return newHistory.slice(-50);
    });

    // Update analytics periodically
    updateAnalytics();
  }, [updateAnalytics]);

  // Initialize tracking system
  const initializeTracking = useCallback(async () => {
    try {
      const result = await rideMapService.initializeRideTracking(rideId, handleLocationUpdate);
      if (result.success) {
        console.log('GPS tracking initialized');
        
        // Set up geofences for pickup and destination
        if (rideData?.pickup?.location && rideData?.destination?.location) {
          const geofences = [
            {
              name: 'pickup',
              center: rideData.pickup.location,
              radius: 100 // 100 meters
            },
            {
              name: 'destination',
              center: rideData.destination.location,
              radius: 100 // 100 meters
            }
          ];
          rideMapService.setGeofences(geofences);
        }

        // Set expected route if available
        if (rideData?.route) {
          rideMapService.setExpectedRoute(rideData.route);
        }
      }
    } catch (error) {
      console.error('Failed to initialize tracking:', error);
      setLocationError('Failed to initialize GPS tracking');
    }
  }, [rideId, rideData, handleLocationUpdate]);

  // Initialize tracking
  useEffect(() => {
    if (rideId && user?.uid) {
      initializeTracking();
    }

    return () => {
      cleanup();
    };
  }, [rideId, user?.uid, initializeTracking]);

  // Start tracking
  const startTracking = () => {
    try {
      rideMapService.startLocationTracking();
      setIsTracking(true);
      toast.success('GPS tracking started');
    } catch (error) {
      console.error('Failed to start tracking:', error);
      toast.error('Failed to start GPS tracking');
    }
  };

  // Stop tracking
  const stopTracking = () => {
    try {
      rideMapService.stopLocationTracking();
      setIsTracking(false);
      toast.success('GPS tracking stopped');
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      toast.error('Failed to stop GPS tracking');
    }
  };

  // Change tracking mode
  const changeTrackingMode = (mode) => {
    setTrackingMode(mode);
    
    switch (mode) {
      case 'battery':
        rideMapService.optimizeForBattery();
        toast.success('Switched to battery-optimized tracking');
        break;
      case 'high-accuracy':
        rideMapService.startLocationTracking(2000); // 2-second updates
        toast.success('Switched to high-accuracy tracking');
        break;
      default:
        rideMapService.startLocationTracking(5000); // 5-second updates
        toast.success('Switched to normal tracking');
    }
  };

  // Share current location
  const shareLocation = async () => {
    if (!currentLocation) {
      toast.error('No location available');
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Current Location',
          text: `I'm at ${currentLocation.lat}, ${currentLocation.lng}`,
          url: `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`
        });
      } else {
        // Fallback: copy to clipboard
        const locationText = `${currentLocation.lat}, ${currentLocation.lng}`;
        await navigator.clipboard.writeText(locationText);
        toast.success('Location copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to share location:', error);
      toast.error('Failed to share location');
    }
  };

  // Cleanup
  const cleanup = () => {
    if (locationUpdateInterval.current) {
      clearInterval(locationUpdateInterval.current);
    }
    rideMapService.stopLocationTracking();
  };

  // Format distance
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Format speed
  const formatSpeed = (speed) => {
    if (!speed) return 'N/A';
    const kmh = speed * 3.6; // Convert m/s to km/h
    return `${Math.round(kmh)} km/h`;
  };

  // Get location accuracy color
  const getAccuracyColor = (accuracy) => {
    if (accuracy <= 10) return 'text-green-600';
    if (accuracy <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* GPS Tracking Widget */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">GPS Tracking</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isTracking ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Current Location Display */}
        {currentLocation ? (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Latitude:</span>
                <span className="ml-2 font-mono">{currentLocation.lat.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-600">Longitude:</span>
                <span className="ml-2 font-mono">{currentLocation.lng.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-600">Accuracy:</span>
                <span className={`ml-2 ${getAccuracyColor(currentLocation.accuracy)}`}>
                  {Math.round(currentLocation.accuracy)}m
                </span>
              </div>
              <div>
                <span className="text-gray-600">Speed:</span>
                <span className="ml-2">{formatSpeed(currentLocation.speed)}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {locationError || 'Waiting for location...'}
            </p>
          </div>
        )}

        {/* Tracking Controls */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            onClick={isTracking ? stopTracking : startTracking}
            variant={isTracking ? 'outline' : 'primary'}
            className="w-full"
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Button>
          
          <Button
            onClick={shareLocation}
            disabled={!currentLocation}
            variant="outline"
            className="w-full"
          >
            📍 Share Location
          </Button>
        </div>

        {/* Tracking Mode Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tracking Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: 'Normal', icon: '⚡' },
              { id: 'battery', label: 'Battery', icon: '🔋' },
              { id: 'high-accuracy', label: 'High Acc', icon: '🎯' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => changeTrackingMode(mode.id)}
                className={`p-2 rounded-lg border-2 text-sm transition-colors ${
                  trackingMode === mode.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">{mode.icon}</div>
                  <div className="text-xs">{mode.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Analytics */}
        {analytics && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Quick Stats</h4>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showAnalytics ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-lg font-medium">{formatDistance(analytics.totalDistance)}</div>
                <div className="text-xs text-gray-600">Distance</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-lg font-medium">{Math.round(analytics.averageSpeed * 3.6)} km/h</div>
                <div className="text-xs text-gray-600">Avg Speed</div>
              </div>
            </div>

            {showAnalytics && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Max Speed:</span>
                  <span>{formatSpeed(analytics.maxSpeed)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Route Efficiency:</span>
                  <span>{analytics.routeEfficiency.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Location Points:</span>
                  <span>{locationHistory.length}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Route Deviations */}
        {routeDeviations.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Route Deviations</h4>
            <div className="space-y-1">
              {routeDeviations.map((deviation, index) => (
                <div key={index} className="text-xs text-orange-600">
                  {formatDistance(deviation.deviation)} off route at {new Date(deviation.timestamp).toLocaleTimeString()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geofence Events */}
        {geofenceEvents.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Geofence Events</h4>
            <div className="space-y-1">
              {geofenceEvents.map((event, index) => (
                <div key={index} className="text-xs text-blue-600">
                  {event.type === 'enter' ? '📍' : '🚪'} {event.geofence} at {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location History Preview */}
        {locationHistory.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Locations</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {locationHistory.slice(-5).map((location, index) => (
                <div key={index} className="text-xs text-gray-600">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)} - {new Date(location.timestamp).toLocaleTimeString()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GpsTrackingWidget; 