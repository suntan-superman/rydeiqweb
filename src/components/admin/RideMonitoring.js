import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';

// Define icon paths for custom markers
const ICON_PATHS = {
  driver: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  passenger: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
};

// Helper function to get anchor point
const getAnchorPoint = (isLoaded) => {
  if (!isLoaded || !window.google) {
    return { x: 12, y: 12 };
  }
  return new window.google.maps.Point(12, 12);
};

// Define libraries
const LIBRARIES = ['places'];

const mapContainerStyle = {
  width: "100%",
  height: "400px"
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

const defaultZoom = 12;

const defaultMapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: true,
  rotateControl: false,
  fullscreenControl: true,
};

// Mock data for active rides
const mockActiveRides = [
  {
    id: 'R001',
    driverName: 'John Smith',
    passengerName: 'Sarah Johnson',
    status: 'pickup',
    pickup: { lat: 40.7589, lng: -73.9851 }, // Times Square
    destination: { lat: 40.7505, lng: -73.9934 }, // Penn Station
    currentLocation: { lat: 40.7589, lng: -73.9851 },
    estimatedArrival: '5 min',
    fare: '$25.50',
    driverId: 'D001',
    passengerId: 'P001'
  },
  {
    id: 'R002',
    driverName: 'Maria Garcia',
    passengerName: 'David Wilson',
    status: 'in_progress',
    pickup: { lat: 40.7484, lng: -73.9857 }, // Empire State Building
    destination: { lat: 40.7527, lng: -73.9772 }, // Grand Central Terminal
    currentLocation: { lat: 40.7505, lng: -73.9814 },
    estimatedArrival: '8 min',
    fare: '$18.75',
    driverId: 'D002',
    passengerId: 'P002'
  },
  {
    id: 'R003',
    driverName: 'Mike Chen',
    passengerName: 'Lisa Brown',
    status: 'pickup',
    pickup: { lat: 40.7614, lng: -73.9776 }, // Rockefeller Center
    destination: { lat: 40.7589, lng: -73.9851 }, // Times Square
    currentLocation: { lat: 40.7614, lng: -73.9776 },
    estimatedArrival: '3 min',
    fare: '$12.00',
    driverId: 'D003',
    passengerId: 'P003'
  }
];



// Sample drivers and passengers for markers
const sampleDrivers = [
  { id: 'D001', name: 'John Smith', location: { lat: 40.7589, lng: -73.9851 }, status: 'available' },
  { id: 'D002', name: 'Maria Garcia', location: { lat: 40.7505, lng: -73.9814 }, status: 'busy' },
  { id: 'D003', name: 'Mike Chen', location: { lat: 40.7614, lng: -73.9776 }, status: 'available' },
  { id: 'D004', name: 'Alex Rodriguez', location: { lat: 40.7484, lng: -73.9857 }, status: 'available' },
  { id: 'D005', name: 'Jennifer Lee', location: { lat: 40.7527, lng: -73.9772 }, status: 'available' }
];

const samplePassengers = [
  { id: 'P001', name: 'Sarah Johnson', location: { lat: 40.7589, lng: -73.9851 }, status: 'waiting' },
  { id: 'P002', name: 'David Wilson', location: { lat: 40.7505, lng: -73.9814 }, status: 'in_ride' },
  { id: 'P003', name: 'Lisa Brown', location: { lat: 40.7614, lng: -73.9776 }, status: 'waiting' },
  { id: 'P004', name: 'Emma Davis', location: { lat: 40.7484, lng: -73.9857 }, status: 'completed' },
  { id: 'P005', name: 'Robert Taylor', location: { lat: 40.7527, lng: -73.9772 }, status: 'completed' }
];

const RideMonitoring = () => {
  console.log('RideMonitoring: Component rendering');
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });
  
  const [loading, setLoading] = useState(false);
  const [activeRides, setActiveRides] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  
  // Map ref
  const mapRef = useRef(null);
  
  // Load active rides
  const loadActiveRides = useCallback(async () => {
    console.log('RideMonitoring: loadActiveRides called');
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      
      // Mock data for now
      setTimeout(() => {
        console.log('RideMonitoring: Setting mock data');
        setActiveRides(mockActiveRides);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading active rides:', error);
      setLoading(false);
    }
  }, []);

  // Handle map load
  const handleMapLoad = useCallback((map) => {
    console.log('RideMonitoring: Map loaded');
    mapRef.current = map;
  }, []);

  // Load active rides on component mount
  useEffect(() => {
    console.log('RideMonitoring: loadActiveRides useEffect triggered');
    loadActiveRides();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadActiveRides, 30000);
    return () => clearInterval(interval);
  }, [loadActiveRides]);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading ride monitoring...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ride Monitoring</h2>
          <p className="text-gray-600">Monitor active rides and driver locations in real-time</p>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Live Map</h3>
          <p className="text-sm text-gray-600">
            {isLoaded ? 'Map is ready' : 'Loading map...'}
          </p>
        </div>
        <div className="p-4">
          {!isLoaded ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading map...</span>
            </div>
          ) : (
            <div className="relative">
              {/* Legend */}
              <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md border p-3 min-w-[200px]">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Map Legend</h4>
                <div className="space-y-2">
                  {/* Driver Legend */}
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981">
                        <path d={ICON_PATHS.driver} />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700">Available Driver</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B">
                        <path d={ICON_PATHS.driver} />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700">Busy Driver</span>
                  </div>
                  
                  {/* Passenger Legend */}
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444">
                        <path d={ICON_PATHS.passenger} />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700">Waiting Passenger</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#3B82F6">
                        <path d={ICON_PATHS.passenger} />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700">In Ride</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#6B7280">
                        <path d={ICON_PATHS.passenger} />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700">Completed</span>
                  </div>
                </div>
              </div>

              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={defaultZoom}
                onLoad={handleMapLoad}
                options={defaultMapOptions}
              >
                {/* Driver Markers */}
                {sampleDrivers.map((driver) => (
                  <MarkerF
                    key={driver.id}
                    position={driver.location}
                    onClick={() => setSelectedDriver(driver)}
                    icon={{
                      path: ICON_PATHS.driver,
                      fillColor: driver.status === 'available' ? '#10B981' : '#F59E0B',
                      fillOpacity: 1,
                      strokeWeight: 1,
                      strokeColor: '#000000',
                      scale: 1.5,
                      anchor: getAnchorPoint(isLoaded)
                    }}
                  />
                ))}

                {/* Passenger Markers */}
                {samplePassengers.map((passenger) => (
                  <MarkerF
                    key={passenger.id}
                    position={passenger.location}
                    onClick={() => setSelectedPassenger(passenger)}
                    icon={{
                      path: ICON_PATHS.passenger,
                      fillColor: passenger.status === 'waiting' ? '#EF4444' : passenger.status === 'in_ride' ? '#3B82F6' : '#6B7280',
                      fillOpacity: 1,
                      strokeWeight: 1,
                      strokeColor: '#000000',
                      scale: 1.5,
                      anchor: getAnchorPoint(isLoaded)
                    }}
                  />
                ))}

                {/* Driver Info Window */}
                {selectedDriver && (
                  <InfoWindowF
                    position={selectedDriver.location}
                    onCloseClick={() => setSelectedDriver(null)}
                  >
                    <div>
                      <h3 className="font-semibold text-sm">{selectedDriver.name}</h3>
                      <p className="text-xs text-gray-600">Driver ID: {selectedDriver.id}</p>
                      <p className="text-xs text-gray-600">Status: {selectedDriver.status}</p>
                    </div>
                  </InfoWindowF>
                )}

                {/* Passenger Info Window */}
                {selectedPassenger && (
                  <InfoWindowF
                    position={selectedPassenger.location}
                    onCloseClick={() => setSelectedPassenger(null)}
                  >
                    <div>
                      <h3 className="font-semibold text-sm">{selectedPassenger.name}</h3>
                      <p className="text-xs text-gray-600">Passenger ID: {selectedPassenger.id}</p>
                      <p className="text-xs text-gray-600">Status: {selectedPassenger.status}</p>
                    </div>
                  </InfoWindowF>
                )}
              </GoogleMap>
            </div>
          )}
        </div>
      </div>

      {/* Active Rides List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Active Rides ({activeRides.length})</h3>
        </div>
        <div className="p-4">
          {activeRides.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No active rides found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRides.map((ride) => (
                <div key={ride.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">Ride #{ride.id}</h4>
                      <p className="text-sm text-gray-600">
                        {typeof ride.pickup === 'string' ? ride.pickup : `${ride.pickup?.lat?.toFixed(4)}, ${ride.pickup?.lng?.toFixed(4)}`} → {typeof ride.destination === 'string' ? ride.destination : `${ride.destination?.lat?.toFixed(4)}, ${ride.destination?.lng?.toFixed(4)}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        Driver: {ride.driverName} • Status: {ride.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${ride.fare}</p>
                      <p className="text-xs text-gray-500">{ride.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideMonitoring; 