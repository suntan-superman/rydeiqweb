import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { validateStepCompletion, ONBOARDING_STEPS } from '../../services/driverService';
import Button from '../common/Button';
import Input from '../common/Input';
import PhoneInput from '../common/PhoneInput';
import { phoneValidationRules, emergencyPhoneValidationRules } from '../../utils/phoneValidation';

const PersonalInfoForm = () => {
  const { 
    driverApplication, 
    updateStep, 
    goToNextStep, 
    saving, 
    ONBOARDING_STEPS: STEPS 
  } = useDriverOnboarding();
  
  const { user } = useAuth();
  
  const [validationErrors, setValidationErrors] = useState([]);
  const [formInitialized, setFormInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control
  } = useForm({
    mode: 'onChange'
  });

  // Watch form values
  const phoneNumber = useWatch({ control, name: 'phoneNumber' });
  const coverageArea = useWatch({ control, name: 'coverageArea' });
  const emergencyContactPhone = useWatch({ control, name: 'emergencyContactPhone' });
  
  // Watch all form values for validation
  const watchedValues = useWatch({ control });
  
  // Check if all required fields are filled
  const isFormValid = () => {
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 'email',
      'address', 'city', 'state', 'zipCode', 'coverageArea',
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship'
    ];
    
    return requiredFields.every(field => {
      const value = watchedValues[field];
      return value && value.toString().trim() !== '';
    });
  };

  // Initialize form with saved data from database and user signup data
  useEffect(() => {
    console.log('PersonalInfoForm useEffect - formInitialized:', formInitialized, 'driverApplication:', !!driverApplication, 'user:', !!user);
    
    if (!formInitialized && driverApplication && user) {
      // Load saved data from the driver application - check both snake_case and camelCase
      const savedData = driverApplication[STEPS.PERSONAL_INFO] || driverApplication.personalInfo || {};
      
      console.log('PersonalInfoForm - driverApplication keys:', Object.keys(driverApplication));
      console.log('PersonalInfoForm - user data:', user);
      console.log('PersonalInfoForm - user.phone:', user.phone);
      console.log('PersonalInfoForm - user.city:', user.city);
      console.log('PersonalInfoForm - user.emergencyContact:', user.emergencyContact);
      console.log('PersonalInfoForm - user keys:', Object.keys(user));
      console.log('PersonalInfoForm - savedData:', savedData);
      
      // Debug phone number specifically
      console.log('🔍 Phone Debug - user.phone:', user.phone);
      console.log('🔍 Phone Debug - typeof user.phone:', typeof user.phone);
      console.log('🔍 Phone Debug - user.phone length:', user.phone?.length);
      
      // Debug setValue calls
      console.log('🔍 Setting phoneNumber to:', savedData.phoneNumber || user.phone || '');
      console.log('🔍 Setting coverageArea to:', savedData.coverageArea || (user.city ? 'Within city limits' : ''));
      
      // Pre-fill from user signup data first, then saved data, then fallback to empty
      setValue('firstName', savedData.firstName || user.firstName || '');
      setValue('lastName', savedData.lastName || user.lastName || '');
      setValue('dateOfBirth', savedData.dateOfBirth || '');
      setValue('phoneNumber', savedData.phoneNumber || user.phone || '');
      setValue('email', savedData.email || user.email || '');
      setValue('address', savedData.address || '');
      setValue('city', savedData.city || user.city || '');
      setValue('state', savedData.state || '');
      setValue('zipCode', savedData.zipCode || '');
      // Set default coverage area to "Within city limits" if no saved coverage area
      setValue('coverageArea', savedData.coverageArea || 'Within city limits');
      setValue('referralCode', savedData.referralCode || '');
      
      // Emergency contact from user signup data
      setValue('emergencyContactName', savedData.emergencyContactName || user.emergencyContact?.name || '');
      setValue('emergencyContactPhone', savedData.emergencyContactPhone || user.emergencyContact?.phone || '');
      setValue('emergencyContactRelationship', savedData.emergencyContactRelationship || user.emergencyContact?.relationship || '');
      setValue('emergencyContactEmail', savedData.emergencyContactEmail || user.emergencyContact?.email || '');
      
      setFormInitialized(true);
    }
  }, [driverApplication, user, setValue, formInitialized, STEPS.PERSONAL_INFO]);

  // Keep form data when component unmounts (data is saved to database)
  // No cleanup needed since we want to retain the data

  const onSubmit = async (data) => {
    setValidationErrors([]);

    // Validate required fields
    const validation = validateStepCompletion(ONBOARDING_STEPS.PERSONAL_INFO, data);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Additional custom validations
    const customErrors = [];
    
    // Validate date of birth (must be at least 18 years old)
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      customErrors.push('You must be at least 18 years old to drive');
    }

    // Validate phone number format
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!phoneRegex.test(data.phoneNumber)) {
      customErrors.push('Please enter a valid phone number');
    }

    if (customErrors.length > 0) {
      setValidationErrors(customErrors);
      return;
    }

    // Save the data
    const result = await updateStep(STEPS.PERSONAL_INFO, data);
    
    if (result.success) {
      // Don't clear form - keep data for potential editing
      goToNextStep();
    }
  };

  const coverageAreas = [
    'Within city limits',
    'City + surrounding suburbs',
    'Metropolitan area',
    'Statewide',
    'Multi-state region'
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Information</h1>
          <p className="text-gray-600">
            Tell us about yourself. This information will be used for verification and account setup.
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
                  Please correct the following errors:
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="First Name"
                type="text"
                required
                readOnly
                className="bg-gray-50 cursor-not-allowed"
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters'
                  }
                })}
                error={errors.firstName?.message}
              />
              <p className="text-xs text-gray-500 mt-1">Pre-filled from your account registration</p>
            </div>
            
            <div>
              <Input
                label="Last Name"
                type="text"
                required
                readOnly
                className="bg-gray-50 cursor-not-allowed"
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters'
                  }
                })}
                error={errors.lastName?.message}
              />
              <p className="text-xs text-gray-500 mt-1">Pre-filled from your account registration</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Email Address"
                type="email"
                required
                readOnly
                className="bg-gray-50 cursor-not-allowed"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                error={errors.email?.message}
              />
              <p className="text-xs text-gray-500 mt-1">Pre-filled from your account registration</p>
            </div>
            
            <div>
              <PhoneInput
                label="Phone Number"
                required
                placeholder="(555) 123-4567"
                readOnly
                className="bg-gray-50 cursor-not-allowed"
                {...register('phoneNumber', phoneValidationRules)}
                error={errors.phoneNumber?.message}
                value={phoneNumber}
              />
              <p className="text-xs text-gray-500 mt-1">Pre-filled from your account registration</p>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Date of Birth"
              type="date"
              required
              {...register('dateOfBirth', {
                required: 'Date of birth is required'
              })}
              error={errors.dateOfBirth?.message}
            />
          </div>

          {/* Address Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
            <p className="text-sm text-gray-600">
              Please provide your current address information.
            </p>
            
            <Input
              label="Street Address"
              type="text"
              required
              {...register('address', {
                required: 'Street address is required'
              })}
              error={errors.address?.message}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="City"
                type="text"
                required
                {...register('city', {
                  required: 'City is required'
                })}
                error={errors.city?.message}
              />
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('state', {
                    required: 'State is required'
                  })}
                  className="input-field"
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>
              
              <Input
                label="ZIP Code"
                type="text"
                required
                {...register('zipCode', {
                  required: 'ZIP code is required',
                  pattern: {
                    value: /^\d{5}(-\d{4})?$/,
                    message: 'Please enter a valid ZIP code'
                  }
                })}
                error={errors.zipCode?.message}
              />
            </div>
          </div>

          {/* Emergency Contact Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Emergency Contact Information</h3>
            <p className="text-sm text-gray-600">
              Please provide at least one emergency contact for safety purposes. This information will be used in case of emergencies during rides.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Emergency Contact Name"
                    type="text"
                    required
                    readOnly={!!user?.emergencyContact?.name}
                    className={user?.emergencyContact?.name ? "bg-gray-50 cursor-not-allowed" : ""}
                    {...register('emergencyContactName', {
                      required: 'Emergency contact name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                    error={errors.emergencyContactName?.message}
                  />
                  {user?.emergencyContact?.name && (
                    <p className="text-xs text-gray-500 mt-1">Pre-filled from your account registration</p>
                  )}
                </div>
                
                <div>
                  <PhoneInput
                    label="Emergency Contact Phone"
                    required
                    placeholder="(555) 123-4567"
                    readOnly={!!user?.emergencyContact?.phone}
                    className={user?.emergencyContact?.phone ? "bg-gray-50 cursor-not-allowed" : ""}
                    {...register('emergencyContactPhone', emergencyPhoneValidationRules)}
                    error={errors.emergencyContactPhone?.message}
                    value={emergencyContactPhone}
                  />
                  {user?.emergencyContact?.phone && (
                    <p className="text-xs text-gray-500 mt-1">Pre-filled from your account registration</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <Input
                    label="Relationship"
                    type="text"
                    required
                    placeholder="e.g., Spouse, Parent, Sibling"
                    readOnly={!!user?.emergencyContact?.relationship}
                    className={user?.emergencyContact?.relationship ? "bg-gray-50 cursor-not-allowed" : ""}
                    {...register('emergencyContactRelationship', {
                      required: 'Relationship is required'
                    })}
                    error={errors.emergencyContactRelationship?.message}
                  />
                  {user?.emergencyContact?.relationship && (
                    <p className="text-xs text-gray-500 mt-1">Pre-filled from your account registration</p>
                  )}
                </div>
                
                <div>
                  <Input
                    label="Emergency Contact Email (Optional)"
                    type="email"
                    placeholder="contact@example.com"
                    readOnly={!!user?.emergencyContact?.email}
                    className={user?.emergencyContact?.email ? "bg-gray-50 cursor-not-allowed" : ""}
                    {...register('emergencyContactEmail', {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    error={errors.emergencyContactEmail?.message}
                  />
                  {user?.emergencyContact?.email && (
                    <p className="text-xs text-gray-500 mt-1">Pre-filled from your account registration</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Service Information</h3>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Preferred Coverage Area <span className="text-red-500">*</span>
              </label>
              <select
                {...register('coverageArea', {
                  required: 'Please select your preferred coverage area'
                })}
                className="input-field"
                value={coverageArea}
              >
                <option value="">Select Coverage Area</option>
                {coverageAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              {errors.coverageArea && (
                <p className="text-sm text-red-600">{errors.coverageArea.message}</p>
              )}
              <p className="text-sm text-gray-500">
                You can adjust this later based on demand and your preferences.
              </p>
            </div>

            <Input
              label="Referral Code (Optional)"
              type="text"
              placeholder="Enter referral code if you have one"
              {...register('referralCode')}
              error={errors.referralCode?.message}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={!isFormValid() || saving}
              className="px-8"
            >
              Save and Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoForm; 