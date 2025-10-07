import googleMapsService from './googleMapsService';

/**
 * RouteOptimizationService
 * Handles multi-stop route optimization and calculations
 * Integrates with Google Maps Directions API for optimal route planning
 */
class RouteOptimizationService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Optimize route for multi-stop ride
   * @param {Object} pickup - Pickup location { address, coordinates, placeId }
   * @param {Array} stops - Array of stop locations
   * @param {Object} finalDestination - Optional final destination
   * @param {Object} options - Route optimization options
   * @returns {Object} Optimized route with stop order, distances, and durations
   */
  async optimizeRoute(pickup, stops = [], finalDestination = null, options = {}) {
    try {
      // Validate inputs
      if (!pickup || !pickup.coordinates) {
        throw new Error('Invalid pickup location');
      }

      if (!stops || stops.length === 0) {
        // If no stops, treat finalDestination as single destination
        if (finalDestination) {
          return this._calculateSimpleRoute(pickup, finalDestination, options);
        }
        throw new Error('At least one stop or final destination is required');
      }

      if (stops.length > 5) {
        throw new Error('Maximum 5 stops allowed per ride');
      }

      // Generate cache key
      const cacheKey = this._generateCacheKey(pickup, stops, finalDestination);
      
      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          console.log('✅ Using cached route optimization');
          return cached.data;
        }
      }

      // Load Google Maps API
      await googleMapsService.loadGoogleMapsAPI();
      const { google } = window;
      const directionsService = new google.maps.DirectionsService();

      // Prepare waypoints (intermediate stops)
      const waypoints = stops.map(stop => ({
        location: {
          lat: stop.coordinates.lat,
          lng: stop.coordinates.lng
        },
        stopover: true
      }));

      // Determine final destination
      const destination = finalDestination || stops[stops.length - 1];

      // If finalDestination exists and is different from last stop, add it
      if (finalDestination && stops.length > 0) {
        // Remove last stop from waypoints and use finalDestination as destination
        // (waypoints will be all stops, destination will be finalDestination)
      } else if (!finalDestination && stops.length > 0) {
        // Last stop becomes destination, remove it from waypoints
        waypoints.pop();
      }

      // Build directions request
      const request = {
        origin: {
          lat: pickup.coordinates.lat,
          lng: pickup.coordinates.lng
        },
        destination: {
          lat: destination.coordinates.lat,
          lng: destination.coordinates.lng
        },
        waypoints: waypoints,
        optimizeWaypoints: options.optimizeOrder !== false, // Default to true
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: options.departureTime || new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        },
        avoidHighways: options.avoidHighways || false,
        avoidTolls: options.avoidTolls || false
      };

      // Get directions
      const result = await new Promise((resolve, reject) => {
        directionsService.route(request, (response, status) => {
          if (status === 'OK') {
            resolve(response);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      // Process the optimized route
      const optimizedRoute = this._processDirectionsResult(
        result, 
        pickup, 
        stops, 
        finalDestination,
        options
      );

      // Cache the result
      this.cache.set(cacheKey, {
        data: optimizedRoute,
        timestamp: Date.now()
      });

      console.log('✅ Route optimized successfully:', optimizedRoute);
      return optimizedRoute;

    } catch (error) {
      console.error('❌ Route optimization failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: this._generateFallbackRoute(pickup, stops, finalDestination)
      };
    }
  }

  /**
   * Process Google Directions API result into our route format
   * @private
   */
  _processDirectionsResult(result, pickup, stops, finalDestination, options) {
    const route = result.routes[0];
    const legs = route.legs;

    // Build optimized stop order
    const waypointOrder = route.waypoint_order || [];

    // Calculate stop details with ETAs
    let cumulativeTime = 0;
    let cumulativeDistance = 0;
    const stopDetails = [];

    legs.forEach((leg, index) => {
      cumulativeDistance += leg.distance.value; // meters
      cumulativeTime += leg.duration.value; // seconds

      if (index < legs.length - 1 || !finalDestination) {
        // This is a stop (not final destination)
        const stopIndex = waypointOrder[index] || index;
        const stop = stops[stopIndex];

        stopDetails.push({
          id: stop.id || `stop_${index + 1}`,
          address: stop.address,
          coordinates: stop.coordinates,
          placeId: stop.placeId,
          order: index + 1,
          estimatedArrival: new Date(Date.now() + cumulativeTime * 1000).toISOString(),
          distance: leg.distance.value,
          duration: leg.duration.value,
          distanceText: leg.distance.text,
          durationText: leg.duration.text,
          specialInstructions: stop.specialInstructions || null,
          contactInfo: stop.contactInfo || null,
          completed: false
        });
      }
    });

    // Total distance and duration
    const totalDistance = cumulativeDistance / 1609.34; // Convert to miles
    const totalDuration = cumulativeTime / 60; // Convert to minutes

    // Calculate wait time allowance (5 min per stop from the compensation model)
    const graceWaitTimePerStop = 5; // minutes
    const totalWaitTimeAllowance = stopDetails.length * graceWaitTimePerStop;

    return {
      success: true,
      pickup: {
        address: pickup.address,
        coordinates: pickup.coordinates,
        placeId: pickup.placeId
      },
      stops: stopDetails,
      finalDestination: finalDestination ? {
        address: finalDestination.address,
        coordinates: finalDestination.coordinates,
        placeId: finalDestination.placeId,
        estimatedArrival: new Date(Date.now() + cumulativeTime * 1000).toISOString()
      } : stopDetails[stopDetails.length - 1],
      optimizedOrder: waypointOrder,
      totalDistance: Math.round(totalDistance * 100) / 100, // miles
      totalDuration: Math.round(totalDuration), // minutes
      totalDurationWithWait: Math.round(totalDuration + totalWaitTimeAllowance), // includes grace wait time
      routePolyline: route.overview_polyline,
      bounds: route.bounds,
      warnings: route.warnings || [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate simple route (pickup to single destination, no stops)
   * @private
   */
  async _calculateSimpleRoute(pickup, destination, options = {}) {
    try {
      await googleMapsService.loadGoogleMapsAPI();
      const { google } = window;
      const directionsService = new google.maps.DirectionsService();

      const request = {
        origin: {
          lat: pickup.coordinates.lat,
          lng: pickup.coordinates.lng
        },
        destination: {
          lat: destination.coordinates.lat,
          lng: destination.coordinates.lng
        },
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: options.departureTime || new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        },
        avoidHighways: options.avoidHighways || false,
        avoidTolls: options.avoidTolls || false
      };

      const result = await new Promise((resolve, reject) => {
        directionsService.route(request, (response, status) => {
          if (status === 'OK') {
            resolve(response);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      const route = result.routes[0];
      const leg = route.legs[0];

      return {
        success: true,
        pickup: {
          address: pickup.address,
          coordinates: pickup.coordinates,
          placeId: pickup.placeId
        },
        stops: [],
        finalDestination: {
          address: destination.address,
          coordinates: destination.coordinates,
          placeId: destination.placeId,
          estimatedArrival: new Date(Date.now() + leg.duration.value * 1000).toISOString()
        },
        optimizedOrder: [],
        totalDistance: Math.round((leg.distance.value / 1609.34) * 100) / 100, // miles
        totalDuration: Math.round(leg.duration.value / 60), // minutes
        totalDurationWithWait: Math.round(leg.duration.value / 60), // no stops
        routePolyline: route.overview_polyline,
        bounds: route.bounds,
        warnings: route.warnings || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Simple route calculation failed:', error);
      throw error;
    }
  }

  /**
   * Generate fallback route when optimization fails
   * @private
   */
  _generateFallbackRoute(pickup, stops, finalDestination) {
    // Simple fallback: use stops in the order provided
    const estimatedSpeedMph = 30; // Assume 30 mph average
    const estimatedTimePerStopMin = 10; // Assume 10 min per stop

    let cumulativeDistance = 0;
    let cumulativeTime = 0;

    const stopDetails = stops.map((stop, index) => {
      // Rough distance calculation (straight line * 1.3 for road factor)
      const prevLocation = index === 0 ? pickup : stops[index - 1];
      const distance = this._calculateStraightLineDistance(
        prevLocation.coordinates,
        stop.coordinates
      ) * 1.3;

      cumulativeDistance += distance;
      cumulativeTime += (distance / estimatedSpeedMph) * 60 + estimatedTimePerStopMin;

      return {
        id: stop.id || `stop_${index + 1}`,
        address: stop.address,
        coordinates: stop.coordinates,
        placeId: stop.placeId,
        order: index + 1,
        estimatedArrival: new Date(Date.now() + cumulativeTime * 60 * 1000).toISOString(),
        distance: distance,
        duration: (distance / estimatedSpeedMph) * 60,
        distanceText: `${distance.toFixed(1)} mi`,
        durationText: `${Math.round((distance / estimatedSpeedMph) * 60)} min`,
        specialInstructions: stop.specialInstructions || null,
        contactInfo: stop.contactInfo || null,
        completed: false,
        isFallback: true
      };
    });

    return {
      success: false,
      isFallback: true,
      pickup: pickup,
      stops: stopDetails,
      finalDestination: finalDestination || stopDetails[stopDetails.length - 1],
      optimizedOrder: stops.map((_, index) => index),
      totalDistance: Math.round(cumulativeDistance * 100) / 100,
      totalDuration: Math.round(cumulativeTime),
      totalDurationWithWait: Math.round(cumulativeTime + (stops.length * 5)),
      routePolyline: null,
      bounds: null,
      warnings: ['Using fallback route calculation - actual route may differ'],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate straight-line distance between two coordinates
   * @private
   */
  _calculateStraightLineDistance(coord1, coord2) {
    const R = 3959; // Earth radius in miles
    const dLat = this._toRad(coord2.lat - coord1.lat);
    const dLon = this._toRad(coord2.lng - coord1.lng);
    const lat1 = this._toRad(coord1.lat);
    const lat2 = this._toRad(coord2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @private
   */
  _toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate cache key for route
   * @private
   */
  _generateCacheKey(pickup, stops, finalDestination) {
    const pickupKey = `${pickup.coordinates.lat},${pickup.coordinates.lng}`;
    const stopsKey = stops.map(s => `${s.coordinates.lat},${s.coordinates.lng}`).join('|');
    const destKey = finalDestination 
      ? `${finalDestination.coordinates.lat},${finalDestination.coordinates.lng}`
      : '';
    return `${pickupKey}_${stopsKey}_${destKey}`;
  }

  /**
   * Clear route cache
   */
  clearCache() {
    this.cache.clear();
    console.log('✅ Route optimization cache cleared');
  }
}

// Export singleton instance
const routeOptimizationService = new RouteOptimizationService();
export default routeOptimizationService;

