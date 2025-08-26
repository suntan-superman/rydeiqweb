import React, { useState, useEffect } from 'react';
import {
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import driverAssignmentService from '../../services/driverAssignmentService';

const DriverTrackingPanel = ({ ride, onClose }) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideStatus, setRideStatus] = useState(ride?.status || 'assigned');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [estimatedArrival, setEstimatedArrival] = useState(null);

  useEffect(() => {
    if (!ride?.assignedDriverId) return;

    // Subscribe to real-time ride updates
    const unsubscribe = driverAssignmentService.subscribeToRideUpdates(
      ride.Id,
      (updatedRide, error) => {
        if (error) {
          console.error('Error in ride tracking:', error);
          return;
        }

        if (updatedRide) {
          setRideStatus(updatedRide.status);
          setLastUpdate(new Date());
          
          // Update driver location if available
          if (updatedRide.driverLocation) {
            setDriverLocation(updatedRide.driverLocation);
          }
          
          // Update estimated arrival
          if (updatedRide.estimatedArrival) {
            setEstimatedArrival(new Date(updatedRide.estimatedArrival));
          }
        }
      }
    );

    // Initial driver tracking info fetch
    const fetchDriverInfo = async () => {
      try {
        const trackingInfo = await driverAssignmentService.getDriverTrackingInfo(ride.assignedDriverId);
        if (trackingInfo) {
          setDriverLocation(trackingInfo.location);
          setLastUpdate(trackingInfo.lastLocationUpdate ? new Date(trackingInfo.lastLocationUpdate) : null);
        }
      } catch (error) {
        console.error('Error fetching driver tracking info:', error);
      }
    };

    fetchDriverInfo();

    return () => unsubscribe();
  }, [ride?.Id, ride?.assignedDriverId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_route': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'arrived': return 'bg-green-100 text-green-800 border-green-200';
      case 'picked_up': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned': return <TruckIcon className="h-4 w-4" />;
      case 'en_route': return <MapPinIcon className="h-4 w-4" />;
      case 'arrived': return <CheckCircleIcon className="h-4 w-4" />;
      case 'picked_up': return <TruckIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <ExclamationTriangleIcon className="h-4 w-4" />;
    }
  };

  const formatStatusText = (status) => {
    switch (status) {
      case 'assigned': return 'Driver Assigned';
      case 'en_route': return 'Driver En Route';
      case 'arrived': return 'Driver Arrived';
      case 'picked_up': return 'Patient Picked Up';
      case 'completed': return 'Ride Completed';
      default: return status?.replace('_', ' ')?.toUpperCase() || 'Unknown';
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Unknown';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLocation = (location) => {
    if (!location || !location.latitude || !location.longitude) {
      return 'Location not available';
    }
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  if (!ride?.assignedDriverId) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Ride Status</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No driver assigned to this ride yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Driver Tracking</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Driver Info */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-green-100 p-2 rounded-full">
            <TruckIcon className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{ride.driverInfo?.name || 'Driver'}</h4>
            <p className="text-sm text-gray-600">{ride.driverInfo?.vehicle || 'Vehicle info not available'}</p>
          </div>
        </div>
        
        {ride.driverInfo?.phone && (
          <a
            href={`tel:${ride.driverInfo.phone}`}
            className="flex items-center text-green-600 hover:text-green-700 text-sm"
          >
            <PhoneIcon className="h-4 w-4 mr-1" />
            Call Driver
          </a>
        )}
      </div>

      {/* Status */}
      <div className="mb-6">
        <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(rideStatus)}`}>
          {getStatusIcon(rideStatus)}
          <span className="ml-2">{formatStatusText(rideStatus)}</span>
        </div>
      </div>

      {/* Time Information */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Appointment Time:</span>
          <span className="text-sm font-medium">{formatTime(new Date(ride.StartTime))}</span>
        </div>
        
        {estimatedArrival && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estimated Arrival:</span>
            <span className="text-sm font-medium">{formatTime(estimatedArrival)}</span>
          </div>
        )}
        
        {lastUpdate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Update:</span>
            <span className="text-sm font-medium">{formatTime(lastUpdate)}</span>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="mb-6">
        <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <MapPinIcon className="h-4 w-4 mr-1" />
          Driver Location
        </h5>
        <p className="text-sm text-gray-600">{formatLocation(driverLocation)}</p>
        
        {driverLocation?.latitude && driverLocation?.longitude && (
          <a
            href={`https://maps.google.com/maps?q=${driverLocation.latitude},${driverLocation.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-xs mt-1 inline-block"
          >
            View on Google Maps
          </a>
        )}
      </div>

      {/* Route Information */}
      <div className="border-t pt-4">
        <h5 className="text-sm font-medium text-gray-900 mb-3">Route</h5>
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="text-xs font-medium text-gray-700">Pickup</p>
              <p className="text-xs text-gray-600">{ride.PickupLocation?.address || 'Pickup location'}</p>
            </div>
          </div>
          
          <div className="ml-1 border-l-2 border-gray-200 h-4"></div>
          
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
            <div>
              <p className="text-xs font-medium text-gray-700">Destination</p>
              <p className="text-xs text-gray-600">{ride.DropoffLocation?.address || 'Destination'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t pt-4 mt-4">
        <div className="flex space-x-2">
          {ride.pickupLocation?.address && (
            <a
              href={`https://maps.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ride.pickupLocation.address)}&destination=${encodeURIComponent(ride.dropoffLocation?.address || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              View Route
            </a>
          )}
          
          {ride.driverInfo?.phone && (
            <a
              href={`sms:${ride.driverInfo.phone}`}
              className="flex-1 bg-gray-600 text-white text-center py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-700"
            >
              Text Driver
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverTrackingPanel;
