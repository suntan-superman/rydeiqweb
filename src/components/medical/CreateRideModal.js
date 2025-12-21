import React, { useState } from 'react';
import { 
  XMarkIcon, 
  MapPinIcon, 
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import driverAssignmentService from '../../services/driverAssignmentService';
import StablePlacesInput from './StablePlacesInput';

const CreateRideModal = ({ open, onClose, initialDateTime, user }) => {
  // Helper function to get default appointment date/time
  const getDefaultDateTime = () => {
    if (initialDateTime) {
      return new Date(initialDateTime).toISOString().slice(0, 16);
    }
    
    // Default to today + next rounded hour
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0); // Round up to next hour
    return nextHour.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
  };

  const [formData, setFormData] = useState({
    patientId: '',
    appointmentType: '',
    appointmentDateTime: getDefaultDateTime(),
    estimatedDuration: 60,
    pickupLocation: {
      facilityName: '',
      address: '',
      specialInstructions: ''
    },
    dropoffLocation: {
      facilityName: '',
      address: '',
      specialInstructions: ''
    },
    specialInstructions: '',
    patientNotes: '',
    requiresWheelchair: false,
    requiresAssistance: false,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });
  
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({});
  const [autoAssignDrivers, setAutoAssignDrivers] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState('');
  
  // Store coordinates for enhanced driver matching
  const [locationCoordinates, setLocationCoordinates] = useState({
    pickup: null,
    dropoff: null
  });

  const appointmentTypes = [
    'Medical Appointment',
    'Dialysis',
    'Physical Therapy',
    'Specialist Consultation',
    'Laboratory Test',
    'Imaging/X-Ray',
    'Surgery',
    'Follow-up Appointment',
    'Emergency Visit',
    'Rehabilitation',
    'Mental Health',
    'Dental Appointment',
    'Pharmacy Pickup',
    'Other'
  ];

  const facilities = [
    'Kern Medical Center',
    'Adventist Health Bakersfield',
    'Mercy Hospitals of Bakersfield',
    'San Joaquin Community Hospital',
    'Bakersfield Heart Hospital',
    'Good Samaritan Hospital',
    'Comprehensive Blood & Cancer Center',
    'Valley Dialysis Center',
    'Bakersfield Imaging Center',
    'Other/Custom'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleLocationChange = (locationType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [locationType]: {
        ...prev[locationType],
        [field]: value
      }
    }));

    // Clear related error
    if (locationType === 'pickupLocation' && field === 'address') {
      setErrors(prev => ({ ...prev, pickupAddress: '' }));
    }
    if (locationType === 'dropoffLocation' && field === 'address') {
      setErrors(prev => ({ ...prev, dropoffAddress: '' }));
    }
  };

  // Handle pickup location selection from Google Places
  const handlePickupLocationSelect = (placeData) => {
    setFormData(prev => ({
      ...prev,
      pickupLocation: {
        ...prev.pickupLocation,
        address: placeData.address,
        facilityName: placeData.facilityName || prev.pickupLocation.facilityName
      }
    }));
    setLocationCoordinates(prev => ({
      ...prev,
      pickup: placeData.coordinates
    }));
    setErrors(prev => ({ ...prev, pickupAddress: '' }));
  };

  // Handle dropoff location selection from Google Places
  const handleDropoffLocationSelect = (placeData) => {
    setFormData(prev => ({
      ...prev,
      dropoffLocation: {
        ...prev.dropoffLocation,
        address: placeData.address,
        facilityName: placeData.facilityName || placeData.name || prev.dropoffLocation.facilityName
      }
    }));
    setLocationCoordinates(prev => ({
      ...prev,
      dropoff: placeData.coordinates
    }));
    setErrors(prev => ({ ...prev, dropoffAddress: '' }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patientId.trim()) {
      newErrors.patientId = 'Patient ID is required';
    }

    if (!formData.appointmentType) {
      newErrors.appointmentType = 'Appointment type is required';
    }

    if (!formData.appointmentDateTime) {
      newErrors.appointmentDateTime = 'Appointment date and time is required';
    } else {
      const appointmentDate = new Date(formData.appointmentDateTime);
      if (appointmentDate <= new Date()) {
        newErrors.appointmentDateTime = 'Appointment must be in the future';
      }
    }

    if (!formData.pickupLocation.address.trim()) {
      newErrors.pickupAddress = 'Pickup address is required';
    }

    if (!formData.dropoffLocation.address.trim()) {
      newErrors.dropoffAddress = 'Dropoff address is required';
    }

    if (formData.estimatedDuration < 15 || formData.estimatedDuration > 480) {
      newErrors.estimatedDuration = 'Duration must be between 15 and 480 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setCreating(true);
    setNotificationStatus('Creating ride...');
    
    try {
      const appointmentDate = new Date(formData.appointmentDateTime);
      const estimatedEndTime = new Date(appointmentDate.getTime() + formData.estimatedDuration * 60000);

      // Use coordinates from Google Places or fallback to geocoding
      setNotificationStatus('Processing location data...');
      let pickupCoords = locationCoordinates.pickup;
      let destinationCoords = locationCoordinates.dropoff;
      
      // Fallback to geocoding if coordinates not available
      if (!pickupCoords) {
        pickupCoords = await driverAssignmentService.geocodeAddress(formData.pickupLocation.address);
      }
      if (!destinationCoords) {
        destinationCoords = await driverAssignmentService.geocodeAddress(formData.dropoffLocation.address);
      }

      const rideData = {
        // Basic Info
        patientId: formData.patientId.trim(),
        appointmentType: formData.appointmentType,
        appointmentDateTime: appointmentDate.toISOString(),
        estimatedEndTime: estimatedEndTime.toISOString(),
        estimatedDuration: parseInt(formData.estimatedDuration),
        
        // Source differentiation for medical portal
        sourceType: 'medical_portal',
        sourceMetadata: {
          portalType: 'healthcare_facility',
          organizationId: user.uid,
          organizationName: user.organizationName || user.displayName,
          departmentId: 'medical_scheduling',
          bookingUserRole: 'medical_scheduler'
        },
        
        // Medical requirements
        medicalRequirements: {
          priorityLevel: formData.requiresWheelchair || formData.requiresAssistance ? 'urgent' : 'routine',
          wheelchairAccessible: formData.requiresWheelchair,
          stretcherRequired: false,
          oxygenSupport: false,
          assistanceLevel: formData.requiresAssistance ? 'full' : 'none',
          medicalEquipment: formData.requiresWheelchair ? ['wheelchair'] : [],
          specialInstructions: formData.specialInstructions || '',
          appointmentType: formData.appointmentType,
          isEmergency: false,
          requiresWheelchair: formData.requiresWheelchair,
          requiresAssistance: formData.requiresAssistance
        },
        
        // Compliance requirements for medical transport
        complianceRequirements: {
          hipaCompliant: true,
          driverBackgroundCheck: true,
          medicalTransportCertification: true,
          insuranceRequired: 'medical_transport',
          documentationLevel: 'standard'
        },
        
        // Status
        status: 'assigned',
        assignmentStatus: 'pending',
        
        // Locations
        pickupLocation: {
          facilityName: formData.pickupLocation.facilityName || null,
          address: formData.pickupLocation.address.trim(),
          specialInstructions: formData.pickupLocation.specialInstructions || null
        },
        dropoffLocation: {
          facilityName: formData.dropoffLocation.facilityName || null,
          address: formData.dropoffLocation.address.trim(),
          specialInstructions: formData.dropoffLocation.specialInstructions || null
        },
        
        // Coordinates for driver navigation
        pickupCoordinates: pickupCoords,
        destinationCoordinates: destinationCoords,
        
        // Notes and Requirements
        specialInstructions: formData.specialInstructions || null,
        patientNotes: formData.patientNotes || null,
        requiresWheelchair: formData.requiresWheelchair,
        requiresAssistance: formData.requiresAssistance,
        
        // Emergency Contact
        emergencyContact: formData.emergencyContact.name ? {
          name: formData.emergencyContact.name.trim(),
          phone: formData.emergencyContact.phone.trim(),
          relationship: formData.emergencyContact.relationship.trim()
        } : null,
        
        // Organization Info
        organizationId: user.uid,
        organizationName: user.organizationName || user.displayName,
        
        // Metadata
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
        lastModifiedBy: user.uid,
        
        // Driver Assignment (initially null)
        driverInfo: null,
        assignedDriverId: null,
        notificationsSent: [],
        
        // Audit Log
        auditLog: [{
          action: 'medical_ride_created',
          timestamp: new Date().toISOString(),
          userId: user.uid,
          userRole: user.role || 'medical_scheduler',
          sourceType: 'medical_portal'
        }]
      };

      setNotificationStatus('Saving ride to database...');
      const rideRef = await addDoc(collection(db, 'medicalRideSchedule'), rideData);
      
      // Add the ID to the ride data for notifications
      const rideWithId = { ...rideData, id: rideRef.id };

      // Automatically notify drivers if enabled
      if (autoAssignDrivers) {
        setNotificationStatus('Finding nearby drivers...');
        
        const nearbyDrivers = await driverAssignmentService.findNearbyDrivers(
          pickupCoords,
          15, // 15 mile radius
          {
            requiresWheelchair: formData.requiresWheelchair,
            requiresAssistance: formData.requiresAssistance
          },
          // Pass medical requirements for enhanced filtering
          {
            priorityLevel: formData.requiresWheelchair || formData.requiresAssistance ? 'urgent' : 'routine',
            wheelchairAccessible: formData.requiresWheelchair,
            stretcherRequired: false,
            oxygenSupport: false,
            assistanceLevel: formData.requiresAssistance ? 'full' : 'none',
            appointmentType: formData.appointmentType
          }
        );

        if (nearbyDrivers.length > 0) {
          setNotificationStatus(`Notifying ${nearbyDrivers.length} nearby drivers...`);
          
          const notifications = await driverAssignmentService.notifyDrivers(
            nearbyDrivers.slice(0, 5), // Notify up to 5 closest drivers
            rideWithId
          );
          
          setNotificationStatus(`Successfully notified ${notifications.length} drivers!`);
          
          // Show success message with driver count
          setTimeout(() => {
            alert(`Ride created successfully! ${notifications.length} nearby drivers have been notified.`);
          }, 1000);
        } else {
          setNotificationStatus('No nearby drivers found. Ride saved for manual assignment.');
          alert('Ride created successfully! No nearby drivers found at this time. You can manually assign a driver later.');
        }
      } else {
        setNotificationStatus('Ride created successfully!');
        alert('Ride created successfully! Driver notification disabled.');
      }

      // Wait a moment to show final status
      setTimeout(() => {
        // Reset form
        setFormData({
          patientId: '',
          appointmentType: '',
          appointmentDateTime: getDefaultDateTime(),
          estimatedDuration: 60,
          pickupLocation: { facilityName: '', address: '', specialInstructions: '' },
          dropoffLocation: { facilityName: '', address: '', specialInstructions: '' },
          specialInstructions: '',
          patientNotes: '',
          requiresWheelchair: false,
          requiresAssistance: false,
          emergencyContact: { name: '', phone: '', relationship: '' }
        });
        
        setNotificationStatus('');
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating ride:', error);
      setNotificationStatus('Error creating ride. Please try again.');
      alert('Error creating ride. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Dialog */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Schedule New Medical Ride
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Patient Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      Patient Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Patient ID *
                        </label>
                        <input
                          type="text"
                          value={formData.patientId}
                          onChange={(e) => handleInputChange('patientId', e.target.value)}
                          className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            errors.patientId ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter patient ID"
                        />
                        {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Appointment Type *
                        </label>
                        <select
                          value={formData.appointmentType}
                          onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                          className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            errors.appointmentType ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select appointment type</option>
                          {appointmentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        {errors.appointmentType && <p className="text-red-500 text-xs mt-1">{errors.appointmentType}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      Scheduling
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Appointment Date & Time *
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.appointmentDateTime}
                          onChange={(e) => handleInputChange('appointmentDateTime', e.target.value)}
                          className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            errors.appointmentDateTime ? 'border-red-300' : 'border-gray-300'
                          }`}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                        {errors.appointmentDateTime && <p className="text-red-500 text-xs mt-1">{errors.appointmentDateTime}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Estimated Duration (minutes) *
                        </label>
                        <input
                          type="number"
                          value={formData.estimatedDuration}
                          onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value))}
                          className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            errors.estimatedDuration ? 'border-red-300' : 'border-gray-300'
                          }`}
                          min="15"
                          max="480"
                        />
                        {errors.estimatedDuration && <p className="text-red-500 text-xs mt-1">{errors.estimatedDuration}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Special Requirements
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.requiresWheelchair}
                          onChange={(e) => handleInputChange('requiresWheelchair', e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Wheelchair accessible vehicle required</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.requiresAssistance}
                          onChange={(e) => handleInputChange('requiresAssistance', e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Patient requires assistance</span>
                      </label>
                    </div>
                  </div>

                  {/* Driver Assignment Options */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Driver Assignment
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={autoAssignDrivers}
                          onChange={(e) => setAutoAssignDrivers(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Automatically notify nearby drivers</span>
                      </label>
                      <p className="text-xs text-gray-500 ml-6">
                        When enabled, nearby drivers will be notified immediately when the ride is created.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Pickup Location */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1 text-green-600" />
                      Pickup Location
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Facility Name
                        </label>
                        <select
                          value={formData.pickupLocation.facilityName}
                          onChange={(e) => handleLocationChange('pickupLocation', 'facilityName', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select facility (optional)</option>
                          {facilities.map(facility => (
                            <option key={facility} value={facility}>{facility}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <StablePlacesInput
                          label="Address"
                          value={formData.pickupLocation.address}
                          onChange={(value) => handleLocationChange('pickupLocation', 'address', value)}
                          onPlaceSelect={handlePickupLocationSelect}
                          placeholder="Enter pickup address..."
                          required
                          id="pickup-address"
                          className={errors.pickupAddress ? 'border-red-300' : ''}
                        />
                        {errors.pickupAddress && <p className="text-red-500 text-xs mt-1">{errors.pickupAddress}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Special Instructions
                        </label>
                        <input
                          type="text"
                          value={formData.pickupLocation.specialInstructions}
                          onChange={(e) => handleLocationChange('pickupLocation', 'specialInstructions', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="e.g., Unit B, 2nd floor"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dropoff Location */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1 text-blue-600" />
                      Dropoff Location
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Facility Name
                        </label>
                        <select
                          value={formData.dropoffLocation.facilityName}
                          onChange={(e) => handleLocationChange('dropoffLocation', 'facilityName', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select facility (optional)</option>
                          {facilities.map(facility => (
                            <option key={facility} value={facility}>{facility}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <StablePlacesInput
                          label="Address"
                          value={formData.dropoffLocation.address}
                          onChange={(value) => handleLocationChange('dropoffLocation', 'address', value)}
                          onPlaceSelect={handleDropoffLocationSelect}
                          placeholder="Enter destination address..."
                          required
                          facilitiesOnly={true}
                          id="dropoff-address"
                          className={errors.dropoffAddress ? 'border-red-300' : ''}
                        />
                        {errors.dropoffAddress && <p className="text-red-500 text-xs mt-1">{errors.dropoffAddress}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Special Instructions
                        </label>
                        <input
                          type="text"
                          value={formData.dropoffLocation.specialInstructions}
                          onChange={(e) => handleLocationChange('dropoffLocation', 'specialInstructions', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="e.g., Main entrance, Room 201"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Emergency Contact (Optional)
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <input
                          type="text"
                          value={formData.emergencyContact.name}
                          onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Contact name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.emergencyContact.phone}
                            onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Relationship
                          </label>
                          <input
                            type="text"
                            value={formData.emergencyContact.relationship}
                            onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., Spouse"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  Additional Notes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Special Instructions
                    </label>
                    <textarea
                      value={formData.specialInstructions}
                      onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows="3"
                      placeholder="Any special instructions for the ride..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Patient Notes
                    </label>
                    <textarea
                      value={formData.patientNotes}
                      onChange={(e) => handleInputChange('patientNotes', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows="3"
                      placeholder="Notes about patient mobility, assistance needs, etc..."
                    />
                  </div>
                </div>
              </div>

              {/* Status Display */}
              {(creating || notificationStatus) && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    {creating && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">
                        {creating ? 'Creating Ride...' : 'Status'}
                      </h4>
                      {notificationStatus && (
                        <p className="text-sm text-blue-700 mt-1">{notificationStatus}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={creating}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {creating ? 'Creating...' : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Schedule Ride
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRideModal;
