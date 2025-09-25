import React, { useState, useEffect, useCallback } from 'react';
import { 
  TruckIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import rideRequestService from '../../services/rideRequestService';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';

const SpecialtyRideManagement = () => {
  const [specialtyRides, setSpecialtyRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRide, setSelectedRide] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    towTruck: 0,
    companionDriver: 0,
    medical: 0,
    pending: 0,
    active: 0,
    completed: 0
  });

  const loadSpecialtyRides = useCallback(async () => {
    try {
      setLoading(true);
      // In production, this would fetch specialty rides from the service
      const rides = await rideRequestService.getActiveRideRequests(100);
      const specialtyRides = rides.filter(ride => ride.isSpecialtyRide);
      
      // Apply filters
      let filteredRides = specialtyRides;
      
      if (filterType !== 'all') {
        filteredRides = filteredRides.filter(ride => ride.rideType === filterType);
      }
      
      if (filterStatus !== 'all') {
        filteredRides = filteredRides.filter(ride => ride.status === filterStatus);
      }
      
      setSpecialtyRides(filteredRides);
    } catch (error) {
      console.error('Error loading specialty rides:', error);
      toast.error('Failed to load specialty rides');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    loadSpecialtyRides();
    loadStatistics();
  }, [loadSpecialtyRides]);

  const loadStatistics = async () => {
    try {
      // In production, this would fetch real statistics
      const rides = await rideRequestService.getActiveRideRequests(100);
      const specialtyRides = rides.filter(ride => ride.isSpecialtyRide);
      
      const stats = {
        total: specialtyRides.length,
        towTruck: specialtyRides.filter(ride => ride.rideType === 'tow_truck').length,
        companionDriver: specialtyRides.filter(ride => ride.rideType === 'companion_driver').length,
        medical: specialtyRides.filter(ride => ride.rideType === 'medical').length,
        pending: specialtyRides.filter(ride => ride.status === 'pending').length,
        active: specialtyRides.filter(ride => ride.status === 'active').length,
        completed: specialtyRides.filter(ride => ride.status === 'completed').length
      };
      
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleViewDetails = (ride) => {
    setSelectedRide(ride);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (rideId, newStatus) => {
    try {
      // In production, this would update the ride status
      await rideRequestService.updateRideStatus(rideId, newStatus);
      toast.success('Ride status updated successfully');
      loadSpecialtyRides();
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast.error('Failed to update ride status');
    }
  };

  const getRideTypeIcon = (rideType) => {
    switch (rideType) {
      case 'tow_truck': return <TruckIcon className="h-5 w-5 text-orange-500" />;
      case 'companion_driver': return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
      case 'medical': return <ShieldCheckIcon className="h-5 w-5 text-red-500" />;
      default: return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRideTypeColor = (rideType) => {
    switch (rideType) {
      case 'tow_truck': return 'orange';
      case 'companion_driver': return 'blue';
      case 'medical': return 'red';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading specialty rides..." />;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Specialty Ride Management</h2>
        <Button
          onClick={loadSpecialtyRides}
          variant="outline"
          size="small"
        >
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TruckIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Specialty Rides</p>
              <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TruckIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-600">Tow Truck</p>
              <p className="text-2xl font-bold text-orange-900">{statistics.towTruck}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Companion Driver</p>
              <p className="text-2xl font-bold text-blue-900">{statistics.companionDriver}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Medical</p>
              <p className="text-2xl font-bold text-red-900">{statistics.medical}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ride Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="tow_truck">Tow Truck</option>
            <option value="companion_driver">Companion Driver</option>
            <option value="medical">Medical</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Rides List */}
      <div className="space-y-4">
        {specialtyRides.length === 0 ? (
          <div className="text-center py-8">
            <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No specialty rides found for the selected filters</p>
          </div>
        ) : (
          specialtyRides.map((ride) => (
            <div key={ride.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getRideTypeIcon(ride.rideType)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {ride.rideType?.replace('_', ' ').toUpperCase()} Ride
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getRideTypeColor(ride.rideType)}-100 text-${getRideTypeColor(ride.rideType)}-800`}>
                          {ride.rideType?.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(ride.status)}-100 text-${getStatusColor(ride.status)}-800`}>
                          {ride.status}
                        </span>
                      </div>
                    </div>
                  </div>

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
                        <p className="text-sm text-gray-600">{ride.destinationLocation?.address || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Fare</p>
                        <p className="text-sm text-gray-600">{formatCurrency(ride.estimatedFare?.total || 0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Specialty Information Preview */}
                  {ride.specialtyData && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">Specialty Details:</div>
                      {ride.rideType === 'tow_truck' && (
                        <div className="text-xs text-gray-600">
                          <strong>Vehicle:</strong> {ride.specialtyData.vehicleYear} {ride.specialtyData.vehicleMake} {ride.specialtyData.vehicleModel} | 
                          <strong> Plate:</strong> {ride.specialtyData.licensePlate}
                        </div>
                      )}
                      {ride.rideType === 'companion_driver' && (
                        <div className="text-xs text-gray-600">
                          <strong>Reason:</strong> {ride.specialtyData.reasonForCompanion} | 
                          <strong> Security:</strong> {ride.specialtyData.securityLevel}
                        </div>
                      )}
                      {ride.rideType === 'medical' && (
                        <div className="text-xs text-gray-600">
                          <strong>Condition:</strong> {ride.specialtyData.medicalCondition} | 
                          <strong> Appointment:</strong> {ride.specialtyData.appointmentType}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(ride.createdAt?.toDate?.() || ride.createdAt)}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleViewDetails(ride)}
                        variant="outline"
                        size="small"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {ride.status === 'pending' && (
                        <Button
                          onClick={() => handleUpdateStatus(ride.id, 'active')}
                          variant="primary"
                          size="small"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {ride.status === 'active' && (
                        <Button
                          onClick={() => handleUpdateStatus(ride.id, 'completed')}
                          variant="primary"
                          size="small"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Specialty Ride Details"
        size="large"
      >
        {selectedRide && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ride Type</label>
                <p className="text-sm text-gray-900">{selectedRide.rideType?.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-sm text-gray-900">{selectedRide.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                <p className="text-sm text-gray-900">{selectedRide.pickupLocation?.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <p className="text-sm text-gray-900">{selectedRide.destinationLocation?.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Fare</label>
                <p className="text-sm text-gray-900">{formatCurrency(selectedRide.estimatedFare?.total || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900">{formatDate(selectedRide.createdAt?.toDate?.() || selectedRide.createdAt)}</p>
              </div>
            </div>

            {selectedRide.specialtyData && (
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Specialty Requirements</h4>
                {selectedRide.rideType === 'tow_truck' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Make</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.vehicleMake}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Model</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.vehicleModel}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Year</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.vehicleYear}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">License Plate</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.licensePlate}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Condition</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.vehicleCondition}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Towing Destination</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.towingDestination}</p>
                    </div>
                  </div>
                )}
                {selectedRide.rideType === 'companion_driver' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.reasonForCompanion}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Security Level</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.securityLevel}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.estimatedDuration}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Advance Booking</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.advanceBooking ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}
                {selectedRide.rideType === 'medical' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Medical Condition</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.medicalCondition}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Appointment Type</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.appointmentType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Special Equipment</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.specialEquipment?.join(', ')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                      <p className="text-sm text-gray-900">{selectedRide.specialtyData.emergencyContact}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SpecialtyRideManagement;
