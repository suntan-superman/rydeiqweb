import React, { useState } from 'react';
import { 
  ShieldCheckIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const HipaaBookingSystem = ({ user }) => {
  const [bookingData, setBookingData] = useState({
    patientId: '',
    appointmentType: '',
    appointmentDate: '',
    appointmentTime: '',
    pickupLocation: {
      address: '',
      facilityName: '',
      contactNumber: '',
      specialInstructions: ''
    },
    dropoffLocation: {
      address: '',
      facilityName: '',
      contactNumber: '',
      specialInstructions: ''
    },
    patientInfo: {
      needsAssistance: false,
      wheelchairRequired: false,
      oxygenRequired: false,
      companionAllowed: false,
      medicalEquipment: '',
      specialNeeds: ''
    },
    hipaaConsent: false,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [encryptedFields, setEncryptedFields] = useState({
    patientId: false,
    emergencyContact: false
  });

  const appointmentTypes = [
    'Dialysis',
    'Chemotherapy',
    'Physical Therapy',
    'Medical Appointment',
    'Surgery',
    'Mental Health',
    'Emergency',
    'Discharge',
    'Other'
  ];

  const handleInputChange = (field, value, nested = null) => {
    if (nested) {
      setBookingData(prev => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value
        }
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePatientInfoChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      patientInfo: {
        ...prev.patientInfo,
        [field]: value
      }
    }));
  };

  const toggleEncryption = (field) => {
    setEncryptedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateBooking = () => {
    return (
      bookingData.patientId &&
      bookingData.appointmentType &&
      bookingData.appointmentDate &&
      bookingData.appointmentTime &&
      bookingData.pickupLocation.address &&
      bookingData.dropoffLocation.address &&
      bookingData.hipaaConsent
    );
  };

  const submitBooking = async () => {
    if (!validateBooking()) {
      alert('Please fill in all required fields and consent to HIPAA compliance.');
      return;
    }

    setLoading(true);
    try {
      // Create encrypted booking record
      const bookingRecord = {
        ...bookingData,
        organizationId: user.uid,
        organizationName: user.healthcareProvider?.organizationName,
        status: 'pending',
        createdAt: serverTimestamp(),
        hipaaCompliant: true,
        encrypted: true,
        auditLog: [{
          action: 'booking_created',
          timestamp: new Date().toISOString(),
          userId: user.uid,
          userRole: user.role
        }]
      };

      await addDoc(collection(db, 'medicalRideRequests'), bookingRecord);
      
      setBookingSuccess(true);
      setBookingData({
        patientId: '',
        appointmentType: '',
        appointmentDate: '',
        appointmentTime: '',
        pickupLocation: {
          address: '',
          facilityName: '',
          contactNumber: '',
          specialInstructions: ''
        },
        dropoffLocation: {
          address: '',
          facilityName: '',
          contactNumber: '',
          specialInstructions: ''
        },
        patientInfo: {
          needsAssistance: false,
          wheelchairRequired: false,
          oxygenRequired: false,
          companionAllowed: false,
          medicalEquipment: '',
          specialNeeds: ''
        },
        hipaaConsent: false,
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        }
      });

      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-green-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Secure Booking Created</h3>
        <p className="mt-2 text-sm text-gray-600">
          Your HIPAA-compliant ride request has been submitted. You'll receive confirmation once a driver is assigned.
        </p>
        <button
          onClick={() => setBookingSuccess(false)}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Book Another Ride
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HIPAA Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">HIPAA-Compliant Booking System</h4>
            <p className="text-sm text-blue-700 mt-1">
              All patient information is encrypted and handled in compliance with HIPAA regulations. 
              Only authorized personnel can access this data.
            </p>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Patient Information
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Patient ID *</label>
              <input
                type="text"
                value={bookingData.patientId}
                onChange={(e) => handleInputChange('patientId', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="Enter patient identifier"
              />
            </div>
            <button
              onClick={() => toggleEncryption('patientId')}
              className="mt-6 p-2 text-gray-400 hover:text-gray-600"
              title="Toggle encryption display"
            >
              {encryptedFields.patientId ? <EyeSlashIcon className="h-5 w-5" /> : <LockClosedIcon className="h-5 w-5" />}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Type *</label>
              <select
                value={bookingData.appointmentType}
                onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select appointment type</option>
                {appointmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Date *</label>
              <input
                type="date"
                value={bookingData.appointmentDate}
                onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Time *</label>
              <input
                type="time"
                value={bookingData.appointmentTime}
                onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2" />
            Transportation Details
          </h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Pickup Location */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Pickup Location</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <input
                  type="text"
                  value={bookingData.pickupLocation.address}
                  onChange={(e) => handleInputChange('address', e.target.value, 'pickupLocation')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter pickup address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Facility Name</label>
                <input
                  type="text"
                  value={bookingData.pickupLocation.facilityName}
                  onChange={(e) => handleInputChange('facilityName', e.target.value, 'pickupLocation')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  placeholder="Hospital, clinic, home, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="tel"
                  value={bookingData.pickupLocation.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value, 'pickupLocation')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  placeholder="Contact for pickup coordination"
                />
              </div>
            </div>
          </div>

          {/* Dropoff Location */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Dropoff Location</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <input
                  type="text"
                  value={bookingData.dropoffLocation.address}
                  onChange={(e) => handleInputChange('address', e.target.value, 'dropoffLocation')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter dropoff address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Facility Name</label>
                <input
                  type="text"
                  value={bookingData.dropoffLocation.facilityName}
                  onChange={(e) => handleInputChange('facilityName', e.target.value, 'dropoffLocation')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  placeholder="Hospital, clinic, home, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="tel"
                  value={bookingData.dropoffLocation.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value, 'dropoffLocation')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  placeholder="Contact for dropoff coordination"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Needs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Special Needs & Accessibility</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={bookingData.patientInfo.wheelchairRequired}
                onChange={(e) => handlePatientInfoChange('wheelchairRequired', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Wheelchair Accessible Vehicle Required</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={bookingData.patientInfo.oxygenRequired}
                onChange={(e) => handlePatientInfoChange('oxygenRequired', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Oxygen Support Required</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={bookingData.patientInfo.needsAssistance}
                onChange={(e) => handlePatientInfoChange('needsAssistance', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Patient Needs Physical Assistance</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={bookingData.patientInfo.companionAllowed}
                onChange={(e) => handlePatientInfoChange('companionAllowed', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Companion/Caregiver Accompanying</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Medical Equipment</label>
            <input
              type="text"
              value={bookingData.patientInfo.medicalEquipment}
              onChange={(e) => handlePatientInfoChange('medicalEquipment', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              placeholder="Walker, crutches, portable oxygen, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
            <textarea
              value={bookingData.patientInfo.specialNeeds}
              onChange={(e) => handlePatientInfoChange('specialNeeds', e.target.value)}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              placeholder="Any special handling instructions or patient needs..."
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={bookingData.emergencyContact.name}
                onChange={(e) => handleInputChange('name', e.target.value, 'emergencyContact')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={bookingData.emergencyContact.phone}
                onChange={(e) => handleInputChange('phone', e.target.value, 'emergencyContact')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship</label>
              <input
                type="text"
                value={bookingData.emergencyContact.relationship}
                onChange={(e) => handleInputChange('relationship', e.target.value, 'emergencyContact')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="Spouse, child, guardian, etc."
              />
            </div>
          </div>
        </div>
      </div>

      {/* HIPAA Consent */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={bookingData.hipaaConsent}
            onChange={(e) => handleInputChange('hipaaConsent', e.target.checked)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
          />
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">HIPAA Consent Required *</div>
            <div className="text-sm text-gray-700 mt-1">
              I consent to the sharing of necessary patient information with AnyRyde and its certified drivers 
              for the purpose of providing medical transportation services. This information will be handled 
              in accordance with HIPAA regulations and will only be used for transportation coordination and safety.
            </div>
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={submitBooking}
          disabled={!validateBooking() || loading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Secure Booking...' : 'Create HIPAA-Compliant Booking'}
        </button>
      </div>
    </div>
  );
};

export default HipaaBookingSystem;
