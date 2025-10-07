import React, { useState, useEffect } from 'react';
import { MapPin, Plus, X, Navigation, AlertCircle } from 'lucide-react';
import LocationPicker from '../location/LocationPicker';
import routeOptimizationService from '../../services/routeOptimizationService';

/**
 * MultiStopLocationSelector
 * Allows riders to add multiple stops to their ride
 * Integrates with route optimization and displays fare preview
 */
const MultiStopLocationSelector = ({ 
  pickup, 
  destination,
  onStopsChange,
  onRouteOptimized,
  maxStops = 5,
  className = ''
}) => {
  const [stops, setStops] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [error, setError] = useState(null);

  // Auto-optimize when stops change
  useEffect(() => {
    if (stops.length > 0 && pickup && destination) {
      optimizeRoute();
    } else {
      setOptimizedRoute(null);
    }
  }, [stops, pickup, destination]);

  // Notify parent when stops change
  useEffect(() => {
    if (onStopsChange) {
      onStopsChange(stops);
    }
  }, [stops, onStopsChange]);

  // Notify parent when route is optimized
  useEffect(() => {
    if (optimizedRoute && onRouteOptimized) {
      onRouteOptimized(optimizedRoute);
    }
  }, [optimizedRoute, onRouteOptimized]);

  const addStop = () => {
    if (stops.length >= maxStops) {
      setError(`Maximum ${maxStops} stops allowed per ride`);
      return;
    }

    setStops([...stops, {
      id: `stop_${Date.now()}`,
      address: '',
      coordinates: null,
      placeId: null,
      specialInstructions: '',
      contactInfo: null
    }]);
    setError(null);
  };

  const removeStop = (stopId) => {
    setStops(stops.filter(stop => stop.id !== stopId));
    setError(null);
  };

  const updateStop = (stopId, field, value) => {
    setStops(stops.map(stop => 
      stop.id === stopId 
        ? { ...stop, [field]: value }
        : stop
    ));
  };

  const handleLocationSelect = (stopId, location) => {
    setStops(stops.map(stop => 
      stop.id === stopId 
        ? {
            ...stop,
            address: location.address,
            coordinates: location.coordinates,
            placeId: location.placeId
          }
        : stop
    ));
  };

  const optimizeRoute = async () => {
    // Filter out stops without coordinates
    const validStops = stops.filter(stop => stop.coordinates);
    
    if (validStops.length === 0) {
      setOptimizedRoute(null);
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const result = await routeOptimizationService.optimizeRoute(
        pickup,
        validStops,
        destination,
        { optimizeOrder: true }
      );

      if (result.success) {
        setOptimizedRoute(result);
        setError(null);
      } else {
        setError('Route optimization failed. Using original order.');
        setOptimizedRoute(result.fallback);
      }
    } catch (err) {
      setError('Failed to optimize route: ' + err.message);
      setOptimizedRoute(null);
    } finally {
      setIsOptimizing(false);
    }
  };

  const canAddStop = stops.length < maxStops;
  const hasValidStops = stops.some(stop => stop.coordinates);

  return (
    <div className={`multi-stop-selector ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-green-600" />
          Additional Stops
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({stops.length}/{maxStops})
          </span>
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Add up to {maxStops} stops along the way. Route will be automatically optimized.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stops List */}
      <div className="space-y-4">
        {stops.map((stop, index) => (
          <div 
            key={stop.id} 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Stop Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-semibold text-blue-600">
                    {index + 1}
                  </span>
                </div>
                <span className="font-medium text-gray-700">
                  Stop {index + 1}
                </span>
              </div>
              <button
                onClick={() => removeStop(stop.id)}
                className="p-1 hover:bg-red-50 rounded-full transition-colors"
                title="Remove stop"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>

            {/* Location Picker */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stop Address *
              </label>
              <LocationPicker
                value={stop.address}
                onLocationSelect={(location) => handleLocationSelect(stop.id, location)}
                placeholder="Enter stop address..."
                className="w-full"
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions (Optional)
              </label>
              <input
                type="text"
                value={stop.specialInstructions}
                onChange={(e) => updateStop(stop.id, 'specialInstructions', e.target.value)}
                placeholder="e.g., Ring doorbell, Wait in lobby..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Optimized Order Indicator */}
            {optimizedRoute && optimizedRoute.stops && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {(() => {
                  const optimizedIndex = optimizedRoute.stops.findIndex(
                    s => s.id === stop.id
                  );
                  if (optimizedIndex !== -1 && optimizedIndex !== index) {
                    return (
                      <div className="flex items-center text-sm text-blue-600">
                        <Navigation className="w-4 h-4 mr-1" />
                        Optimized order: Stop #{optimizedIndex + 1}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Stop Button */}
      {canAddStop && (
        <button
          onClick={addStop}
          className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center text-gray-600 hover:text-green-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Stop
        </button>
      )}

      {/* Optimizing Indicator */}
      {isOptimizing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-blue-800">
              Optimizing route...
            </span>
          </div>
        </div>
      )}

      {/* Route Preview Summary */}
      {optimizedRoute && hasValidStops && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-2">
                Route Optimized ✓
              </h4>
              <div className="space-y-1 text-sm text-green-800">
                <div className="flex justify-between">
                  <span>Total Distance:</span>
                  <span className="font-medium">
                    {optimizedRoute.totalDistance} miles
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Drive Time:</span>
                  <span className="font-medium">
                    {optimizedRoute.totalDuration} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Total Time:</span>
                  <span className="font-medium">
                    {optimizedRoute.totalDurationWithWait} minutes
                  </span>
                </div>
                <div className="text-xs text-green-700 mt-2">
                  (Includes 5 min grace at each stop)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stops.length === 0 && (
        <div className="mt-4 text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            No additional stops yet
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Click "Add Stop" to add stops along your route
          </p>
        </div>
      )}
    </div>
  );
};

export default MultiStopLocationSelector;

