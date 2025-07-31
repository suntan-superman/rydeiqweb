// Ride Map Service
// Handles ride-specific map functionality and real-time tracking

import { googleMapsService } from './googleMapsService';

class RideMapService {
  constructor() {
    this.trackingInterval = null;
    this.locationWatcher = null;
    this.currentRideId = null;
    this.onLocationUpdate = null;
    this.isTracking = false;
  }

  // Initialize ride tracking
  async initializeRideTracking(rideId, onLocationUpdate) {
    try {
      this.currentRideId = rideId;
      this.onLocationUpdate = onLocationUpdate;
      
      // Load Google Maps API if not already loaded
      await googleMapsService.loadGoogleMapsAPI();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize ride tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Start real-time location tracking with enhanced features
  startLocationTracking(updateInterval = 5000) {
    if (this.isTracking) {
      console.warn('Location tracking already active');
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    this.isTracking = true;
    this.lastLocation = null;
    this.locationHistory = [];
    this.routeDeviations = [];
    this.geofenceEvents = [];

    // Enhanced location tracking with multiple options
    const locationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    // Watch for location changes
    this.locationWatcher = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed || null,
          heading: position.coords.heading || null,
          altitude: position.coords.altitude || null,
          altitudeAccuracy: position.coords.altitudeAccuracy || null
        };

        // Process location update
        this.processLocationUpdate(location);

        // Call the update callback
        if (this.onLocationUpdate) {
          this.onLocationUpdate(location);
        }

        // Update Firebase with current location
        this.updateLocationInFirebase(location);
      },
      (error) => {
        console.error('Location tracking error:', error);
        this.handleLocationError(error);
      },
      locationOptions
    );

    // Start periodic location analytics
    this.startLocationAnalytics();

    console.log('Enhanced location tracking started');
  }

  // Process location update with advanced features
  processLocationUpdate(location) {
    // Add to location history (keep last 100 points)
    this.locationHistory.push(location);
    if (this.locationHistory.length > 100) {
      this.locationHistory.shift();
    }

    // Check for route deviations
    if (this.lastLocation && this.expectedRoute) {
      const deviation = this.checkRouteDeviation(location);
      if (deviation.isDeviated) {
        this.routeDeviations.push({
          location,
          deviation: deviation.distance,
          timestamp: Date.now()
        });
      }
    }

    // Check geofence events
    this.checkGeofenceEvents(location);

    // Update last location
    this.lastLocation = location;
  }

  // Check for route deviations
  checkRouteDeviation(location) {
    if (!this.expectedRoute || !this.lastLocation) {
      return { isDeviated: false, distance: 0 };
    }

    // Find nearest point on expected route
    let minDistance = Infinity;
    let nearestPoint = null;

    for (const routePoint of this.expectedRoute) {
      const distance = this.calculateDistance(location, routePoint);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = routePoint;
      }
    }

    // Consider deviation if more than 100 meters from route
    const isDeviated = minDistance > 100;
    
    return {
      isDeviated,
      distance: minDistance,
      nearestPoint
    };
  }

  // Check geofence events
  checkGeofenceEvents(location) {
    if (!this.geofences) return;

    for (const geofence of this.geofences) {
      const distance = this.calculateDistance(location, geofence.center);
      const isInside = distance <= geofence.radius;

      if (isInside && !geofence.isInside) {
        // Entered geofence
        this.geofenceEvents.push({
          type: 'enter',
          geofence: geofence.name,
          location,
          timestamp: Date.now()
        });
        geofence.isInside = true;
      } else if (!isInside && geofence.isInside) {
        // Exited geofence
        this.geofenceEvents.push({
          type: 'exit',
          geofence: geofence.name,
          location,
          timestamp: Date.now()
        });
        geofence.isInside = false;
      }
    }
  }

  // Handle location errors
  handleLocationError(error) {
    console.error('Location tracking error:', error);
    
    // Log error for analytics
    this.logLocationError(error);
    
    // Attempt to recover based on error type
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('Location permission denied');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('Location information unavailable');
        break;
      case error.TIMEOUT:
        console.error('Location request timeout');
        // Retry with lower accuracy
        this.retryWithLowerAccuracy();
        break;
      default:
        console.error('Unknown location error');
    }

    this.isTracking = false;
  }

  // Retry location tracking with lower accuracy
  retryWithLowerAccuracy() {
    if (this.locationWatcher) {
      navigator.geolocation.clearWatch(this.locationWatcher);
    }

    this.locationWatcher = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed || null,
          heading: position.coords.heading || null
        };

        if (this.onLocationUpdate) {
          this.onLocationUpdate(location);
        }

        this.updateLocationInFirebase(location);
      },
      (error) => {
        console.error('Location retry failed:', error);
        this.isTracking = false;
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  }

  // Start location analytics
  startLocationAnalytics() {
    this.analyticsInterval = setInterval(() => {
      this.generateLocationAnalytics();
    }, 30000); // Every 30 seconds
  }

  // Generate location analytics
  generateLocationAnalytics() {
    if (this.locationHistory.length < 2) return;

    const analytics = {
      totalDistance: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      routeEfficiency: 0,
      stopTime: 0,
      timestamp: Date.now()
    };

    // Calculate total distance and speed
    for (let i = 1; i < this.locationHistory.length; i++) {
      const prev = this.locationHistory[i - 1];
      const curr = this.locationHistory[i];
      
      const distance = this.calculateDistance(prev, curr);
      analytics.totalDistance += distance;

      if (curr.speed) {
        analytics.averageSpeed += curr.speed;
        analytics.maxSpeed = Math.max(analytics.maxSpeed, curr.speed);
      }
    }

    analytics.averageSpeed = analytics.averageSpeed / this.locationHistory.length;

    // Calculate route efficiency
    if (this.expectedRoute && this.expectedRoute.length > 0) {
      const expectedDistance = this.calculateRouteDistance(this.expectedRoute);
      analytics.routeEfficiency = expectedDistance > 0 ? 
        (analytics.totalDistance / expectedDistance) * 100 : 100;
    }

    // Store analytics
    this.currentAnalytics = analytics;
    
    // Send to Firebase for tracking
    this.updateAnalyticsInFirebase(analytics);
  }

  // Stop location tracking
  stopLocationTracking() {
    if (this.locationWatcher) {
      navigator.geolocation.clearWatch(this.locationWatcher);
      this.locationWatcher = null;
    }

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
      this.analyticsInterval = null;
    }

    this.isTracking = false;
    this.currentRideId = null;
    this.onLocationUpdate = null;
    this.locationHistory = [];
    this.routeDeviations = [];
    this.geofenceEvents = [];
    this.currentAnalytics = null;

    console.log('Enhanced location tracking stopped');
  }

  // Update location in Firebase
  async updateLocationInFirebase(location) {
    if (!this.currentRideId) return;

    try {
      // Import Firebase dynamically to avoid module-level imports
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase');

      await updateDoc(doc(db, 'rides', this.currentRideId), {
        currentLocation: location,
        lastLocationUpdate: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to update location in Firebase:', error);
    }
  }

  // Calculate optimal route for ride
  async calculateOptimalRoute(origin, destination, options = {}) {
    try {
      await googleMapsService.loadGoogleMapsAPI();

      const { google } = window;
      const directionsService = new google.maps.DirectionsService();

      const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        avoidHighways: options.avoidHighways || false,
        avoidTolls: options.avoidTolls || false,
        optimizeWaypoints: options.optimizeWaypoints || false
      };

      return new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            const routes = result.routes.map(route => ({
              summary: route.summary,
              distance: route.legs[0].distance,
              duration: route.legs[0].duration,
              durationInTraffic: route.legs[0].duration_in_traffic,
              polyline: route.overview_polyline,
              warnings: route.warnings || [],
              waypointOrder: route.waypoint_order || []
            }));

            resolve({
              success: true,
              routes: routes,
              selectedRoute: routes[0] // Default to first route
            });
          } else {
            reject(new Error(`Route calculation failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Failed to calculate optimal route:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate ETA based on current traffic
  async calculateETA(origin, destination, departureTime = 'now') {
    try {
      await googleMapsService.loadGoogleMapsAPI();

      const { google } = window;
      const directionsService = new google.maps.DirectionsService();

      const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        departureTime: departureTime === 'now' ? new Date() : new Date(departureTime),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      };

      return new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            const leg = result.routes[0].legs[0];
            resolve({
              success: true,
              duration: leg.duration,
              durationInTraffic: leg.duration_in_traffic,
              distance: leg.distance,
              startLocation: leg.start_location.toJSON(),
              endLocation: leg.end_location.toJSON()
            });
          } else {
            reject(new Error(`ETA calculation failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Failed to calculate ETA:', error);
      return { success: false, error: error.message };
    }
  }

  // Get nearby drivers
  async getNearbyDrivers(location, radius = 5000) {
    try {
      // Import Firebase dynamically
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('./firebase');

      // Create a bounding box for the search area
      const lat = location.lat;
      const lng = location.lng;
      const latDelta = radius / 111320; // Approximate meters per degree latitude
      const lngDelta = radius / (111320 * Math.cos(lat * Math.PI / 180));

      const driversQuery = query(
        collection(db, 'drivers'),
        where('isOnline', '==', true),
        where('currentLocation.lat', '>=', lat - latDelta),
        where('currentLocation.lat', '<=', lat + latDelta),
        where('currentLocation.lng', '>=', lng - lngDelta),
        where('currentLocation.lng', '<=', lng + lngDelta)
      );

      const snapshot = await getDocs(driversQuery);
      const drivers = [];

      snapshot.forEach(doc => {
        const driverData = doc.data();
        const distance = this.calculateDistance(location, driverData.currentLocation);
        
        if (distance <= radius) {
          drivers.push({
            id: doc.id,
            ...driverData,
            distance: distance
          });
        }
      });

      // Sort by distance
      drivers.sort((a, b) => a.distance - b.distance);

      return {
        success: true,
        drivers: drivers,
        count: drivers.length
      };
    } catch (error) {
      console.error('Failed to get nearby drivers:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate distance between two points
  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Check if location is within pickup/dropoff radius
  isWithinRadius(location, targetLocation, radius = 50) {
    const distance = this.calculateDistance(location, targetLocation);
    return distance <= radius;
  }

  // Get geofence status for ride
  getGeofenceStatus(driverLocation, pickupLocation, dropoffLocation) {
    const pickupRadius = 50; // 50 meters
    const dropoffRadius = 50; // 50 meters

    const nearPickup = this.isWithinRadius(driverLocation, pickupLocation, pickupRadius);
    const nearDropoff = this.isWithinRadius(driverLocation, dropoffLocation, dropoffRadius);

    return {
      nearPickup,
      nearDropoff,
      pickupDistance: this.calculateDistance(driverLocation, pickupLocation),
      dropoffDistance: this.calculateDistance(driverLocation, dropoffLocation)
    };
  }

  // Create heat map data for demand analysis
  async createDemandHeatmap(bounds, timeRange = '24h') {
    try {
      // Import Firebase dynamically
      const { collection, query, where, getDocs, Timestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase');

      const now = new Date();
      const timeAgo = new Date(now.getTime() - this.getTimeRangeInMs(timeRange));

      const ridesQuery = query(
        collection(db, 'rides'),
        where('createdAt', '>=', Timestamp.fromDate(timeAgo)),
        where('status', 'in', ['completed', 'in_progress'])
      );

      const snapshot = await getDocs(ridesQuery);
      const heatmapData = [];

      snapshot.forEach(doc => {
        const rideData = doc.data();
        if (rideData.pickup?.location) {
          heatmapData.push({
            location: new window.google.maps.LatLng(
              rideData.pickup.location.lat,
              rideData.pickup.location.lng
            ),
            weight: 1
          });
        }
      });

      return {
        success: true,
        data: heatmapData,
        count: heatmapData.length
      };
    } catch (error) {
      console.error('Failed to create demand heatmap:', error);
      return { success: false, error: error.message };
    }
  }

  // Get time range in milliseconds
  getTimeRangeInMs(timeRange) {
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    const week = 7 * day;

    switch (timeRange) {
      case '1h': return hour;
      case '6h': return 6 * hour;
      case '24h': return day;
      case '7d': return week;
      default: return day;
    }
  }

  // Emergency location sharing
  async shareEmergencyLocation(location, rideId) {
    try {
      // Import Firebase dynamically
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase');

      await updateDoc(doc(db, 'rides', rideId), {
        emergencyLocation: location,
        emergencyTimestamp: serverTimestamp(),
        emergencyActive: true
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to share emergency location:', error);
      return { success: false, error: error.message };
    }
  }

  // Get map styling for different themes
  getMapStyling(theme = 'default') {
    const styles = {
      default: [],
      night: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#263c3f' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6b9a76' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38414e' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#212a37' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9ca5b3' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#746855' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1f2835' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#f3d19c' }]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#2f3948' }]
        },
        {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#515c6d' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#17263c' }]
        }
      ],
      minimal: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'landscape', elementType: 'labels', stylers: [{ visibility: 'off' }] }
      ]
    };

    return styles[theme] || styles.default;
  }

  // Calculate route distance
  calculateRouteDistance(routePoints) {
    if (!routePoints || routePoints.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < routePoints.length; i++) {
      totalDistance += this.calculateDistance(routePoints[i - 1], routePoints[i]);
    }
    return totalDistance;
  }

  // Set expected route for deviation detection
  setExpectedRoute(routePoints) {
    this.expectedRoute = routePoints;
  }

  // Set geofences for monitoring
  setGeofences(geofences) {
    this.geofences = geofences.map(geofence => ({
      ...geofence,
      isInside: false
    }));
  }

  // Get location analytics
  getLocationAnalytics() {
    return this.currentAnalytics;
  }

  // Get route deviations
  getRouteDeviations() {
    return this.routeDeviations;
  }

  // Get geofence events
  getGeofenceEvents() {
    return this.geofenceEvents;
  }

  // Get location history
  getLocationHistory() {
    return this.locationHistory;
  }

  // Log location error for analytics
  async logLocationError(error) {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      const errorLog = {
        rideId: this.currentRideId,
        error: {
          code: error.code,
          message: error.message
        },
        timestamp: serverTimestamp(),
        location: this.lastLocation
      };

      const errorsRef = collection(db, 'locationErrors');
      await addDoc(errorsRef, errorLog);
    } catch (err) {
      console.error('Failed to log location error:', err);
    }
  }

  // Update analytics in Firebase
  async updateAnalyticsInFirebase(analytics) {
    if (!this.currentRideId) return;

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      const rideRef = doc(db, 'rides', this.currentRideId);
      await updateDoc(rideRef, {
        locationAnalytics: analytics,
        lastAnalyticsUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update analytics in Firebase:', error);
    }
  }

  // Get real-time location from Firebase
  async getRealTimeLocation(rideId) {
    try {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      const rideRef = doc(db, 'rides', rideId);
      
      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(rideRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (data.currentLocation) {
              resolve(data.currentLocation);
            }
          }
        }, (error) => {
          reject(error);
        });

        // Return unsubscribe function
        return unsubscribe;
      });
    } catch (error) {
      console.error('Failed to get real-time location:', error);
      throw error;
    }
  }

  // Start background location tracking (for mobile apps)
  startBackgroundTracking() {
    // This would integrate with mobile app background location services
    // For web, we'll use a more aggressive tracking approach
    if ('serviceWorker' in navigator) {
      // Register service worker for background tracking
      navigator.serviceWorker.register('/location-worker.js')
        .then(registration => {
          console.log('Background location tracking registered');
        })
        .catch(error => {
          console.error('Background tracking registration failed:', error);
        });
    }
  }

  // Optimize location tracking for battery life
  optimizeForBattery() {
    // Reduce update frequency and accuracy for battery optimization
    if (this.locationWatcher) {
      navigator.geolocation.clearWatch(this.locationWatcher);
    }

    this.locationWatcher = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        if (this.onLocationUpdate) {
          this.onLocationUpdate(location);
        }

        this.updateLocationInFirebase(location);
      },
      (error) => {
        console.error('Battery-optimized location error:', error);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 120000 // 2 minutes
      }
    );
  }

  // Cleanup resources
  cleanup() {
    this.stopLocationTracking();
  }
}

// Create and export a singleton instance
export const rideMapService = new RideMapService();
export default rideMapService; 