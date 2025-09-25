import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserGroupIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import pairedDriverService from '../../services/pairedDriverService';
import toast from 'react-hot-toast';

const PairedDriverInterface = ({ driverId }) => {
  const [activePairs, setActivePairs] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePairModal, setShowCreatePairModal] = useState(false);
  const [newPair, setNewPair] = useState({
    secondaryDriverId: '',
    rideId: '',
    pairingReason: 'high_value_ride'
  });

  const loadActivePairs = useCallback(async () => {
    try {
      setLoading(true);
      const pairs = await pairedDriverService.getAllPairsForDriver(driverId);
      setActivePairs(pairs);
    } catch (error) {
      console.error('Error loading active pairs:', error);
      toast.error('Failed to load active pairs');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  const loadAvailableDrivers = useCallback(async () => {
    try {
      const result = await pairedDriverService.getAvailableDriversForPairing(driverId);
      if (result.success) {
        setAvailableDrivers(result.data);
      }
    } catch (error) {
      console.error('Error loading available drivers:', error);
    }
  }, [driverId]);

  useEffect(() => {
    loadActivePairs();
    loadAvailableDrivers();
  }, [loadActivePairs, loadAvailableDrivers]);

  const handleCreatePair = async () => {
    try {
      if (!newPair.secondaryDriverId || !newPair.rideId) {
        toast.error('Please fill in all required fields');
        return;
      }

      const result = await pairedDriverService.createPair(
        driverId,
        newPair.secondaryDriverId,
        newPair.rideId,
        newPair.pairingReason
      );

      if (result.success) {
        toast.success('Driver pair created successfully');
        setShowCreatePairModal(false);
        setNewPair({
          secondaryDriverId: '',
          rideId: '',
          pairingReason: 'high_value_ride'
        });
        loadActivePairs();
      } else {
        toast.error('Failed to create driver pair');
      }
    } catch (error) {
      console.error('Error creating pair:', error);
      toast.error('Error creating driver pair');
    }
  };

  // const handleJoinPair = async (pairId) => {
  //   try {
  //     const result = await pairedDriverService.joinAsSecondaryDriver(pairId, driverId);
  //     if (result.success) {
  //       toast.success('Successfully joined driver pair');
  //       loadActivePairs();
  //     } else {
  //       toast.error('Failed to join driver pair');
  //     }
  //   } catch (error) {
  //     console.error('Error joining pair:', error);
  //     toast.error('Error joining driver pair');
  //   }
  // };

  const handleCompletePair = async (pairId) => {
    try {
      const result = await pairedDriverService.completePair(pairId);
      if (result.success) {
        toast.success('Pair coordination completed');
        loadActivePairs();
      } else {
        toast.error('Failed to complete pair');
      }
    } catch (error) {
      console.error('Error completing pair:', error);
      toast.error('Error completing pair');
    }
  };

  const handleCancelPair = async (pairId) => {
    const reason = prompt('Please provide a reason for cancellation (optional):');
    try {
      const result = await pairedDriverService.cancelPair(pairId, reason);
      if (result.success) {
        toast.success('Pair cancelled');
        loadActivePairs();
      } else {
        toast.error('Failed to cancel pair');
      }
    } catch (error) {
      console.error('Error cancelling pair:', error);
      toast.error('Error cancelling pair');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPairingReasonLabel = (reason) => {
    switch (reason) {
      case 'high_value_ride':
        return 'High Value Ride';
      case 'safety_requirement':
        return 'Safety Requirement';
      case 'special_needs':
        return 'Special Needs';
      case 'medical_transport':
        return 'Medical Transport';
      default:
        return reason;
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading paired driver data...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Paired Driver Mode</h2>
            <p className="text-gray-600">Coordinate with other drivers for special rides</p>
          </div>
          <button
            onClick={() => setShowCreatePairModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Pair</span>
          </button>
        </div>
      </div>

      {/* Active Pairs */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Pairs ({activePairs.length})</h3>
        
        {activePairs.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active driver pairs</p>
            <p className="text-sm text-gray-500">Create a pair to coordinate with other drivers</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activePairs.map((pair) => (
              <div key={pair.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <UserGroupIcon className="h-6 w-6 text-blue-600" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          Pair {pair.id.slice(-8)}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pair.status)}`}>
                          {pair.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Primary Driver</p>
                        <p className="text-sm text-gray-600">
                          {pair.primaryDriverId === driverId ? 'You' : `Driver ${pair.primaryDriverId?.slice(-6)}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Secondary Driver</p>
                        <p className="text-sm text-gray-600">
                          {pair.secondaryDriverId === driverId ? 'You' : `Driver ${pair.secondaryDriverId?.slice(-6)}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Ride ID</p>
                        <p className="text-sm text-gray-600">{pair.rideId?.slice(-8) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Reason</p>
                        <p className="text-sm text-gray-600">{getPairingReasonLabel(pair.pairingReason)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>Created {formatTimeAgo(pair.createdAt)}</span>
                      </div>
                      {pair.startTime && (
                        <div className="flex items-center space-x-1">
                          <TruckIcon className="h-4 w-4" />
                          <span>Started {formatTimeAgo(pair.startTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {pair.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleCompletePair(pair.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Complete</span>
                        </button>
                        <button
                          onClick={() => handleCancelPair(pair.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                    
                    <div className="flex space-x-1">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Contact Driver"
                      >
                        <PhoneIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Message Driver"
                      >
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Drivers */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Drivers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableDrivers.map((driver) => (
            <div key={driver.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{driver.name}</h4>
                  <p className="text-sm text-gray-600">Rating: {driver.rating} ⭐</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{driver.location}</p>
              <button
                onClick={() => {
                  setNewPair(prev => ({ ...prev, secondaryDriverId: driver.id }));
                  setShowCreatePairModal(true);
                }}
                className="w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Create Pair
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Pair Modal */}
      {showCreatePairModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Driver Pair</h3>
                <button
                  onClick={() => setShowCreatePairModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Secondary Driver</label>
                  <select
                    value={newPair.secondaryDriverId}
                    onChange={(e) => setNewPair({...newPair, secondaryDriverId: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a driver</option>
                    {availableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.location}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ride ID</label>
                  <input
                    type="text"
                    value={newPair.rideId}
                    onChange={(e) => setNewPair({...newPair, rideId: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter ride ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pairing Reason</label>
                  <select
                    value={newPair.pairingReason}
                    onChange={(e) => setNewPair({...newPair, pairingReason: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="high_value_ride">High Value Ride</option>
                    <option value="safety_requirement">Safety Requirement</option>
                    <option value="special_needs">Special Needs</option>
                    <option value="medical_transport">Medical Transport</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreatePairModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePair}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Create Pair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PairedDriverInterface;
