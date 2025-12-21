import React, { useState } from 'react';
import { 
  XMarkIcon, 
  MapPinIcon, 
  ClockIcon, 
  UserIcon,
  PhoneIcon,
  TruckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const RideDetailsModal = ({ open, onClose, ride, user, onShowDriverTracking, onAssignDriver }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRide, setEditedRide] = useState(null);
  const [updating, setUpdating] = useState(false);

  React.useEffect(() => {
    if (ride) {
      setEditedRide({
        status: ride.Status || ride._originalData?.status,
        specialInstructions: ride._originalData?.specialInstructions || '',
        estimatedDuration: ride._originalData?.estimatedDuration || 60,
        patientNotes: ride._originalData?.patientNotes || ''
      });
    }
  }, [ride]);

  const statusColors = {
    'scheduled': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'assigned': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'in_progress': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'completed': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
    'postponed': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    'cancelled': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (location) => {
    if (!location) return 'Address not specified';
    
    if (location.facilityName) {
      return `${location.facilityName}, ${location.address}`;
    }
    
    return location.address || 'Address not specified';
  };

  const handleStatusChange = (newStatus) => {
    setEditedRide(prev => ({ ...prev, status: newStatus }));
  };

  const handleSaveChanges = async () => {
    if (!ride?.Id || !editedRide) return;

    setUpdating(true);
    try {
      const updateData = {
        status: editedRide.status,
        specialInstructions: editedRide.specialInstructions,
        estimatedDuration: parseInt(editedRide.estimatedDuration),
        patientNotes: editedRide.patientNotes,
        updatedAt: serverTimestamp(),
        lastModifiedBy: user.uid,
        auditLog: [
          ...(ride._originalData?.auditLog || []),
          {
            action: 'ride_updated',
            timestamp: new Date().toISOString(),
            userId: user.uid,
            userRole: user.role,
            changes: {
              status: { old: ride.Status, new: editedRide.status },
              specialInstructions: { old: ride._originalData?.specialInstructions, new: editedRide.specialInstructions },
              estimatedDuration: { old: ride._originalData?.estimatedDuration, new: editedRide.estimatedDuration }
            }
          }
        ]
      };

      await updateDoc(doc(db, 'medicalRideSchedule', ride.Id), updateData);
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('Error updating ride:', error);
      alert('Error updating ride. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (!open || !ride) return null;

  // Handle different ride data structures (medical rides vs regular rides)
  const rideData = {
    id: ride.id || ride.Id || ride.rideId,
    status: editedRide?.status || ride?.status || ride?.Status || 'scheduled',
    patientId: ride.patientId || ride.PatientId,
    appointmentType: ride.appointmentType || ride.AppointmentType,
    pickupLocation: ride.pickupLocation || ride.PickupLocation,
    dropoffLocation: ride.dropoffLocation || ride.DropoffLocation,
    appointmentDateTime: ride.appointmentDateTime || ride.AppointmentDateTime || ride.pickupDateTime,
    assignedDriverId: ride.assignedDriverId || ride.AssignedDriverId || ride.driverId,
    medicalRequirements: ride.medicalRequirements || ride.MedicalRequirements
  };

  const currentStatus = rideData.status;
  const statusStyle = statusColors[currentStatus] || statusColors.assigned;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Dialog */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Ride Details
              </h3>
              <div className="flex items-center space-x-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editedRide.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-48 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="postponed">Postponed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              ) : (
                <span 
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  {currentStatus === 'completed' && <CheckCircleIcon className="h-4 w-4 mr-1" />}
                  {currentStatus === 'cancelled' && <ExclamationTriangleIcon className="h-4 w-4 mr-1" />}
                  {(currentStatus || 'scheduled').replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Patient Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    Patient Information
                  </h4>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm"><strong>Patient ID:</strong> {rideData.patientId}</p>
                    <p className="text-sm"><strong>Appointment Type:</strong> {rideData.appointmentType}</p>
                    <p className="text-sm"><strong>Organization:</strong> {ride.OrganizationName}</p>
                  </div>
                </div>

                {/* Scheduling */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Scheduling
                  </h4>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm"><strong>Appointment Time:</strong><br />{formatDateTime(ride.StartTime)}</p>
                    <p className="text-sm mt-2">
                      <strong>Duration:</strong> 
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedRide.estimatedDuration}
                          onChange={(e) => setEditedRide(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                          className="ml-1 w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                          min="15"
                          max="300"
                        />
                      ) : (
                        ` ${ride._originalData?.estimatedDuration || 60}`
                      )} minutes
                    </p>
                  </div>
                </div>

                {/* Driver Information */}
                {ride.DriverInfo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <TruckIcon className="h-4 w-4 mr-1" />
                      Driver Information
                    </h4>
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="text-sm"><strong>Name:</strong> {ride.DriverInfo.name}</p>
                      <p className="text-sm"><strong>Phone:</strong> {ride.DriverInfo.phone}</p>
                      <p className="text-sm"><strong>Vehicle:</strong> {ride.DriverInfo.vehicle}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Locations */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    Locations
                  </h4>
                  <div className="bg-gray-50 rounded-md p-3">
                    <div className="mb-3">
                      <p className="text-xs font-medium text-green-600">PICKUP</p>
                      <p className="text-sm">{formatAddress(ride.PickupLocation)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-600">DROPOFF</p>
                      <p className="text-sm">{formatAddress(ride.DropoffLocation)}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    Notes & Instructions
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Special Instructions</label>
                      {isEditing ? (
                        <textarea
                          value={editedRide.specialInstructions}
                          onChange={(e) => setEditedRide(prev => ({ ...prev, specialInstructions: e.target.value }))}
                          className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          rows="2"
                          placeholder="Enter special instructions..."
                        />
                      ) : (
                        <p className="text-sm bg-white rounded-md p-2 border">
                          {ride._originalData?.specialInstructions || 'No special instructions'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700">Patient Notes</label>
                      {isEditing ? (
                        <textarea
                          value={editedRide.patientNotes}
                          onChange={(e) => setEditedRide(prev => ({ ...prev, patientNotes: e.target.value }))}
                          className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          rows="2"
                          placeholder="Enter patient notes..."
                        />
                      ) : (
                        <p className="text-sm bg-white rounded-md p-2 border">
                          {ride._originalData?.patientNotes || 'No patient notes'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {!isEditing && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Driver-related actions */}
                  {ride.DriverInfo?.phone && (
                    <>
                      <a
                        href={`tel:${ride.DriverInfo.phone}`}
                        className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                      >
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        Call Driver
                      </a>
                      {onShowDriverTracking && (
                        <button
                          onClick={onShowDriverTracking}
                          className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                        >
                          <TruckIcon className="h-4 w-4 mr-1" />
                          Track Driver
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Assignment action for unassigned rides */}
                  {!ride.DriverInfo && onAssignDriver && (
                    <button
                      onClick={onAssignDriver}
                      className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 col-span-full"
                    >
                      <TruckIcon className="h-4 w-4 mr-1" />
                      Find & Notify Drivers
                    </button>
                  )}
                  
                  {/* Location actions */}
                  {ride.PickupLocation?.address && (
                    <a
                      href={`https://maps.google.com/maps?q=${encodeURIComponent(ride.PickupLocation.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                    >
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      View Pickup
                    </a>
                  )}
                  
                  {ride.DropoffLocation?.address && (
                    <a
                      href={`https://maps.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ride.PickupLocation?.address || '')}&destination=${encodeURIComponent(ride.DropoffLocation.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                    >
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      View Route
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Edit Mode Actions */}
            {isEditing && (
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {updating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideDetailsModal;
