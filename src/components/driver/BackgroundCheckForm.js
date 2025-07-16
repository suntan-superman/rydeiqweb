import React, { useState, useEffect } from 'react';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import SecurityNotice from '../common/SecurityNotice';
import toast from 'react-hot-toast';

const BackgroundCheckForm = () => {
  const {
    driverApplication,
    updateStep,
    goToNextStep,
    goToPreviousStep,
    saving,
    ONBOARDING_STEPS
  } = useDriverOnboarding();

  const [formData, setFormData] = useState({
    ssn: '',
    currentAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      yearsAtAddress: ''
    },
    previousAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      yearsAtAddress: ''
    },
    hasPreviousAddress: false,
    consentBackgroundCheck: false,
    consentCriminalHistory: false,
    consentDrivingRecord: false,
    understandTimeline: false
  });

  const [errors, setErrors] = useState({});
  const [showSSN, setShowSSN] = useState(false);

  // Load existing data
  useEffect(() => {
    if (driverApplication?.backgroundCheck) {
      setFormData(prev => ({
        ...prev,
        ...driverApplication.backgroundCheck
      }));
    }
  }, [driverApplication]);

  const formatSSN = (value) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Apply SSN formatting: XXX-XX-XXXX
    if (cleaned.length >= 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
    } else if (cleaned.length >= 5) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'ssn') {
      const formattedSSN = formatSSN(value);
      setFormData(prev => ({ ...prev, [name]: formattedSSN }));
    } else if (name.includes('.')) {
      // Handle nested objects (addresses)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // SSN validation
    const ssnDigits = formData.ssn.replace(/\D/g, '');
    if (!formData.ssn.trim()) {
      newErrors.ssn = 'Social Security Number is required';
    } else if (ssnDigits.length !== 9) {
      newErrors.ssn = 'Please enter a valid 9-digit SSN';
    }

    // Current address validation
    if (!formData.currentAddress.street.trim()) {
      newErrors['currentAddress.street'] = 'Current street address is required';
    }
    if (!formData.currentAddress.city.trim()) {
      newErrors['currentAddress.city'] = 'Current city is required';
    }
    if (!formData.currentAddress.state.trim()) {
      newErrors['currentAddress.state'] = 'Current state is required';
    }
    if (!formData.currentAddress.zipCode.trim()) {
      newErrors['currentAddress.zipCode'] = 'Current ZIP code is required';
    }
    if (!formData.currentAddress.yearsAtAddress || formData.currentAddress.yearsAtAddress < 0) {
      newErrors['currentAddress.yearsAtAddress'] = 'Years at current address is required';
    }

    // Previous address validation (if applicable)
    if (formData.hasPreviousAddress) {
      if (!formData.previousAddress.street.trim()) {
        newErrors['previousAddress.street'] = 'Previous street address is required';
      }
      if (!formData.previousAddress.city.trim()) {
        newErrors['previousAddress.city'] = 'Previous city is required';
      }
      if (!formData.previousAddress.state.trim()) {
        newErrors['previousAddress.state'] = 'Previous state is required';
      }
      if (!formData.previousAddress.zipCode.trim()) {
        newErrors['previousAddress.zipCode'] = 'Previous ZIP code is required';
      }
      if (!formData.previousAddress.yearsAtAddress || formData.previousAddress.yearsAtAddress < 0) {
        newErrors['previousAddress.yearsAtAddress'] = 'Years at previous address is required';
      }
    }

    // Consent validation
    if (!formData.consentBackgroundCheck) {
      newErrors.consentBackgroundCheck = 'Background check consent is required';
    }
    if (!formData.consentCriminalHistory) {
      newErrors.consentCriminalHistory = 'Criminal history consent is required';
    }
    if (!formData.consentDrivingRecord) {
      newErrors.consentDrivingRecord = 'Driving record consent is required';
    }
    if (!formData.understandTimeline) {
      newErrors.understandTimeline = 'Please acknowledge the processing timeline';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors below');
      return;
    }

    const result = await updateStep(ONBOARDING_STEPS.BACKGROUND_CHECK, formData);
    
    if (result.success) {
      goToNextStep();
    }
  };

  const getErrorMessage = (fieldName) => {
    return errors[fieldName];
  };

  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  if (saving) {
    return <LoadingSpinner message="Saving background check information..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Background Check</h1>
          <p className="text-gray-600">
            We need to verify your background to ensure the safety of our riders. This information is kept secure and confidential.
          </p>
        </div>

        <SecurityNotice 
          message="Your personal information is encrypted and secure. We partner with trusted third-party services for background verification."
        />

        <form onSubmit={handleSubmit} className="space-y-8 mt-8">
          {/* SSN Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Identification</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Social Security Number *
                </label>
                <div className="relative">
                  <Input
                    type={showSSN ? "text" : "password"}
                    name="ssn"
                    value={formData.ssn}
                    onChange={handleInputChange}
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    error={getErrorMessage('ssn')}
                    className="pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSSN(!showSSN)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showSSN ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Required for background check verification
                </p>
              </div>
            </div>
          </div>

          {/* Current Address Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Address</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Street Address *"
                  name="currentAddress.street"
                  value={formData.currentAddress.street}
                  onChange={handleInputChange}
                  placeholder="123 Main St"
                  error={getErrorMessage('currentAddress.street')}
                />
              </div>
              
              <div>
                <Input
                  label="City *"
                  name="currentAddress.city"
                  value={formData.currentAddress.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  error={getErrorMessage('currentAddress.city')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  name="currentAddress.state"
                  value={formData.currentAddress.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select State</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {getErrorMessage('currentAddress.state') && (
                  <p className="text-red-500 text-sm mt-1">{getErrorMessage('currentAddress.state')}</p>
                )}
              </div>
              
              <div>
                <Input
                  label="ZIP Code *"
                  name="currentAddress.zipCode"
                  value={formData.currentAddress.zipCode}
                  onChange={handleInputChange}
                  placeholder="12345"
                  maxLength={10}
                  error={getErrorMessage('currentAddress.zipCode')}
                />
              </div>
              
              <div>
                <Input
                  label="Years at Current Address *"
                  name="currentAddress.yearsAtAddress"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={formData.currentAddress.yearsAtAddress}
                  onChange={handleInputChange}
                  placeholder="2.5"
                  error={getErrorMessage('currentAddress.yearsAtAddress')}
                />
              </div>
            </div>
          </div>

          {/* Previous Address Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Previous Address</h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="hasPreviousAddress"
                  checked={formData.hasPreviousAddress}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">I have lived at a previous address within the last 5 years</span>
              </label>
            </div>
            
            {formData.hasPreviousAddress && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Previous Street Address *"
                    name="previousAddress.street"
                    value={formData.previousAddress.street}
                    onChange={handleInputChange}
                    placeholder="456 Previous St"
                    error={getErrorMessage('previousAddress.street')}
                  />
                </div>
                
                <div>
                  <Input
                    label="Previous City *"
                    name="previousAddress.city"
                    value={formData.previousAddress.city}
                    onChange={handleInputChange}
                    placeholder="Previous City"
                    error={getErrorMessage('previousAddress.city')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous State *
                  </label>
                  <select
                    name="previousAddress.state"
                    value={formData.previousAddress.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {getErrorMessage('previousAddress.state') && (
                    <p className="text-red-500 text-sm mt-1">{getErrorMessage('previousAddress.state')}</p>
                  )}
                </div>
                
                <div>
                  <Input
                    label="Previous ZIP Code *"
                    name="previousAddress.zipCode"
                    value={formData.previousAddress.zipCode}
                    onChange={handleInputChange}
                    placeholder="54321"
                    maxLength={10}
                    error={getErrorMessage('previousAddress.zipCode')}
                  />
                </div>
                
                <div>
                  <Input
                    label="Years at Previous Address *"
                    name="previousAddress.yearsAtAddress"
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={formData.previousAddress.yearsAtAddress}
                    onChange={handleInputChange}
                    placeholder="1.5"
                    error={getErrorMessage('previousAddress.yearsAtAddress')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Consent Section */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Background Check Consent</h3>
            <p className="text-gray-600 mb-6">
              By checking the boxes below, you give RydeAlong permission to conduct a background check including criminal history and driving record verification.
            </p>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="consentBackgroundCheck"
                  checked={formData.consentBackgroundCheck}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-900">
                    I consent to a background check being performed by RydeAlong or its authorized third-party partners *
                  </span>
                  {getErrorMessage('consentBackgroundCheck') && (
                    <p className="text-red-500 text-sm mt-1">{getErrorMessage('consentBackgroundCheck')}</p>
                  )}
                </div>
              </label>
              
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="consentCriminalHistory"
                  checked={formData.consentCriminalHistory}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-900">
                    I consent to verification of my criminal history and authorize the release of such information *
                  </span>
                  {getErrorMessage('consentCriminalHistory') && (
                    <p className="text-red-500 text-sm mt-1">{getErrorMessage('consentCriminalHistory')}</p>
                  )}
                </div>
              </label>
              
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="consentDrivingRecord"
                  checked={formData.consentDrivingRecord}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-900">
                    I consent to verification of my driving record and motor vehicle report *
                  </span>
                  {getErrorMessage('consentDrivingRecord') && (
                    <p className="text-red-500 text-sm mt-1">{getErrorMessage('consentDrivingRecord')}</p>
                  )}
                </div>
              </label>
              
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="understandTimeline"
                  checked={formData.understandTimeline}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-900">
                    I understand that background check approval may take up to 24-48 hours to complete *
                  </span>
                  {getErrorMessage('understandTimeline') && (
                    <p className="text-red-500 text-sm mt-1">{getErrorMessage('understandTimeline')}</p>
                  )}
                </div>
              </label>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Important Information</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Background checks are conducted by trusted third-party services</li>
                <li>• Your information is kept secure and confidential</li>
                <li>• You will be notified once the background check is complete</li>
                <li>• You may be required to provide additional documentation if requested</li>
              </ul>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button 
              type="button"
              variant="outline" 
              onClick={goToPreviousStep}
              disabled={saving}
            >
              Previous Step
            </Button>
            
            <Button 
              type="submit"
              variant="primary"
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BackgroundCheckForm; 