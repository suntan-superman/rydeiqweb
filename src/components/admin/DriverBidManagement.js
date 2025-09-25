import React, { useState, useEffect, useCallback } from 'react';
import { 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import driverBidService from '../../services/driverBidService';
import toast from 'react-hot-toast';

const DriverBidManagement = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showBidDetails, setShowBidDetails] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [statistics, setStatistics] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, accepted, rejected, expired

  const loadBids = useCallback(async () => {
    setLoading(true);
    try {
      let bidsData;
      if (filter === 'all') {
        bidsData = await driverBidService.getAllActiveBids();
      } else {
        // For now, get all active bids and filter client-side
        // In production, you'd want server-side filtering
        const allBids = await driverBidService.getAllActiveBids();
        bidsData = allBids.filter(bid => bid.status === filter);
      }
      setBids(bidsData);
    } catch (error) {
      console.error('Error loading bids:', error);
      toast.error('Failed to load bids');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadStatistics = useCallback(async () => {
    try {
      const result = await driverBidService.getBidStatistics(timeRange);
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, [timeRange]);

  useEffect(() => {
    loadBids();
    loadStatistics();
  }, [loadBids, loadStatistics]);

  const handleAcceptBid = async (bidId) => {
    try {
      const result = await driverBidService.acceptBid(bidId);
      if (result.success) {
        toast.success('Bid accepted successfully');
        loadBids();
        loadStatistics();
      } else {
        toast.error('Failed to accept bid');
      }
    } catch (error) {
      console.error('Error accepting bid:', error);
      toast.error('Error accepting bid');
    }
  };

  const handleRejectBid = async (bidId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    try {
      const result = await driverBidService.rejectBid(bidId, reason);
      if (result.success) {
        toast.success('Bid rejected');
        loadBids();
        loadStatistics();
      } else {
        toast.error('Failed to reject bid');
      }
    } catch (error) {
      console.error('Error rejecting bid:', error);
      toast.error('Error rejecting bid');
    }
  };

  const handleViewBidDetails = (bid) => {
    setSelectedBid(bid);
    setShowBidDetails(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    return bid.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Driver Bid Management</h2>
          <p className="text-gray-600">Manage and monitor driver bids for ride requests</p>
        </div>
        <div className="flex space-x-4">
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
            <option value="all">All Bids</option>
            <option value="active">Active</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bids</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalBids}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.acceptedBids}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.activeBids}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Acceptance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.acceptanceRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bids Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Bids ({filteredBids.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading bids...</p>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="p-8 text-center">
            <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No bids found for the selected criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bid Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
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
                {filteredBids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Driver {bid.driverId?.slice(-6) || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Rating: {bid.driverRating || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(bid.bidAmount || 0)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ETA: {bid.estimatedArrival ? new Date(bid.estimatedArrival).toLocaleTimeString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bid.vehicleInfo?.make} {bid.vehicleInfo?.model}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bid.vehicleInfo?.year} • {bid.vehicleInfo?.color}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bid.status)}`}>
                        {bid.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(bid.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewBidDetails(bid)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {bid.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleAcceptBid(bid.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRejectBid(bid.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XMarkIcon className="h-4 w-4" />
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

      {/* Bid Details Modal */}
      {showBidDetails && selectedBid && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Bid Details</h3>
                <button
                  onClick={() => setShowBidDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Driver ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBid.driverId}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bid Amount</label>
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedBid.bidAmount)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle Information</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBid.vehicleInfo?.make} {selectedBid.vehicleInfo?.model} ({selectedBid.vehicleInfo?.year})
                  </p>
                  <p className="text-sm text-gray-500">
                    Color: {selectedBid.vehicleInfo?.color} • License: {selectedBid.vehicleInfo?.licensePlate}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Special Capabilities</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedBid.specialCapabilities?.map((capability, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                      >
                        {capability.replace('_', ' ')}
                      </span>
                    )) || <span className="text-sm text-gray-500">None</span>}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBid.status)}`}>
                    {selectedBid.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{formatTimeAgo(selectedBid.createdAt)}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBidDetails(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Close
                </button>
                {selectedBid.status === 'active' && (
                  <>
                    <button
                      onClick={() => {
                        handleAcceptBid(selectedBid.id);
                        setShowBidDetails(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                    >
                      Accept Bid
                    </button>
                    <button
                      onClick={() => {
                        handleRejectBid(selectedBid.id);
                        setShowBidDetails(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                    >
                      Reject Bid
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

export default DriverBidManagement;
