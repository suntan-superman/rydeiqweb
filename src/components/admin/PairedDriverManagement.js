import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import pairedDriverService from '../../services/pairedDriverService';
import toast from 'react-hot-toast';

const PairedDriverManagement = () => {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null);
  const [showPairDetails, setShowPairDetails] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [statistics, setStatistics] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, completed, cancelled
  const [showCreatePairModal, setShowCreatePairModal] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({
    primaryDriverId: '',
    secondaryDriverId: '',
    status: '',
    pairingReason: ''
  });

  const [newPair, setNewPair] = useState({
    primaryDriverId: '',
    secondaryDriverId: '',
    rideId: '',
    pairingReason: 'high_value_ride'
  });

  const loadPairs = useCallback(async () => {
    setLoading(true);
    try {
      let pairsData;
      if (filter === 'all') {
        pairsData = await pairedDriverService.getAllActivePairs();
      } else {
        pairsData = await pairedDriverService.searchPairs({
          status: filter,
          limit: 100
        });
      }
      setPairs(pairsData);
    } catch (error) {
      console.error('Error loading pairs:', error);
      toast.error('Failed to load driver pairs');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadStatistics = useCallback(async () => {
    try {
      const result = await pairedDriverService.getPairStatistics(timeRange);
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, [timeRange]);

  useEffect(() => {
    loadPairs();
    loadStatistics();
  }, [loadPairs, loadStatistics]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const criteria = {
        ...searchCriteria,
        limit: 100
      };
      const pairsData = await pairedDriverService.searchPairs(criteria);
      setPairs(pairsData);
    } catch (error) {
      console.error('Error searching pairs:', error);
      toast.error('Failed to search pairs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePair = async () => {
    try {
      if (!newPair.primaryDriverId || !newPair.secondaryDriverId || !newPair.rideId) {
        toast.error('Please fill in all required fields');
        return;
      }

      const result = await pairedDriverService.createPair(
        newPair.primaryDriverId,
        newPair.secondaryDriverId,
        newPair.rideId,
        newPair.pairingReason
      );

      if (result.success) {
        toast.success('Driver pair created successfully');
        setShowCreatePairModal(false);
        setNewPair({
          primaryDriverId: '',
          secondaryDriverId: '',
          rideId: '',
          pairingReason: 'high_value_ride'
        });
        loadPairs();
        loadStatistics();
      } else {
        toast.error('Failed to create driver pair');
      }
    } catch (error) {
      console.error('Error creating pair:', error);
      toast.error('Error creating driver pair');
    }
  };

  const handleCompletePair = async (pairId) => {
    try {
      const result = await pairedDriverService.completePair(pairId);
      if (result.success) {
        toast.success('Pair coordination completed');
        loadPairs();
        loadStatistics();
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
        loadPairs();
        loadStatistics();
      } else {
        toast.error('Failed to cancel pair');
      }
    } catch (error) {
      console.error('Error cancelling pair:', error);
      toast.error('Error cancelling pair');
    }
  };

  const handleViewPairDetails = (pair) => {
    setSelectedPair(pair);
    setShowPairDetails(true);
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

  const filteredPairs = pairs.filter(pair => {
    if (filter === 'all') return true;
    return pair.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paired Driver Management</h2>
          <p className="text-gray-600">Manage driver pairs for coordinated rides</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowCreatePairModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 inline mr-1" />
            Create Pair
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Pairs</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pairs</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalPairs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.activePairs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.completedPairs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Pairs</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Driver ID</label>
            <input
              type="text"
              value={searchCriteria.primaryDriverId}
              onChange={(e) => setSearchCriteria({...searchCriteria, primaryDriverId: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter primary driver ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Driver ID</label>
            <input
              type="text"
              value={searchCriteria.secondaryDriverId}
              onChange={(e) => setSearchCriteria({...searchCriteria, secondaryDriverId: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter secondary driver ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={searchCriteria.status}
              onChange={(e) => setSearchCriteria({...searchCriteria, status: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pairing Reason</label>
            <select
              value={searchCriteria.pairingReason}
              onChange={(e) => setSearchCriteria({...searchCriteria, pairingReason: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Reasons</option>
              <option value="high_value_ride">High Value Ride</option>
              <option value="safety_requirement">Safety Requirement</option>
              <option value="special_needs">Special Needs</option>
              <option value="medical_transport">Medical Transport</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search Pairs
          </button>
        </div>
      </div>

      {/* Pairs Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Driver Pairs ({filteredPairs.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading pairs...</p>
          </div>
        ) : filteredPairs.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No driver pairs found for the selected criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pair ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Primary Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Secondary Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ride ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPairs.map((pair) => (
                  <tr key={pair.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {pair.id.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Driver {pair.primaryDriverId?.slice(-6) || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Driver {pair.secondaryDriverId?.slice(-6) || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pair.rideId?.slice(-8) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getPairingReasonLabel(pair.pairingReason)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pair.status)}`}>
                        {pair.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(pair.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewPairDetails(pair)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {pair.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleCompletePair(pair.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Complete Pair"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancelPair(pair.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel Pair"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Driver ID</label>
                  <input
                    type="text"
                    value={newPair.primaryDriverId}
                    onChange={(e) => setNewPair({...newPair, primaryDriverId: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter primary driver ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Secondary Driver ID</label>
                  <input
                    type="text"
                    value={newPair.secondaryDriverId}
                    onChange={(e) => setNewPair({...newPair, secondaryDriverId: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter secondary driver ID"
                  />
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

      {/* Pair Details Modal */}
      {showPairDetails && selectedPair && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Pair Details</h3>
                <button
                  onClick={() => setShowPairDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pair ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPair.id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Driver</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPair.primaryDriverId}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Secondary Driver</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPair.secondaryDriverId}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ride ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPair.rideId}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pairing Reason</label>
                  <p className="mt-1 text-sm text-gray-900">{getPairingReasonLabel(selectedPair.pairingReason)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPair.status)}`}>
                    {selectedPair.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{formatTimeAgo(selectedPair.createdAt)}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPairDetails(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Close
                </button>
                {selectedPair.status === 'active' && (
                  <>
                    <button
                      onClick={() => {
                        handleCompletePair(selectedPair.id);
                        setShowPairDetails(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                    >
                      Complete Pair
                    </button>
                    <button
                      onClick={() => {
                        handleCancelPair(selectedPair.id);
                        setShowPairDetails(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                    >
                      Cancel Pair
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PairedDriverManagement;
