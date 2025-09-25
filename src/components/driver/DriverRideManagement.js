import React, { useState, useEffect } from 'react';
import { 
  TruckIcon, 
  MapPinIcon, 
  ClockIcon, 
  UserIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  VideoCameraIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import rideRequestService from '../../services/rideRequestService';
import toast from 'react-hot-toast';

const DriverRideManagement = ({ driverId }) => {
  const [currentRide, setCurrentRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed, cancelled

  useEffect(() => {
    loadCurrentRide();
    loadRideHistory();
  }, [driverId, filter]);

  const loadCurrentRide = async () => {
    try {
      // In production, this would fetch the driver's current active ride
      const mockCurrentRide = {
        id: 'ride123',
        riderId: 'rider456',
        pickupLocation: {
          address: '123 Main St, Downtown',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        dropoffLocation: {
          address: '456 Oak Ave, Uptown',
          coordinates: { lat: 40.7589, lng: -73.9851 }
        },
        scheduledTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        estimatedFare: {
          total: 45.50,
          baseFare: 5.00,
          distanceFare: 32.50,
          timeFare: 8.00
        },
        rideType: 'standard',
        preferences: {
          videoEnabled: true,
          companionAllowed: false
        },
        status: 'in_progress',
        startTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        riderInfo: {
          name: 'John Doe',
          phone: '+1 (555) 123-4567',
          rating: 4.8
        }
      };
      setCurrentRide(mockCurrentRide);
    } catch (error) {
      console.error('Error loading current ride:', error);
    }
  };

  const loadRideHistory = async () => {
    try {
      setLoading(true);
      // In production, this would fetch from the ride service
      const mockHistory = [
        {
          id: 'ride1',
          date: '2024-01-15',
          time: '14:30',
          pickup: 'Downtown',
          dropoff: 'Airport',
          fare: 45.50,
          tip: 8.00,
          total: 53.50,
          status: 'completed',
          riderName: 'Jane Smith',
          rating: 5.0
        },
        {
          id: 'ride2',
          date: '2024-01-15',
          time: '16:45',
          pickup: 'Airport',
          dropoff: 'Uptown',
          fare: 38.75,
          tip: 5.00,
          total: 43.75,
          status: 'completed',
          riderName: 'Mike Johnson',
          rating: 4.5
        },
        {
          id: 'ride3',
          date: '2024-01-14',
          time: '09:15',
          pickup: 'Suburbs',
          dropoff: 'Downtown',
          fare: 28.25,
          tip: 3.00,
          total: 31.25,
          status: 'completed',
          riderName: 'Sarah Wilson',
          rating: 4.8
        }
      ];
      setRideHistory(mockHistory);
    } catch (error) {
      console.error('Error loading ride history:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleStartRide = async (rideId) => {
  //   try {
  //     const result = await rideRequestService.startRide(rideId, driverId);
  //     if (result.success) {
  //       toast.success('Ride started successfully');
  //       loadCurrentRide();
  //     } else {
  //       toast.error('Failed to start ride');
  //     }
  //   } catch (error) {
  //     console.error('Error starting ride:', error);
  //     toast.error('Error starting ride');
  //   }
  // };

  const handleCompleteRide = async (rideId) => {
    try {
      const result = await rideRequestService.completeRide(rideId, {
        completionNotes: 'Ride completed successfully',
        actualFare: currentRide?.estimatedFare?.total || 0
      });
      if (result.success) {
        toast.success('Ride completed successfully');
        setCurrentRide(null);
        loadRideHistory();
      } else {
        toast.error('Failed to complete ride');
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      toast.error('Error completing ride');
    }
  };

  const handleCancelRide = async (rideId) => {
    if (window.confirm('Are you sure you want to cancel this ride?')) {
      try {
        const result = await rideRequestService.cancelRideRequest(rideId, 'Driver cancelled');
        if (result.success) {
          toast.success('Ride cancelled');
          setCurrentRide(null);
          loadRideHistory();
        } else {
          toast.error('Failed to cancel ride');
        }
      } catch (error) {
        console.error('Error cancelling ride:', error);
        toast.error('Error cancelling ride');
      }
    }
  };

  const handleContactRider = () => {
    if (currentRide?.riderInfo?.phone) {
      // In production, this would initiate a call
      toast.success('Connecting to rider...');
    }
  };

  const handleMessageRider = () => {
    if (currentRide?.riderId) {
      // In production, this would open a chat interface
      toast.success('Opening chat with rider...');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRideTypeIcon = (rideType) => {
    switch (rideType) {
      case 'medical':
        return '🏥';
      case 'paired_driver':
        return '👥';
      case 'tow_back':
        return '🚚';
      default:
        return '🚗';
    }
  };

  const filteredHistory = rideHistory.filter(ride => {
    switch (filter) {
      case 'active':
        return ride.status === 'in_progress';
      case 'completed':
        return ride.status === 'completed';
      case 'cancelled':
        return ride.status === 'cancelled';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading rides...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ride Management</h2>
        <p className="text-gray-600">Manage your current ride and view ride history</p>
      </div>

      {/* Current Ride */}
      {currentRide && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Ride</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentRide.status)}`}>
              {currentRide.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ride Details */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Pickup Location</p>
                  <p className="text-sm text-gray-600">{currentRide.pickupLocation.address}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-red-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Destination</p>
                  <p className="text-sm text-gray-600">{currentRide.dropoffLocation.address}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <ClockIcon className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Scheduled Time</p>
                  <p className="text-sm text-gray-600">{formatTime(currentRide.scheduledTime)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Estimated Fare</p>
                  <p className="text-sm text-gray-600">{formatCurrency(currentRide.estimatedFare.total)}</p>
                </div>
              </div>
            </div>

            {/* Rider Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Rider</p>
                  <p className="text-sm text-gray-600">{currentRide.riderInfo.name}</p>
                  <p className="text-sm text-gray-600">Rating: {currentRide.riderInfo.rating} ⭐</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{currentRide.riderInfo.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getRideTypeIcon(currentRide.rideType)}</span>
                <div>
                  <p className="font-medium text-gray-900">Ride Type</p>
                  <p className="text-sm text-gray-600">{currentRide.rideType.replace('_', ' ').toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Special Features */}
          {currentRide.preferences && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-2">Special Features</p>
              <div className="flex flex-wrap gap-2">
                {currentRide.preferences.videoEnabled && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <VideoCameraIcon className="h-3 w-3 mr-1" />
                    Video Recording
                  </span>
                )}
                {currentRide.preferences.companionAllowed && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <UserIcon className="h-3 w-3 mr-1" />
                    Companion Allowed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleContactRider}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PhoneIcon className="h-4 w-4" />
              <span>Call Rider</span>
            </button>
            <button
              onClick={handleMessageRider}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>Message</span>
            </button>
            <button
              onClick={() => handleCompleteRide(currentRide.id)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Complete Ride</span>
            </button>
            <button
              onClick={() => handleCancelRide(currentRide.id)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <XCircleIcon className="h-4 w-4" />
              <span>Cancel Ride</span>
            </button>
          </div>
        </div>
      )}

      {/* Ride History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Ride History</h3>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Rides</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No rides found for the selected filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((ride) => (
              <div key={ride.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getRideTypeIcon(ride.rideType || 'standard')}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{ride.riderName}</h4>
                      <p className="text-sm text-gray-600">{ride.date} at {ride.time}</p>
                      <p className="text-sm text-gray-600">{ride.pickup} → {ride.dropoff}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(ride.total)}</p>
                    <p className="text-sm text-gray-600">Fare: {formatCurrency(ride.fare)}</p>
                    {ride.tip > 0 && (
                      <p className="text-sm text-gray-600">Tip: {formatCurrency(ride.tip)}</p>
                    )}
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                      {ride.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRideManagement;
