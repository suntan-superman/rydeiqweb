import React, { useState, useEffect } from 'react';
import { 
  MapIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import medicalAppointmentService from '../../services/medicalAppointmentService';

const DispatcherDashboard = ({ user }) => {
  const [activeRides, setActiveRides] = useState([]);
  const [pendingRides, setPendingRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    // Load medical appointments using the new service
    loadMedicalAppointments();
    
    // Set up real-time listener for medical appointments
    const unsubscribe = medicalAppointmentService.subscribeToAppointments((appointments) => {
      // Separate active and pending appointments
      const active = appointments.filter(apt => 
        ['assigned', 'in_progress'].includes(apt.status)
      );
      const pending = appointments.filter(apt => 
        ['scheduled'].includes(apt.status)
      );

      setActiveRides(active);
      setPendingRides(pending);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const loadMedicalAppointments = async () => {
    try {
      // Load all appointments for the organization
      const appointments = await medicalAppointmentService.getAllAppointments(100);
      
      // Separate active and pending appointments
      const active = appointments.filter(apt => 
        ['assigned', 'in_progress'].includes(apt.status)
      );
      const pending = appointments.filter(apt => 
        ['scheduled'].includes(apt.status)
      );

      setActiveRides(active);
      setPendingRides(pending);
    } catch (error) {
      console.error('Error loading medical appointments:', error);
    }
  };

  const updateRideStatus = async (rideId, newStatus, notes = '') => {
    try {
      // Use the medical appointment service to update status
      let result;
      
      if (newStatus === 'assigned') {
        result = await medicalAppointmentService.assignDriver(rideId, selectedRide?.driverId, user.uid);
      } else if (newStatus === 'in_progress') {
        result = await medicalAppointmentService.startRide(rideId, selectedRide?.driverId);
      } else if (newStatus === 'completed') {
        result = await medicalAppointmentService.completeRide(rideId, { notes });
      } else if (newStatus === 'cancelled') {
        result = await medicalAppointmentService.cancelAppointment(rideId, notes);
      } else {
        // For other statuses, use the updatePairStatus method
        result = await medicalAppointmentService.updatePairStatus(rideId, newStatus, { 
          notes,
          dispatcherId: user.uid,
          updatedAt: new Date().toISOString()
        });
      }
      
      if (!result.success) {
        console.error('Error updating appointment status:', result.error);
        alert('Error updating appointment status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Error updating appointment status. Please try again.');
    }
  };

  const flagIncident = async (rideId, incidentType, description) => {
    try {
      await updateDoc(doc(db, 'medicalRideRequests', rideId), {
        incident: {
          type: incidentType,
          description,
          reportedAt: new Date().toISOString(),
          reportedBy: user.uid,
          status: 'reported'
        },
        auditLog: [
          ...selectedRide?.auditLog || [],
          {
            action: 'incident_reported',
            timestamp: new Date().toISOString(),
            userId: user.uid,
            userRole: user.role,
            incidentType,
            description
          }
        ]
      });
      alert('Incident reported successfully.');
    } catch (error) {
      console.error('Error reporting incident:', error);
      alert('Error reporting incident. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'assigned': 
      case 'in_progress': return CheckCircleIcon;
      case 'completed': return CheckCircleIcon;
      case 'cancelled': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const RideCard = ({ ride, onClick }) => {
    const StatusIcon = getStatusIcon(ride.status);
    const isUrgent = ride.appointmentType === 'Emergency' || 
                     new Date(ride.appointmentDate + 'T' + ride.appointmentTime) - new Date() < 3600000; // 1 hour

    return (
      <div 
        onClick={() => onClick(ride)}
        className={`bg-white border-l-4 shadow rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
          isUrgent ? 'border-red-500' : 'border-gray-300'
        } ${selectedRide?.id === ride.id ? 'ring-2 ring-green-500' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <StatusIcon className="h-5 w-5 text-gray-400" />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                {ride.status.replace('_', ' ').toUpperCase()}
              </span>
              {isUrgent && (
                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" title="Urgent" />
              )}
            </div>
            
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Patient ID: {ride.patientId || 'Not specified'}
              </p>
              <p className="text-sm text-gray-600">
                {ride.appointmentType} - {ride.appointmentDate} at {ride.appointmentTime}
              </p>
              <p className="text-xs text-gray-500">
                From: {ride.pickupLocation?.facilityName || ride.pickupLocation?.address}
              </p>
              <p className="text-xs text-gray-500">
                To: {ride.dropoffLocation?.facilityName || ride.dropoffLocation?.address}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <span className="text-xs text-gray-500">
              {new Date(ride.createdAt?.toDate?.() || ride.createdAt).toLocaleTimeString()}
            </span>
            {ride.driverInfo && (
              <span className="text-xs text-blue-600">
                Driver: {ride.driverInfo.name}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const RideDetailsPanel = ({ ride, onClose }) => {
    const [incidentForm, setIncidentForm] = useState({ type: '', description: '' });
    const [showIncidentForm, setShowIncidentForm] = useState(false);

    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Ride Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Patient Information</h4>
            <div className="bg-gray-50 p-3 rounded-md space-y-1">
              <p className="text-sm"><strong>Patient ID:</strong> {ride.patientId}</p>
              <p className="text-sm"><strong>Appointment:</strong> {ride.appointmentType}</p>
              <p className="text-sm"><strong>Date/Time:</strong> {ride.appointmentDate} at {ride.appointmentTime}</p>
            </div>
          </div>

          {/* Transportation Details */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Transportation</h4>
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm font-medium text-green-800">Pickup</p>
                <p className="text-sm text-green-700">{ride.pickupLocation?.facilityName}</p>
                <p className="text-sm text-green-600">{ride.pickupLocation?.address}</p>
                {ride.pickupLocation?.contactNumber && (
                  <p className="text-sm text-green-600">Contact: {ride.pickupLocation.contactNumber}</p>
                )}
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm font-medium text-blue-800">Dropoff</p>
                <p className="text-sm text-blue-700">{ride.dropoffLocation?.facilityName}</p>
                <p className="text-sm text-blue-600">{ride.dropoffLocation?.address}</p>
                {ride.dropoffLocation?.contactNumber && (
                  <p className="text-sm text-blue-600">Contact: {ride.dropoffLocation.contactNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Special Needs */}
          {ride.patientInfo && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Special Requirements</h4>
              <div className="bg-yellow-50 p-3 rounded-md">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <input type="checkbox" checked={ride.patientInfo.wheelchairRequired} disabled className="mr-2" />
                    <span>Wheelchair</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" checked={ride.patientInfo.oxygenRequired} disabled className="mr-2" />
                    <span>Oxygen</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" checked={ride.patientInfo.needsAssistance} disabled className="mr-2" />
                    <span>Assistance</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" checked={ride.patientInfo.companionAllowed} disabled className="mr-2" />
                    <span>Companion</span>
                  </div>
                </div>
                {ride.patientInfo.medicalEquipment && (
                  <p className="text-sm mt-2"><strong>Equipment:</strong> {ride.patientInfo.medicalEquipment}</p>
                )}
                {ride.patientInfo.specialNeeds && (
                  <p className="text-sm mt-2"><strong>Notes:</strong> {ride.patientInfo.specialNeeds}</p>
                )}
              </div>
            </div>
          )}

          {/* Driver Information */}
          {ride.driverInfo && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Assigned Driver</h4>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm"><strong>Name:</strong> {ride.driverInfo.name}</p>
                <p className="text-sm"><strong>Phone:</strong> {ride.driverInfo.phone}</p>
                <p className="text-sm"><strong>Vehicle:</strong> {ride.driverInfo.vehicle}</p>
                <div className="flex space-x-2 mt-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    Call Driver
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">
                    <ChatBubbleLeftIcon className="h-4 w-4 inline mr-1" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {ride.emergencyContact?.name && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Emergency Contact</h4>
              <div className="bg-red-50 p-3 rounded-md">
                <p className="text-sm"><strong>Name:</strong> {ride.emergencyContact.name}</p>
                <p className="text-sm"><strong>Phone:</strong> {ride.emergencyContact.phone}</p>
                <p className="text-sm"><strong>Relationship:</strong> {ride.emergencyContact.relationship}</p>
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Actions</h4>
            <div className="flex flex-wrap gap-2">
              {ride.status === 'pending' && (
                <button
                  onClick={() => updateRideStatus(ride.id, 'cancelled', 'Cancelled by dispatcher')}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Cancel Ride
                </button>
              )}
              
              {ride.status === 'assigned' && (
                <button
                  onClick={() => updateRideStatus(ride.id, 'in_progress', 'Ride started')}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Mark In Progress
                </button>
              )}

              <button
                onClick={() => setShowIncidentForm(!showIncidentForm)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
              >
                <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                Report Incident
              </button>
            </div>

            {/* Incident Form */}
            {showIncidentForm && (
              <div className="mt-4 p-4 border border-yellow-200 rounded-md bg-yellow-50">
                <h5 className="font-medium text-gray-900 mb-2">Report Incident</h5>
                <div className="space-y-2">
                  <select
                    value={incidentForm.type}
                    onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value })}
                    className="block w-full border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select incident type</option>
                    <option value="delay">Delay</option>
                    <option value="medical_emergency">Medical Emergency</option>
                    <option value="vehicle_issue">Vehicle Issue</option>
                    <option value="driver_issue">Driver Issue</option>
                    <option value="patient_issue">Patient Issue</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                    placeholder="Describe the incident..."
                    rows={3}
                    className="block w-full border-gray-300 rounded-md text-sm"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        flagIncident(ride.id, incidentForm.type, incidentForm.description);
                        setIncidentForm({ type: '', description: '' });
                        setShowIncidentForm(false);
                      }}
                      disabled={!incidentForm.type || !incidentForm.description}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Submit Report
                    </button>
                    <button
                      onClick={() => setShowIncidentForm(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filteredRides = [...activeRides, ...pendingRides].filter(ride => {
    if (filterStatus === 'all') return true;
    return ride.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Rides</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-700'}`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-sm ${viewMode === 'map' ? 'bg-green-600 text-white' : 'text-gray-700'}`}
            >
              <MapIcon className="h-4 w-4 inline mr-1" />
              Map View
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {activeRides.length} Active • {pendingRides.length} Pending
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rides List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredRides.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No rides found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filterStatus === 'all' ? 'No rides to display.' : `No ${filterStatus} rides found.`}
              </p>
            </div>
          ) : (
            filteredRides.map(ride => (
              <RideCard key={ride.id} ride={ride} onClick={setSelectedRide} />
            ))
          )}
        </div>

        {/* Ride Details */}
        <div className="lg:col-span-1">
          {selectedRide ? (
            <RideDetailsPanel ride={selectedRide} onClose={() => setSelectedRide(null)} />
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm">Select a ride to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
