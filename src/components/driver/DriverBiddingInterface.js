import React, { useState, useEffect, useCallback } from 'react';
import { 
  CurrencyDollarIcon, 
  MapPinIcon, 
  UserIcon,
  TruckIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import driverBidService from '../../services/driverBidService';
import rideRequestService from '../../services/rideRequestService';
import toast from 'react-hot-toast';

const DriverBiddingInterface = ({ driverId }) => {
  const [availableRides, setAvailableRides] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, available, my_bids, accepted
  const [sortBy, setSortBy] = useState('distance'); // distance, fare, time

  const loadAvailableRides = useCallback(async () => {
    try {
      setLoading(true);
      // In production, this would fetch rides based on driver location and preferences
      const rides = await rideRequestService.getActiveRideRequests(50);
      setAvailableRides(rides);
    } catch (error) {
      console.error('Error loading available rides:', error);
      toast.error('Failed to load available rides');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyBids = useCallback(async () => {
    try {
      const bids = await driverBidService.getBidsForDriver(driverId);
      setMyBids(bids);
    } catch (error) {
      console.error('Error loading my bids:', error);
    }
  }, [driverId]);

  useEffect(() => {
    loadAvailableRides();
    loadMyBids();
  }, [loadAvailableRides, loadMyBids]);

  const handleCreateBid = async (rideId, bidData) => {
    try {
      const result = await driverBidService.createDriverBid({
        driverId,
        rideRequestId: rideId,
        bidAmount: bidData.bidAmount,
        estimatedArrival: bidData.estimatedArrival,
        vehicleInfo: bidData.vehicleInfo,
        driverRating: bidData.driverRating,
        specialFeatures: bidData.specialFeatures,
        notes: bidData.notes
      });

      if (result.success) {
        toast.success('Bid submitted successfully');
        loadMyBids();
        loadAvailableRides();
      } else {
        toast.error('Failed to submit bid');
      }
    } catch (error) {
      console.error('Error creating bid:', error);
      toast.error('Error submitting bid');
    }
  };

  const handleUpdateBid = async (bidId, updates) => {
    try {
      const result = await driverBidService.updateDriverBid(bidId, updates);
      if (result.success) {
        toast.success('Bid updated successfully');
        loadMyBids();
      } else {
        toast.error('Failed to update bid');
      }
    } catch (error) {
      console.error('Error updating bid:', error);
      toast.error('Error updating bid');
    }
  };

  const handleCancelBid = async (bidId) => {
    try {
      const result = await driverBidService.updateDriverBidStatus(bidId, 'cancelled');
      if (result.success) {
        toast.success('Bid cancelled');
        loadMyBids();
      } else {
        toast.error('Failed to cancel bid');
      }
    } catch (error) {
      console.error('Error cancelling bid:', error);
      toast.error('Error cancelling bid');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // const formatTime = (minutes) => {
  //   if (minutes < 60) {
  //     return `${minutes} min`;
  //   }
  //   const hours = Math.floor(minutes / 60);
  //   const mins = minutes % 60;
  //   return `${hours}h ${mins}m`;
  // };

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

  const getRideTypeColor = (rideType) => {
    switch (rideType) {
      case 'medical':
        return 'bg-red-100 text-red-800';
      case 'paired_driver':
        return 'bg-purple-100 text-purple-800';
      case 'tow_back':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredRides = availableRides.filter(ride => {
    switch (filter) {
      case 'available':
        return !myBids.some(bid => bid.rideRequestId === ride.id);
      case 'my_bids':
        return myBids.some(bid => bid.rideRequestId === ride.id);
      case 'accepted':
        return myBids.some(bid => bid.rideRequestId === ride.id && bid.status === 'accepted');
      default:
        return true;
    }
  });

  const sortedRides = [...filteredRides].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return (a.estimatedDistance || 0) - (b.estimatedDistance || 0);
      case 'fare':
        return (b.estimatedFare?.total || 0) - (a.estimatedFare?.total || 0);
      case 'time':
        return (a.estimatedTime || 0) - (b.estimatedTime || 0);
      default:
        return 0;
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
        <h2 className="text-2xl font-bold text-gray-900">Driver Bidding</h2>
        <p className="text-gray-600">Browse available rides and submit your bids</p>
      </div>

      {/* Filters and Controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Rides
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'available' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setFilter('my_bids')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'my_bids' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            My Bids
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'accepted' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Accepted
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="distance">Sort by Distance</option>
          <option value="fare">Sort by Fare</option>
          <option value="time">Sort by Time</option>
        </select>
      </div>

      {/* Rides List */}
      <div className="space-y-4">
        {sortedRides.length === 0 ? (
          <div className="text-center py-8">
            <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No rides available for the selected filter</p>
          </div>
        ) : (
          sortedRides.map((ride) => {
            const myBid = myBids.find(bid => bid.rideRequestId === ride.id);
            
            return (
              <div key={ride.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Ride Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{getRideTypeIcon(ride.rideType)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ride.rideType?.replace('_', ' ').toUpperCase() || 'Standard'} Ride
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRideTypeColor(ride.rideType)}`}>
                            {ride.rideType?.replace('_', ' ')}
                          </span>
                          {ride.isSpecialtyRide && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              Specialty
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ride Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Pickup</p>
                          <p className="text-sm text-gray-600">{ride.pickupLocation?.address || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Destination</p>
                          <p className="text-sm text-gray-600">{ride.dropoffLocation?.address || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Estimated Fare</p>
                          <p className="text-sm text-gray-600">{formatCurrency(ride.estimatedFare?.total || 0)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Specialty Ride Information */}
                    {ride.isSpecialtyRide && ride.specialtyData && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-sm font-medium text-yellow-800 mb-2">Specialty Requirements:</div>
                        {ride.rideType === 'tow_truck' && (
                          <div className="text-xs text-yellow-700 space-y-1">
                            <div><strong>Vehicle:</strong> {ride.specialtyData.vehicleYear} {ride.specialtyData.vehicleMake} {ride.specialtyData.vehicleModel}</div>
                            <div><strong>License Plate:</strong> {ride.specialtyData.licensePlate}</div>
                            <div><strong>Condition:</strong> {ride.specialtyData.vehicleCondition}</div>
                            <div><strong>Destination:</strong> {ride.specialtyData.towingDestination}</div>
                            {ride.specialtyData.specialInstructions && (
                              <div><strong>Instructions:</strong> {ride.specialtyData.specialInstructions}</div>
                            )}
                          </div>
                        )}
                        {ride.rideType === 'companion_driver' && (
                          <div className="text-xs text-yellow-700 space-y-1">
                            <div><strong>Reason:</strong> {ride.specialtyData.reasonForCompanion}</div>
                            <div><strong>Security Level:</strong> {ride.specialtyData.securityLevel}</div>
                            <div><strong>Duration:</strong> {ride.specialtyData.estimatedDuration}</div>
                            {ride.specialtyData.specialRequirements && (
                              <div><strong>Requirements:</strong> {ride.specialtyData.specialRequirements}</div>
                            )}
                          </div>
                        )}
                        {ride.rideType === 'medical' && (
                          <div className="text-xs text-yellow-700 space-y-1">
                            <div><strong>Condition:</strong> {ride.specialtyData.medicalCondition}</div>
                            <div><strong>Appointment:</strong> {ride.specialtyData.appointmentType}</div>
                            <div><strong>Equipment:</strong> {ride.specialtyData.specialEquipment?.join(', ')}</div>
                            {ride.specialtyData.emergencyContact && (
                              <div><strong>Emergency Contact:</strong> {ride.specialtyData.emergencyContact}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Special Features */}
                    {ride.preferences && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {ride.preferences.videoEnabled && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <VideoCameraIcon className="h-3 w-3 mr-1" />
                            Video Recording
                          </span>
                        )}
                        {ride.preferences.companionAllowed && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserIcon className="h-3 w-3 mr-1" />
                            Companion Allowed
                          </span>
                        )}
                        {ride.rideType === 'medical' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Medical Transport
                          </span>
                        )}
                      </div>
                    )}

                    {/* My Bid Status */}
                    {myBid && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Your Bid</p>
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(myBid.bidAmount)}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              myBid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              myBid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              myBid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {myBid.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {!myBid ? (
                      <button
                        onClick={() => {
                          // In production, this would open a bid creation modal
                          const bidData = {
                            bidAmount: ride.estimatedFare?.total || 0,
                            estimatedArrival: 15,
                            vehicleInfo: { make: 'Toyota', model: 'Camry', year: 2020 },
                            driverRating: 4.8,
                            specialFeatures: ['video_enabled'],
                            notes: 'Professional driver with clean vehicle'
                          };
                          handleCreateBid(ride.id, bidData);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Submit Bid
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        {myBid.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateBid(myBid.id, { bidAmount: myBid.bidAmount + 5 })}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Increase Bid
                            </button>
                            <button
                              onClick={() => handleCancelBid(myBid.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {myBid.status === 'accepted' && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                            <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                            Accepted
                          </span>
                        )}
                        {myBid.status === 'rejected' && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                            <XCircleIcon className="h-4 w-4 inline mr-1" />
                            Rejected
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DriverBiddingInterface;
