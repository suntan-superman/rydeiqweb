import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRiderOnboarding } from '../../../contexts/RiderOnboardingContext';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../common/Button';
import Input from '../../common/Input';
import toast from 'react-hot-toast';

const RiderPersonalInfoForm = () => {
  const { riderProfile, updateStep, goToNextStep, goToPreviousStep, saving, ONBOARDING_STEPS } = useRiderOnboarding();
  const { user } = useAuth();
  const [validationErrors, setValidationErrors] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phoneNumber: ''
    }
  });

  useEffect(() => {
    if (riderProfile) {
      setValue('firstName', riderProfile.firstName || user?.firstName || '');
      setValue('lastName', riderProfile.lastName || user?.lastName || '');
      setValue('phoneNumber', riderProfile.phoneNumber || '');
      if (riderProfile.personalInfo) {
        setValue('dateOfBirth', riderProfile.personalInfo.dateOfBirth || '');
        setValue('gender', riderProfile.personalInfo.gender || '');
      }
    }
  }, [riderProfile, user, setValue]);

  const onSubmit = async (data) => {
    setValidationErrors([]);

    // Validate age (must be 18+)
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 18 || (age === 18 && monthDiff < 0)) {
      setValidationErrors(['You must be at least 18 years old to use AnyRyde']);
      return;
    }

    const result = await updateStep(ONBOARDING_STEPS.PERSONAL_INFO, {
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName} ${data.lastName}`,
      phoneNumber: data.phoneNumber,
      personalInfo: {
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        age: age
      }
    });

    if (result.success) {
      toast.success('Personal information saved!');
      goToNextStep();
    } else {
      toast.error('Failed to save information');
    }
  };

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const maxYear = currentYear - 18;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Information</h1>
          <p className="text-gray-600">
            Tell us a bit about yourself. This helps us provide better service and verify your identity.
          </p>
        </div>

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
                  Please correct the following:
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
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="First Name"
              required
              {...register('firstName', { required: 'First name is required' })}
              error={errors.firstName?.message}
            />

            <Input
              label="Last Name"
              required
              {...register('lastName', { required: 'Last name is required' })}
              error={errors.lastName?.message}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <Input
              label="Date of Birth"
              type="date"
              required
              {...register('dateOfBirth', { required: 'Date of birth is required' })}
              error={errors.dateOfBirth?.message}
              min={`${minYear}-01-01`}
              max={`${maxYear}-12-31`}
            />
            <p className="text-sm text-gray-500 mt-1">
              You must be at least 18 years old to use AnyRyde
            </p>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['male', 'female', 'non-binary', 'prefer not to say'].map((option) => (
                <label
                  key={option}
                  className="relative flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
                >
                  <input
                    type="radio"
                    value={option}
                    {...register('gender', { required: 'Please select your gender' })}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {option}
                  </span>
                </label>
              ))}
            </div>
            {errors.gender && (
              <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <Input
            label="Phone Number"
            type="tel"
            required
            {...register('phoneNumber', {
              required: 'Phone number is required',
              pattern: {
                value: /^[\d\s\-+()]+$/,
                message: 'Please enter a valid phone number'
              }
            })}
            error={errors.phoneNumber?.message}
            placeholder="(555) 555-5555"
          />

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Why we need this information
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your name helps drivers identify you</li>
                  <li>• Date of birth verifies you're old enough to ride</li>
                  <li>• Phone number is used for ride notifications and driver contact</li>
                  <li>• All information is kept private and secure</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={saving}
            >
              ← Back
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={saving}
            >
              Save and Continue →
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiderPersonalInfoForm;

