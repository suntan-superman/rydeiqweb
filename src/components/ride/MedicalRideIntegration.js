import React, { useState, useEffect } from 'react';
import { 
  HeartIcon, 
  CalendarDaysIcon, 
  MapPinIcon, 
  ClockIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import medicalAppointmentService from '../../services/medicalAppointmentService';
import rideRequestService from '../../services/rideRequestService';
import toast from 'react-hot-toast';

const MedicalRideIntegration = ({ user, onRideRequest }) => {
  const [medicalAppointments, setMedicalAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (user?.userType === 'passenger' || user?.userTypes?.includes('passenger')) {
      loadMedicalAppointments();
    }
  }, [user]);

  const loadMedicalAppointments = async () => {
    try {
      setLoading(true);
      const appointments = await medicalAppointmentService.getAppointmentsForPatient(user.uid, 10);
      setMedicalAppointments(appointments);
    } catch (error) {
      console.error('Error loading medical appointments:', error);
      toast.error('Failed to load medical appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleBookMedicalRide = (appointment) => {
    setSelectedAppointment(appointment);
    setShowBookingModal(true);
  };

  const handleConfirmMedicalRide = async () => {
    if (!selectedAppointment) return;

    try {
      const rideData = {
        riderId: user.uid,
        pickupLocation: {
          address: selectedAppointment.pickupLocation?.address || 'Medical Facility',
          coordinates: selectedAppointment.pickupLocation?.coordinates
        },
        dropoffLocation: {
          address: selectedAppointment.dropoffLocation?.address || 'Medical Facility',
          coordinates: selectedAppointment.dropoffLocation?.coordinates
        },
        scheduledTime: selectedAppointment.scheduledDate,
        rideType: 'medical',
        preferences: {
          videoEnabled: true,
          companionAllowed: true,
          medicalTransport: true,
          wheelchairAccessible: selectedAppointment.patientInfo?.wheelchairRequired || false,
          oxygenRequired: selectedAppointment.patientInfo?.oxygenRequired || false
        },
        medicalAppointmentId: selectedAppointment.id,
        appointmentType: selectedAppointment.appointmentType,
        patientInfo: selectedAppointment.patientInfo,
        emergencyContact: selectedAppointment.emergencyContact
      };

      const result = await rideRequestService.createRideRequest(rideData);
      if (result.success) {
        toast.success('Medical ride request created successfully');
        setShowBookingModal(false);
        setSelectedAppointment(null);
        onRideRequest?.(result.requestId);
      } else {
        toast.error('Failed to create medical ride request');
      }
    } catch (error) {
      console.error('Error creating medical ride request:', error);
      toast.error('Error creating medical ride request');
    }
  };

  const formatAppointmentDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAppointmentStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'assigned':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAppointmentIcon = (appointmentType) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading medical appointments...</span>
      </div>
    );
  }

  if (medicalAppointments.length === 0) {
    return (
      <div className="text-center p-8">
        <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Appointments</h3>
        <p className="text-gray-600">You don't have any upcoming medical appointments that require transportation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <HeartIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Medical Transportation</h2>
            <p className="text-sm text-gray-600">Book rides for your medical appointments</p>
          </div>
        </div>
      </div>

      {/* Medical Appointments List */}
      <div className="space-y-4">
        {medicalAppointments.map((appointment) => (
          <div key={appointment.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">
                  {getAppointmentIcon(appointment.appointmentType)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {appointment.appointmentType}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAppointmentStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>{formatAppointmentDate(appointment.scheduledDate)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{appointment.dropoffLocation?.address || 'Medical Facility'}</span>
                    </div>
                    
                    {appointment.patientInfo && (
                      <div className="flex items-center space-x-2">
                        <UserGroupIcon className="h-4 w-4" />
                        <span>
                          {appointment.patientInfo.wheelchairRequired && 'Wheelchair • '}
                          {appointment.patientInfo.oxygenRequired && 'Oxygen • '}
                          {appointment.patientInfo.needsAssistance && 'Assistance Required'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                {appointment.status === 'scheduled' && (
                  <button
                    onClick={() => handleBookMedicalRide(appointment)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Book Ride
                  </button>
                )}
                {appointment.status === 'assigned' && (
                  <div className="text-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <span className="text-xs text-green-600">Ride Assigned</span>
                  </div>
                )}
                {appointment.status === 'in_progress' && (
                  <div className="text-center">
                    <ClockIcon className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                    <span className="text-xs text-yellow-600">In Progress</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Medical Ride Booking Modal */}
      {showBookingModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Book Medical Ride</h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedAppointment.appointmentType}</h4>
                  <p className="text-sm text-gray-600">
                    {formatAppointmentDate(selectedAppointment.scheduledDate)}
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Medical Transport Features</span>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Certified medical transport driver</li>
                    <li>• Video recording for safety</li>
                    <li>• Companion assistance allowed</li>
                    <li>• Wheelchair accessible vehicle</li>
                    <li>• Emergency contact notification</li>
                  </ul>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Pickup:</strong> {selectedAppointment.pickupLocation?.address || 'Your location'}</p>
                  <p><strong>Destination:</strong> {selectedAppointment.dropoffLocation?.address || 'Medical facility'}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMedicalRide}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Confirm Medical Ride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRideIntegration;
