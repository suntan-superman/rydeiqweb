import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';
import { validateStepCompletion, ONBOARDING_STEPS } from '../../services/driverService';
import Button from '../common/Button';
import Input from '../common/Input';

const PersonalInfoForm = () => {
  const { 
    driverApplication, 
    updateStep, 
    goToNextStep, 
    saving, 
    ONBOARDING_STEPS: STEPS 
  } = useDriverOnboarding();
  
  const [validationErrors, setValidationErrors] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phoneNumber: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      coverageArea: '',
      referralCode: ''
    }
  });

  // Pre-fill form with existing data
  useEffect(() => {
    if (driverApplication?.personalInfo) {
      const personalInfo = driverApplication.personalInfo;
      Object.keys(personalInfo).forEach(key => {
        setValue(key, personalInfo[key]);
      });
    }
    
    // Pre-fill email from user account
    if (driverApplication?.email) {
      setValue('email', driverApplication.email);
    }
  }, [driverApplication, setValue]);

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
    const age = today.getFullYear() - birthDate.getFullYear();
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
            <Input
              label="First Name"
              type="text"
              required
              {...register('firstName', {
                required: 'First name is required',
                minLength: {
                  value: 2,
                  message: 'First name must be at least 2 characters'
                }
              })}
              error={errors.firstName?.message}
            />
            
            <Input
              label="Last Name"
              type="text"
              required
              {...register('lastName', {
                required: 'Last name is required',
                minLength: {
                  value: 2,
                  message: 'Last name must be at least 2 characters'
                }
              })}
              error={errors.lastName?.message}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Email Address"
              type="email"
              required
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                }
              })}
              error={errors.email?.message}
            />
            
            <Input
              label="Phone Number"
              type="tel"
              required
              placeholder="(555) 123-4567"
              {...register('phoneNumber', {
                required: 'Phone number is required'
              })}
              error={errors.phoneNumber?.message}
            />
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

          {/* Coverage Area */}
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