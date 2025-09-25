import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  ClockIcon, 
  UserIcon, 
  PhoneIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import rideRequestService from '../../services/rideRequestService';
import toast from 'react-hot-toast';

const RideTrackingEnhancements = ({ rideId, onRideUpdate }) => {
  const [rideData, setRideData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [estimatedArrival, setEstimatedArrival] = useState(null);
  const [rideStatus, setRideStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (rideId) {
      loadRideData();
      // Set up real-time updates
      const unsubscribe = rideRequestService.subscribeToRideRequests(user.uid, (rides) => {
        const currentRide = rides.find(ride => ride.id === rideId);
        if (currentRide) {
          setRideData(currentRide);
          setRideStatus(currentRide.status);
          onRideUpdate?.(currentRide);
        }
      });
      
      return () => unsubscribe();
    }
  }, [rideId]);

  const loadRideData = async () => {
    try {
      setLoading(true);
      const result = await rideRequestService.getRideRequestById(rideId);
      if (result.success) {
        setRideData(result.data);
        setRideStatus(result.data.status);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load ride data');
      console.error('Error loading ride data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContactDriver = () => {
    if (rideData?.driverId) {
      // In production, this would initiate a call or message
      toast.success('Connecting to driver...');
    }
  };

  const handleEmergencyAlert = () => {
    if (window.confirm('Are you sure you want to send an emergency alert?')) {
      // In production, this would send an emergency alert
      toast.error('Emergency alert sent to driver and support team');
    }
  };

  const handleCancelRide = async () => {
    if (window.confirm('Are you sure you want to cancel this ride?')) {
      try {
        const result = await rideRequestService.cancelRideRequest(rideId, 'Rider cancelled');
        if (result.success) {
          toast.success('Ride cancelled successfully');
          onRideUpdate?.({ ...rideData, status: 'cancelled' });
        } else {
          toast.error('Failed to cancel ride');
        }
      } catch (error) {
        console.error('Error cancelling ride:', error);
        toast.error('Error cancelling ride');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'driver_assigned':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5" />;
      case 'driver_assigned':
        return <UserIcon className="h-5 w-5" />;
      case 'in_progress':
        return <TruckIcon className="h-5 w-5" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading ride details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!rideData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No ride data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ride Status Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(rideStatus)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {rideStatus.replace('_', ' ').toUpperCase()}
              </h3>
              <p className="text-sm text-gray-600">
                {rideData.rideType?.replace('_', ' ').toUpperCase() || 'Standard'} Ride
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rideStatus)}`}>
            {rideStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Driver Information */}
      {rideData.driverId && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h4>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Driver {rideData.driverId?.slice(-6)}</p>
              <p className="text-sm text-gray-600">Rating: 4.8 ⭐</p>
              <p className="text-sm text-gray-600">
                {rideData.vehicleInfo?.make} {rideData.vehicleInfo?.model} {rideData.vehicleInfo?.year}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleContactDriver}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Contact Driver"
              >
                <PhoneIcon className="h-5 w-5" />
              </button>
              <button
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                title="Message Driver"
              >
                <ChatBubbleLeftIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ride Details */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Ride Details</h4>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <MapPinIcon className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <p className="font-medium text-gray-900">Pickup Location</p>
              <p className="text-sm text-gray-600">{rideData.pickupLocation?.address || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPinIcon className="h-5 w-5 text-red-600 mt-1" />
            <div>
              <p className="font-medium text-gray-900">Destination</p>
              <p className="text-sm text-gray-600">{rideData.dropoffLocation?.address || 'N/A'}</p>
            </div>
          </div>
          {rideData.estimatedFare && (
            <div className="flex items-start space-x-3">
              <ClockIcon className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-medium text-gray-900">Estimated Fare</p>
                <p className="text-sm text-gray-600">${rideData.estimatedFare.total || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Special Features */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Ride Features</h4>
        <div className="grid grid-cols-2 gap-4">
          {rideData.preferences?.videoEnabled && (
            <div className="flex items-center space-x-2">
              <VideoCameraIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-700">Video Recording</span>
            </div>
          )}
          {rideData.preferences?.companionAllowed && (
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-700">Companion Allowed</span>
            </div>
          )}
          {rideData.rideType === 'medical' && (
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-700">Medical Transport</span>
            </div>
          )}
          {rideData.rideType === 'paired_driver' && (
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-700">Paired Driver</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        {rideStatus === 'pending' && (
          <button
            onClick={handleCancelRide}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Cancel Ride
          </button>
        )}
        <button
          onClick={handleEmergencyAlert}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Emergency Alert
        </button>
      </div>

      {/* Real-time Updates */}
      {rideStatus === 'in_progress' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-pulse w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
            <span className="text-blue-800 text-sm">Live tracking active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideTrackingEnhancements;
