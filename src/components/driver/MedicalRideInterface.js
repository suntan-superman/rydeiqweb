import React, { useState, useEffect, useCallback } from 'react';
import { 
  HeartIcon, 
  MapPinIcon, 
  ClockIcon, 
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import medicalAppointmentService from '../../services/medicalAppointmentService';
import toast from 'react-hot-toast';

const MedicalRideInterface = ({ driverId }) => {
  const [medicalAppointments, setMedicalAppointments] = useState([]);
  const [currentAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, assigned, in_progress, completed
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const loadMedicalAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const appointments = await medicalAppointmentService.getAppointmentsForDriver(driverId, 50);
      setMedicalAppointments(appointments);
    } catch (error) {
      console.error('Error loading medical appointments:', error);
      toast.error('Failed to load medical appointments');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadMedicalAppointments();
  }, [loadMedicalAppointments]);

  const handleStartMedicalRide = async (appointmentId) => {
    try {
      const result = await medicalAppointmentService.startRide(appointmentId, driverId);
      if (result.success) {
        toast.success('Medical ride started successfully');
        loadMedicalAppointments();
      } else {
        toast.error('Failed to start medical ride');
      }
    } catch (error) {
      console.error('Error starting medical ride:', error);
      toast.error('Error starting medical ride');
    }
  };

  const handleCompleteMedicalRide = async (appointmentId) => {
    try {
      const result = await medicalAppointmentService.completeRide(appointmentId, {
        completionNotes: 'Medical ride completed successfully',
        patientCondition: 'Good',
        specialInstructions: 'No issues reported'
      });
      if (result.success) {
        toast.success('Medical ride completed successfully');
        loadMedicalAppointments();
      } else {
        toast.error('Failed to complete medical ride');
      }
    } catch (error) {
      console.error('Error completing medical ride:', error);
      toast.error('Error completing medical ride');
    }
  };

  const handleCancelMedicalRide = async (appointmentId) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (reason) {
      try {
        const result = await medicalAppointmentService.cancelAppointment(appointmentId, reason);
        if (result.success) {
          toast.success('Medical ride cancelled');
          loadMedicalAppointments();
        } else {
          toast.error('Failed to cancel medical ride');
        }
      } catch (error) {
        console.error('Error cancelling medical ride:', error);
        toast.error('Error cancelling medical ride');
      }
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeIcon = (appointmentType) => {
    switch (appointmentType?.toLowerCase()) {
      case 'dialysis':
        return '🩸';
      case 'chemotherapy':
        return '💊';
      case 'physical therapy':
        return '🏃';
      case 'surgery':
        return '🏥';
      case 'mental health':
        return '🧠';
      case 'emergency':
        return '🚨';
      default:
        return '🏥';
    }
  };

  const filteredAppointments = medicalAppointments.filter(appointment => {
    switch (filter) {
      case 'assigned':
        return appointment.status === 'assigned';
      case 'in_progress':
        return appointment.status === 'in_progress';
      case 'completed':
        return appointment.status === 'completed';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading medical appointments...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <HeartIcon className="h-8 w-8 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">Medical Transportation</h2>
        </div>
        <p className="text-gray-600">Manage medical appointments and special transport needs</p>
      </div>

      {/* Medical Transport Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <ShieldCheckIcon className="h-6 w-6 text-red-600 mt-1" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Medical Transport Requirements</h3>
            <p className="text-sm text-red-700 mt-1">
              Medical rides require special handling, documentation, and compliance with healthcare regulations. 
              Please ensure you have the necessary certifications and follow all safety protocols.
            </p>
          </div>
        </div>
      </div>

      {/* Current Medical Ride */}
      {currentAppointment && (
        <div className="bg-white border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Medical Ride</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentAppointment.status)}`}>
              {currentAppointment.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getAppointmentTypeIcon(currentAppointment.appointmentType)}</span>
                <div>
                  <p className="font-medium text-gray-900">Appointment Type</p>
                  <p className="text-sm text-gray-600">{currentAppointment.appointmentType}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Pickup Location</p>
                  <p className="text-sm text-gray-600">{currentAppointment.pickupLocation?.address || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-red-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Medical Facility</p>
                  <p className="text-sm text-gray-600">{currentAppointment.dropoffLocation?.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <ClockIcon className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Scheduled Time</p>
                  <p className="text-sm text-gray-600">{formatTime(currentAppointment.scheduledDate)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <UserIcon className="h-5 w-5 text-gray-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Patient</p>
                  <p className="text-sm text-gray-600">{currentAppointment.patientInfo?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <PhoneIcon className="h-5 w-5 text-gray-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Emergency Contact</p>
                  <p className="text-sm text-gray-600">{currentAppointment.emergencyContact?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          {currentAppointment.patientInfo && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-2">Special Requirements</p>
              <div className="flex flex-wrap gap-2">
                {currentAppointment.patientInfo.wheelchairRequired && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ♿ Wheelchair Required
                  </span>
                )}
                {currentAppointment.patientInfo.oxygenRequired && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    🫁 Oxygen Required
                  </span>
                )}
                {currentAppointment.patientInfo.needsAssistance && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🤝 Assistance Required
                  </span>
                )}
                {currentAppointment.patientInfo.companionAllowed && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    👥 Companion Allowed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => handleStartMedicalRide(currentAppointment.id)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Start Medical Ride</span>
            </button>
            <button
              onClick={() => handleCompleteMedicalRide(currentAppointment.id)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Complete Ride</span>
            </button>
            <button
              onClick={() => handleCancelMedicalRide(currentAppointment.id)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <XCircleIcon className="h-4 w-4" />
              <span>Cancel Ride</span>
            </button>
          </div>
        </div>
      )}

      {/* Medical Appointments List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Medical Appointments</h3>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Appointments</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="text-center py-8">
            <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No medical appointments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getAppointmentTypeIcon(appointment.appointmentType)}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{appointment.appointmentType}</h4>
                      <p className="text-sm text-gray-600">{formatDate(appointment.scheduledDate)} at {formatTime(appointment.scheduledDate)}</p>
                      <p className="text-sm text-gray-600">
                        {appointment.pickupLocation?.address || 'N/A'} → {appointment.dropoffLocation?.address || 'N/A'}
                      </p>
                      {appointment.patientInfo && (
                        <p className="text-sm text-gray-600">Patient: {appointment.patientInfo.name || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowAppointmentDetails(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                      {appointment.status === 'assigned' && (
                        <button
                          onClick={() => handleStartMedicalRide(appointment.id)}
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          Start Ride
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {showAppointmentDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
                <button
                  onClick={() => setShowAppointmentDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedAppointment.appointmentType}</h4>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedAppointment.scheduledDate)} at {formatTime(selectedAppointment.scheduledDate)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900">Pickup Location</p>
                  <p className="text-sm text-gray-600">{selectedAppointment.pickupLocation?.address || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900">Medical Facility</p>
                  <p className="text-sm text-gray-600">{selectedAppointment.dropoffLocation?.address || 'N/A'}</p>
                </div>
                
                {selectedAppointment.patientInfo && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Patient Information</p>
                    <p className="text-sm text-gray-600">Name: {selectedAppointment.patientInfo.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Phone: {selectedAppointment.patientInfo.phone || 'N/A'}</p>
                  </div>
                )}
                
                {selectedAppointment.emergencyContact && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Emergency Contact</p>
                    <p className="text-sm text-gray-600">Name: {selectedAppointment.emergencyContact.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Phone: {selectedAppointment.emergencyContact.phone || 'N/A'}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAppointmentDetails(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Close
                </button>
                {selectedAppointment.status === 'assigned' && (
                  <button
                    onClick={() => {
                      handleStartMedicalRide(selectedAppointment.id);
                      setShowAppointmentDetails(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                  >
                    Start Ride
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRideInterface;
