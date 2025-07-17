import React, { useState, useEffect, useCallback } from 'react';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';
import { 
  submitDriverApplication, 
  validateCompleteApplication,
  DOCUMENT_TYPES 
} from '../../services/driverService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const ReviewForm = () => {
  const { 
    driverApplication, 
    goToStep,
    goToPreviousStep,
    ONBOARDING_STEPS: STEPS
  } = useDriverOnboarding();
  
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Validate all required sections are completed
  const validateApplication = useCallback(() => {
    if (!driverApplication) {
      return ['Driver application data not found'];
    }
    
    const validation = validateCompleteApplication(driverApplication);
    return validation.errors;
  }, [driverApplication]);

  // Validate on component load
  useEffect(() => {
    if (driverApplication) {
      const errors = validateApplication();
      setValidationErrors(errors);
    }
  }, [driverApplication, validateApplication]);

  const handleSubmit = async () => {
    setValidationErrors([]);
    
    // Validate application
    const errors = validateApplication();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const result = await submitDriverApplication(driverApplication.userId);
      
      if (result.success) {
        toast.success('Application submitted successfully!');
        // The context will automatically reload the application data
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(`Failed to submit application: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not provided';
    
    // Handle Firebase timestamp
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    
    // Handle regular date string
    return new Date(date).toLocaleDateString();
  };

  const formatFeatures = (features) => {
    if (!features || features.length === 0) return 'None selected';
    
    const featureLabels = {
      ac: 'Air Conditioning',
      bluetooth: 'Bluetooth',
      gps: 'GPS Navigation',
      usb_charging: 'USB Charging Ports',
      wifi: 'Wi-Fi Hotspot',
      wheelchair_accessible: 'Wheelchair Accessible',
      car_seats: 'Car Seats Available',
      premium_sound: 'Premium Sound System',
      leather_seats: 'Leather Seats',
      sunroof: 'Sunroof'
    };
    
    return features.map(feature => featureLabels[feature] || feature).join(', ');
  };

  const getDocumentStatus = (docType) => {
    const doc = driverApplication?.documents?.[docType];
    if (!doc) return { status: 'missing', text: 'Not uploaded', color: 'text-red-600' };
    if (doc.verified) return { status: 'verified', text: 'Verified ✓', color: 'text-green-600' };
    return { status: 'pending', text: 'Pending review', color: 'text-yellow-600' };
  };

  const personalInfo = driverApplication?.personalInfo || {};
  const vehicleInfo = driverApplication?.vehicleInfo || {};
  const documents = driverApplication?.documents || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review & Submit Application</h1>
          <p className="text-gray-600">
            Please review all your information below. You can edit any section by clicking the "Edit" button. 
            Once you submit, your application will be reviewed within 24-48 hours.
          </p>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Please complete all required sections before submitting:
                </h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Personal Information Section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              <Button
                variant="outline"
                size="small"
                onClick={() => goToStep(STEPS.PERSONAL_INFO)}
              >
                Edit
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-900">
                  {personalInfo.firstName} {personalInfo.lastName}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{personalInfo.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-900">{personalInfo.phoneNumber}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date of Birth:</span>
                <span className="ml-2 text-gray-900">{formatDate(personalInfo.dateOfBirth)}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Address:</span>
                <span className="ml-2 text-gray-900">
                  {personalInfo.address}, {personalInfo.city}, {personalInfo.state} {personalInfo.zipCode}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Coverage Area:</span>
                <span className="ml-2 text-gray-900">{personalInfo.coverageArea}</span>
              </div>
              {personalInfo.referralCode && (
                <div>
                  <span className="font-medium text-gray-700">Referral Code:</span>
                  <span className="ml-2 text-gray-900">{personalInfo.referralCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
              <Button
                variant="outline"
                size="small"
                onClick={() => goToStep(STEPS.DOCUMENT_UPLOAD)}
              >
                Edit
              </Button>
            </div>
            
            <div className="space-y-3">
              {[
                { key: DOCUMENT_TYPES.DRIVERS_LICENSE_FRONT, title: "Driver's License (Front)" },
                { key: DOCUMENT_TYPES.DRIVERS_LICENSE_BACK, title: "Driver's License (Back)" },
                { key: DOCUMENT_TYPES.VEHICLE_REGISTRATION, title: "Vehicle Registration" },
                { key: DOCUMENT_TYPES.INSURANCE_PROOF, title: "Insurance Proof" },
                { key: DOCUMENT_TYPES.PROFILE_PHOTO, title: "Profile Photo (Optional)" }
              ].map(({ key, title }) => {
                const status = getDocumentStatus(key);
                return (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-700">{title}:</span>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm ${status.color}`}>{status.text}</span>
                      {documents[key] && (
                        <button
                          onClick={() => window.open(documents[key].url, '_blank')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Vehicle Information</h2>
              <Button
                variant="outline"
                size="small"
                onClick={() => goToStep(STEPS.VEHICLE_INFO)}
              >
                Edit
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Vehicle:</span>
                <span className="ml-2 text-gray-900">
                  {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Color:</span>
                <span className="ml-2 text-gray-900">{vehicleInfo.color}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">License Plate:</span>
                <span className="ml-2 text-gray-900">{vehicleInfo.licensePlate}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <span className="ml-2 text-gray-900 capitalize">{vehicleInfo.vehicleType}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Seats:</span>
                <span className="ml-2 text-gray-900">{vehicleInfo.numberOfSeats}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Condition:</span>
                <span className="ml-2 text-gray-900 capitalize">{vehicleInfo.condition?.replace('_', ' ')}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Features:</span>
                <span className="ml-2 text-gray-900">{formatFeatures(vehicleInfo.features)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Insurance:</span>
                <span className="ml-2 text-gray-900">
                  {vehicleInfo.insuranceCompany} (Expires: {formatDate(vehicleInfo.insuranceExpiration)})
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Registration:</span>
                <span className="ml-2 text-gray-900">
                  {vehicleInfo.registrationState} (Expires: {formatDate(vehicleInfo.registrationExpiration)})
                </span>
              </div>
            </div>
          </div>

          {/* Application Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Application Summary</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• All required information has been collected and is ready for review</p>
              <p>• Our team will verify your documents and information within 24-48 hours</p>
              <p>• You'll receive email notifications about your application status</p>
              <p>• Once approved, you can start accepting ride requests immediately</p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>By submitting this application, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate and truthful information</li>
                <li>Maintain valid insurance and vehicle registration</li>
                <li>Follow all local and state driving regulations</li>
                <li>Provide safe and professional service to riders</li>
                <li>AnyRyde's driver terms of service and privacy policy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={submitting}
          >
            ← Previous Step
          </Button>
          
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting || validationErrors.length > 0}
            size="large"
            className="px-12"
          >
            {submitting ? (
              <span className="flex items-center">
                <LoadingSpinner size="small" variant="white" />
                <span className="ml-2">Submitting...</span>
              </span>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@rydealong.com" className="text-primary-600 hover:text-primary-700">
              support@rydealong.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm; 