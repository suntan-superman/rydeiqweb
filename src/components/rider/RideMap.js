import React, { useEffect, useRef, useState, useCallback } from 'react';
import { googleMapsService } from '../../services/googleMapsService';

const RideMap = ({ 
  pickup, 
  destination, 
  driverLocation, 
  rideStatus = 'requesting',
  onMapReady,
  className = "h-64 md:h-80"
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  const initializeMap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Google Maps API is available
      if (!googleMapsService.isApiKeyAvailable()) {
        throw new Error('Google Maps API key not configured');
      }

      // Load Google Maps API
      await googleMapsService.loadGoogleMapsAPI();

      // Initialize map
      const mapOptions = {
        zoom: 13,
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        mapId: googleMapsService.getConfig().mapId,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      // Set center based on pickup location if available
      if (pickup?.location) {
        mapOptions.center = pickup.location;
        mapOptions.zoom = 15;
      }

      const map = await googleMapsService.initializeMap(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Initialize services
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll add our own markers
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      directionsRendererRef.current.setMap(map);

      // Initialize markers object
      markersRef.current = {};

      setMapReady(true);
      setIsLoading(false);

      // Call onMapReady callback if provided
      if (onMapReady) {
        onMapReady(map);
      }

    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [pickup, onMapReady]);

  // Add or update markers
  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    const map = mapInstanceRef.current;
    const { google } = window;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = {};

    // Add pickup marker
    if (pickup?.location) {
      const pickupMarker = new google.maps.Marker({
        position: pickup.location,
        map: map,
        title: 'Pickup Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#10B981" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });

      // Add pickup info window
      const pickupInfoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <div class="font-medium text-green-600">Pickup Location</div>
            <div class="text-sm text-gray-600">${pickup.address}</div>
          </div>
        `
      });

      pickupMarker.addListener('click', () => {
        pickupInfoWindow.open(map, pickupMarker);
      });

      markersRef.current.pickup = pickupMarker;
    }

    // Add destination marker
    if (destination?.location) {
      const destinationMarker = new google.maps.Marker({
        position: destination.location,
        map: map,
        title: 'Destination',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#EF4444" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });

      // Add destination info window
      const destinationInfoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <div class="font-medium text-red-600">Destination</div>
            <div class="text-sm text-gray-600">${destination.address}</div>
          </div>
        `
      });

      destinationMarker.addListener('click', () => {
        destinationInfoWindow.open(map, destinationMarker);
      });

      markersRef.current.destination = destinationMarker;
    }

    // Add driver marker
    if (driverLocation && rideStatus !== 'requesting') {
      const driverMarker = new google.maps.Marker({
        position: driverLocation,
        map: map,
        title: 'Driver Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="white" stroke-width="2"/>
              <path d="M16 8 L20 16 L16 24 L12 16 Z" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      // Add driver info window
      const driverInfoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <div class="font-medium text-blue-600">Driver Location</div>
            <div class="text-sm text-gray-600">Live tracking active</div>
          </div>
        `
      });

      driverMarker.addListener('click', () => {
        driverInfoWindow.open(map, driverMarker);
      });

      markersRef.current.driver = driverMarker;
    }

    // Fit bounds to show all markers
    if (Object.keys(markersRef.current).length > 0) {
      const bounds = new google.maps.LatLngBounds();
      Object.values(markersRef.current).forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      map.fitBounds(bounds);
      
      // Add some padding to bounds
      map.setZoom(Math.min(map.getZoom(), 16));
    }
  }, [pickup, destination, driverLocation, rideStatus, mapReady]);

  // Update route
  const updateRoute = useCallback(() => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !pickup?.location || !destination?.location) {
      return;
    }

    const request = {
      origin: pickup.location,
      destination: destination.location,
      travelMode: window.google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: false
    };

    directionsServiceRef.current.route(request, (result, status) => {
      if (status === 'OK') {
        directionsRendererRef.current.setDirections(result);
      } else {
        console.warn('Directions request failed:', status);
      }
    });
  }, [pickup, destination]);

  // Initialize map on mount
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update markers when locations change
  useEffect(() => {
    if (mapReady) {
      updateMarkers();
    }
  }, [updateMarkers, mapReady]);

  // Update route when pickup/destination change
  useEffect(() => {
    if (mapReady) {
      updateRoute();
    }
  }, [updateRoute, mapReady]);

  // Handle driver location updates
  useEffect(() => {
    if (mapReady && driverLocation && markersRef.current.driver) {
      markersRef.current.driver.setPosition(driverLocation);
    }
  }, [driverLocation, mapReady]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-gray-600">Map unavailable</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button 
            onClick={initializeMap}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Map container
  return (
    <div className={`${className} relative`}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg shadow-sm border border-gray-200"
      />
      
      {/* Map controls overlay */}
      {mapReady && (
        <div className="absolute top-2 right-2 space-y-2">
          {/* Center on pickup */}
          {pickup?.location && (
            <button
              onClick={() => {
                mapInstanceRef.current?.panTo(pickup.location);
                mapInstanceRef.current?.setZoom(15);
              }}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title="Center on pickup"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          
          {/* Center on driver */}
          {driverLocation && rideStatus !== 'requesting' && (
            <button
              onClick={() => {
                mapInstanceRef.current?.panTo(driverLocation);
                mapInstanceRef.current?.setZoom(16);
              }}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title="Center on driver"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      {/* Status indicator */}
      <div className="absolute bottom-2 left-2">
        <div className="bg-white px-3 py-1 rounded-lg shadow-md text-sm">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
            rideStatus === 'requesting' ? 'bg-yellow-400' :
            rideStatus === 'accepted' ? 'bg-green-400' :
            rideStatus === 'in_progress' ? 'bg-blue-400' :
            'bg-gray-400'
          }`}></span>
          {rideStatus === 'requesting' ? 'Finding driver...' :
           rideStatus === 'accepted' ? 'Driver en route' :
           rideStatus === 'in_progress' ? 'Ride in progress' :
           'Ride completed'}
        </div>
      </div>
    </div>
  );
};

export default RideMap; 