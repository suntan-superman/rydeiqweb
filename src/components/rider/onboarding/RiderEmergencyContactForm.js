import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRiderOnboarding } from '../../../contexts/RiderOnboardingContext';
import Button from '../../common/Button';
import Input from '../../common/Input';
import toast from 'react-hot-toast';

const RiderEmergencyContactForm = () => {
  const { riderProfile, updateStep, goToNextStep, goToPreviousStep, saving, ONBOARDING_STEPS } = useRiderOnboarding();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm({
    defaultValues: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    }
  });

  useEffect(() => {
    if (riderProfile?.emergencyContact) {
      setValue('name', riderProfile.emergencyContact.name || '');
      setValue('relationship', riderProfile.emergencyContact.relationship || '');
      setValue('phone', riderProfile.emergencyContact.phone || '');
      setValue('email', riderProfile.emergencyContact.email || '');
    }
  }, [riderProfile, setValue]);

  const onSubmit = async (data) => {
    const result = await updateStep(ONBOARDING_STEPS.EMERGENCY_CONTACT, {
      emergencyContact: {
        name: data.name,
        relationship: data.relationship,
        phone: data.phone,
        email: data.email
      }
    });

    if (result.success) {
      toast.success('Emergency contact saved!');
      goToNextStep();
    } else {
      toast.error('Failed to save emergency contact');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Contact</h1>
          <p className="text-gray-600">
            Add a trusted contact we can reach in case of an emergency during your ride.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contact Name */}
          <Input
            label="Contact Name"
            required
            {...register('name', { required: 'Contact name is required' })}
            error={errors.name?.message}
            placeholder="Jane Doe"
          />

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship <span className="text-red-500">*</span>
            </label>
            <select
              {...register('relationship', { required: 'Relationship is required' })}
              className="input-field"
            >
              <option value="">Select Relationship</option>
              <option value="spouse">Spouse</option>
              <option value="partner">Partner</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="child">Child</option>
              <option value="friend">Friend</option>
              <option value="relative">Other Relative</option>
              <option value="other">Other</option>
            </select>
            {errors.relationship && (
              <p className="text-sm text-red-600 mt-1">{errors.relationship.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <Input
            label="Phone Number"
            type="tel"
            required
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^[\d\s\-+()]+$/,
                message: 'Please enter a valid phone number'
              }
            })}
            error={errors.phone?.message}
            placeholder="(555) 555-5555"
          />

          {/* Email (Optional) */}
          <Input
            label="Email Address (Optional)"
            type="email"
            {...register('email', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address'
              }
            })}
            error={errors.email?.message}
            placeholder="jane@example.com"
          />

          {/* Info Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">
                  Why we need an emergency contact
                </h3>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• We'll contact them only in case of a safety emergency</li>
                  <li>• They won't be notified of your regular rides</li>
                  <li>• This is an important safety feature</li>
                  <li>• You can update this information anytime</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Privacy Note:</strong> Your emergency contact information is kept strictly confidential 
              and will only be used in genuine emergency situations. We will never share this information 
              with drivers or use it for marketing purposes.
            </p>
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

export default RiderEmergencyContactForm;

