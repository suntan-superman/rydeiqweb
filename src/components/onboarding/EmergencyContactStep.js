import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useOnboarding, ONBOARDING_STEPS } from '../../contexts/OnboardingContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import OnboardingProgress from './OnboardingProgress';
import toast from 'react-hot-toast';

const EmergencyContactStep = () => {
  const { 
    formData, 
    updateEmergencyContact, 
    nextStep, 
    previousStep, 
    validateStep,
    errors
  } = useOnboarding();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: formErrors },
    clearErrors
  } = useForm({
    defaultValues: {
      name: formData.emergencyContact.name,
      phone: formData.emergencyContact.phone,
      relationship: formData.emergencyContact.relationship,
      email: formData.emergencyContact.email
    },
    mode: 'onChange'
  });

  // Update form data when form values change
  useEffect(() => {
    const subscription = watch((value) => {
      updateEmergencyContact(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, updateEmergencyContact]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      clearErrors();
    }
  }, [watch, clearErrors, formErrors]);

  const relationshipOptions = [
    { value: '', label: 'Select relationship' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'friend', label: 'Friend' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'other', label: 'Other' }
  ];

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Validate the step
      const isValid = validateStep(ONBOARDING_STEPS.EMERGENCY_CONTACT);
      
      if (!isValid) {
        toast.error('Please fill in all required fields correctly');
        return;
      }

      toast.success('Emergency contact information saved!');
      nextStep();
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      toast.error('Failed to save emergency contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    previousStep();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingProgress />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Emergency Contact
            </h1>
            <p className="text-gray-600">
              We need an emergency contact in case of any issues during your rides
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact Name */}
            <Input
              label="Contact Name *"
              {...register('name', { 
                required: 'Contact name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
              error={formErrors.name?.message || errors.emergencyContactName}
              placeholder="Enter emergency contact's full name"
            />

            {/* Relationship */}
            <Select
              label="Relationship *"
              {...register('relationship', { 
                required: 'Relationship is required'
              })}
              error={formErrors.relationship?.message || errors.emergencyContactRelationship}
              options={relationshipOptions}
            />

            {/* Phone Number */}
            <Input
              label="Phone Number *"
              type="tel"
              {...register('phone', { 
                required: 'Phone number is required',
                pattern: {
                  value: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
                  message: 'Please enter a valid phone number'
                }
              })}
              error={formErrors.phone?.message || errors.emergencyContactPhone}
              placeholder="(555) 123-4567"
            />

            {/* Email (Optional) */}
            <Input
              label="Email Address (Optional)"
              type="email"
              {...register('email', { 
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Please enter a valid email address'
                }
              })}
              error={formErrors.email?.message}
              placeholder="Enter emergency contact's email (optional)"
            />

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Privacy & Safety</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your emergency contact information is kept private and secure. We will only contact them in case of an emergency or safety concern during your ride.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Continue
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactStep;
