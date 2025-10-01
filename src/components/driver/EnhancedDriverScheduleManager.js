import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  TruckIcon,
  HeartIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import medicalDriverIntegrationService from '../../services/medicalDriverIntegrationService';
import scheduledRidesService from '../../services/scheduledRidesService';
import toast from 'react-hot-toast';

/**
 * Enhanced Driver Schedule Manager
 * Works for both web and mobile apps
 * Shows unified schedule of medical and regular rides
 * Allows schedule editing (delay, cancel, reschedule)
 */
const EnhancedDriverScheduleManager = ({ 
  driverId, 
  viewMode = 'day', // day, week, month
  showMedicalRides = true,
  showRegularRides = true,
  allowEditing = true,
  onScheduleChange,
  isMobile = false
}) => {
  const [schedule, setSchedule] = useState({
    medicalRides: [],
    regularRides: [],
    availability: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (driverId) {
      loadDriverSchedule();
    }
  }, [driverId, selectedDate, viewMode]);

  const loadDriverSchedule = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);

      if (viewMode === 'day') {
        endDate.setDate(startDate.getDate() + 1);
      } else if (viewMode === 'week') {
        endDate.setDate(startDate.getDate() + 7);
      } else if (viewMode === 'month') {
        endDate.setMonth(startDate.getMonth() + 1);
      }

      const [medicalResult, regularResult] = await Promise.all([
        showMedicalRides ? medicalDriverIntegrationService.getDriverMedicalSchedule(driverId, startDate, endDate) : { data: [] },
        showRegularRides ? scheduledRidesService.getDriverSchedule(driverId, startDate, endDate) : { data: [] }
      ]);

      setSchedule({
        medicalRides: medicalResult.data || [],
        regularRides: regularResult.data || [],
        availability: {} // Could load from driver availability settings
      });
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleRideEdit = (ride) => {
    setSelectedRide(ride);
    setEditForm({
      newTime: ride.pickupDateTime || ride.scheduledDateTime,
      reason: '',
      action: 'delay' // delay, cancel, reschedule
    });
    setShowEditModal(true);
  };

  const handleRideUpdate = async () => {
    if (!selectedRide || !editForm.action) return;

    try {
      if (editForm.action === 'cancel') {
        if (selectedRide.sourceType === 'medical_portal') {
          await medicalDriverIntegrationService.updateMedicalRideStatus(
            selectedRide.id, 
            'cancelled', 
            { cancellationReason: editForm.reason }
          );
        } else {
          await scheduledRidesService.cancelScheduledRide(selectedRide.id, editForm.reason);
        }
        toast.success('Ride cancelled successfully');
      } else if (editForm.action === 'delay') {
        // Update ride time
        const newDateTime = new Date(editForm.newTime);
        if (selectedRide.sourceType === 'medical_portal') {
          await medicalDriverIntegrationService.updateMedicalRideStatus(
            selectedRide.id, 
            'rescheduled', 
            { 
              newPickupDateTime: newDateTime.toISOString(),
              rescheduleReason: editForm.reason
            }
          );
        } else {
          await scheduledRidesService.updateScheduledRide(selectedRide.id, {
            scheduledDateTime: newDateTime.toISOString(),
            reason: editForm.reason
          });
        }
        toast.success('Ride rescheduled successfully');
      }

      setShowEditModal(false);
      setSelectedRide(null);
      loadDriverSchedule();
      onScheduleChange?.();
    } catch (error) {
      console.error('Error updating ride:', error);
      toast.error('Failed to update ride');
    }
  };

  const getRideTypeIcon = (rideType, sourceType) => {
    if (sourceType === 'medical_portal') {
      return HeartIcon;
    }
    
    const icons = {
      standard: '🚗',
      premium: '✨',
      wheelchair: '♿',
      tow_truck: TruckIcon,
      companion_driver: UserGroupIcon,
      pet_friendly: '🐕',
      large: '🚐'
    };
    return icons[rideType] || icons.standard;
  };

  const getRideTypeColor = (rideType, sourceType) => {
    if (sourceType === 'medical_portal') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    const colors = {
      standard: 'bg-gray-100 text-gray-800 border-gray-200',
      premium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      wheelchair: 'bg-green-100 text-green-800 border-green-200',
      tow_truck: 'bg-orange-100 text-orange-800 border-orange-200',
      companion_driver: 'bg-blue-100 text-blue-800 border-blue-200',
      pet_friendly: 'bg-purple-100 text-purple-800 border-purple-200',
      large: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[rideType] || colors.standard;
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      active: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.scheduled;
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAllRides = () => {
    const allRides = [];
    
    if (showMedicalRides) {
      allRides.push(...schedule.medicalRides.map(ride => ({
        ...ride,
        sourceType: 'medical_portal',
        rideType: 'medical',
        displayTime: ride.pickupDateTime || ride.appointmentDateTime
      })));
    }
    
    if (showRegularRides) {
      allRides.push(...schedule.regularRides.map(ride => ({
        ...ride,
        sourceType: 'regular',
        displayTime: ride.scheduledDateTime
      })));
    }
    
    return allRides.sort((a, b) => new Date(a.displayTime) - new Date(b.displayTime));
  };

  const handleDateChange = (direction) => {
    const newDate = new Date(selectedDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading schedule...</span>
        </div>
      </div>
    );
  }

  const allRides = getAllRides();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            My Schedule
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            Today
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex space-x-1 mt-4">
          {['day', 'week', 'month'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm rounded-lg capitalize ${
                viewMode === mode
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900">
              {viewMode === 'day' && formatDate(selectedDate)}
              {viewMode === 'week' && `${formatDate(selectedDate)} - ${formatDate(new Date(selectedDate.getTime() + 6 * 24 * 60 * 60 * 1000))}`}
              {viewMode === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          <button
            onClick={() => handleDateChange(1)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Schedule Content */}
      <div className="space-y-4">
        {allRides.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled rides</h3>
            <p className="text-gray-600">
              You don't have any rides scheduled for this {viewMode}.
            </p>
          </div>
        ) : (
          allRides.map((ride) => (
            <RideCard
              key={`${ride.sourceType}-${ride.id}`}
              ride={ride}
              onEdit={allowEditing ? handleRideEdit : null}
              getRideTypeIcon={getRideTypeIcon}
              getRideTypeColor={getRideTypeColor}
              getStatusColor={getStatusColor}
              formatTime={formatTime}
              formatDate={formatDate}
              isMobile={isMobile}
            />
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedRide && (
        <EditRideModal
          ride={selectedRide}
          formData={editForm}
          onFormChange={setEditForm}
          onSave={handleRideUpdate}
          onCancel={() => setShowEditModal(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

const RideCard = ({ 
  ride, 
  onEdit, 
  getRideTypeIcon, 
  getRideTypeColor, 
  getStatusColor, 
  formatTime, 
  formatDate,
  isMobile = false
}) => {
  const IconComponent = getRideTypeIcon(ride.rideType, ride.sourceType);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
      getRideTypeColor(ride.rideType, ride.sourceType)
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Ride Type Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
            {typeof IconComponent === 'string' ? (
              <span className="text-lg">{IconComponent}</span>
            ) : (
              <IconComponent className="h-5 w-5" />
            )}
          </div>

          {/* Ride Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ride.status)}`}>
                {ride.status}
              </span>
              {ride.sourceType === 'medical_portal' && (
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                  Medical
                </span>
              )}
            </div>

            <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : 'text-base'} mb-1`}>
              {ride.sourceType === 'medical_portal' 
                ? `${ride.patientId} - ${ride.appointmentType}`
                : `${ride.rideType.replace('_', ' ')} Ride`
              }
            </h4>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {ride.pickupLocation?.address || ride.pickup?.address}
                </span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {ride.dropoffLocation?.address || ride.destination?.address}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Time and Actions */}
        <div className="flex flex-col items-end space-y-2">
          <div className="text-right">
            <div className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
              {formatTime(ride.displayTime)}
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(ride.displayTime)}
            </div>
          </div>

          {onEdit && ['scheduled', 'assigned', 'confirmed'].includes(ride.status) && (
            <button
              onClick={() => onEdit(ride)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EditRideModal = ({ ride, formData, onFormChange, onSave, onCancel, isMobile = false }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-md ${isMobile ? 'mx-4' : ''}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Ride</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={formData.action}
              onChange={(e) => onFormChange({ ...formData, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="delay">Delay/Reschedule</option>
              <option value="cancel">Cancel Ride</option>
            </select>
          </div>

          {formData.action === 'delay' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Time
              </label>
              <input
                type="datetime-local"
                value={formData.newTime ? new Date(formData.newTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => onFormChange({ ...formData, newTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => onFormChange({ ...formData, reason: e.target.value })}
              rows={3}
              placeholder="Explain the reason for this change..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Ride
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDriverScheduleManager;