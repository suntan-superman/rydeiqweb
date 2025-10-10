import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRiderOnboarding } from '../../../contexts/RiderOnboardingContext';
import Button from '../../common/Button';
import Input from '../../common/Input';
import toast from 'react-hot-toast';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const RiderAddressInfoForm = () => {
  const { riderProfile, updateStep, goToNextStep, goToPreviousStep, saving, ONBOARDING_STEPS } = useRiderOnboarding();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm({
    defaultValues: {
      address: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  useEffect(() => {
    if (riderProfile) {
      setValue('address', riderProfile.address || '');
      setValue('addressLine2', riderProfile.addressLine2 || '');
      setValue('city', riderProfile.city || '');
      setValue('state', riderProfile.state || '');
      setValue('zipCode', riderProfile.zipCode || '');
    }
  }, [riderProfile, setValue]);

  const onSubmit = async (data) => {
    const result = await updateStep(ONBOARDING_STEPS.ADDRESS_INFO, {
      address: data.address,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode
    });

    if (result.success) {
      toast.success('Address information saved!');
      goToNextStep();
    } else {
      toast.error('Failed to save address');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Address Information</h1>
          <p className="text-gray-600">
            Your home address helps us provide faster service and better ride estimates.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Street Address */}
          <Input
            label="Street Address"
            required
            {...register('address', { required: 'Street address is required' })}
            error={errors.address?.message}
            placeholder="123 Main Street"
          />

          {/* Address Line 2 */}
          <Input
            label="Apartment, Suite, etc. (Optional)"
            {...register('addressLine2')}
            placeholder="Apt 4B"
          />

          {/* City, State, ZIP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Input
                label="City"
                required
                {...register('city', { required: 'City is required' })}
                error={errors.city?.message}
                placeholder="San Francisco"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <select
                {...register('state', { required: 'State is required' })}
                className="input-field"
              >
                <option value="">Select State</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && (
                <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
              )}
            </div>

            <div className="md:col-span-1">
              <Input
                label="ZIP Code"
                required
                {...register('zipCode', {
                  required: 'ZIP code is required',
                  pattern: {
                    value: /^\d{5}(-\d{4})?$/,
                    message: 'Please enter a valid ZIP code'
                  }
                })}
                error={errors.zipCode?.message}
                placeholder="94102"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Why we need your address
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Quick booking from home with one tap</li>
                  <li>• Better ride time estimates</li>
                  <li>• Personalized service in your area</li>
                  <li>• Your address is never shared with drivers until you book a ride</li>
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

export default RiderAddressInfoForm;

