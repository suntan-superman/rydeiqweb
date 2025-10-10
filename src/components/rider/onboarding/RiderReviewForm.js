import React from 'react';
import { useRiderOnboarding } from '../../../contexts/RiderOnboardingContext';
import Button from '../../common/Button';
import toast from 'react-hot-toast';

const RiderReviewForm = () => {
  const { riderProfile, completeOnboarding, goToPreviousStep, goToStep, saving, ONBOARDING_STEPS } = useRiderOnboarding();

  const handleSubmit = async () => {
    const result = await completeOnboarding();

    if (result.success) {
      toast.success('Profile completed successfully!');
    } else {
      toast.error('Failed to complete profile');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Information</h1>
          <p className="text-gray-600">
            Please review your information before submitting. You can edit any section by clicking the Edit button.
          </p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">👤 Personal Information</h3>
              <Button
                variant="ghost"
                size="small"
                onClick={() => goToStep(ONBOARDING_STEPS.PERSONAL_INFO)}
              >
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium text-gray-900">{riderProfile?.displayName || 'Not set'}</p>
              </div>
              <div>
                <span className="text-gray-600">Date of Birth:</span>
                <p className="font-medium text-gray-900">{formatDate(riderProfile?.personalInfo?.dateOfBirth)}</p>
              </div>
              <div>
                <span className="text-gray-600">Gender:</span>
                <p className="font-medium text-gray-900 capitalize">{riderProfile?.personalInfo?.gender || 'Not set'}</p>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <p className="font-medium text-gray-900">{riderProfile?.phoneNumber || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Profile Picture */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📸 Profile Picture</h3>
              <Button
                variant="ghost"
                size="small"
                onClick={() => goToStep(ONBOARDING_STEPS.PROFILE_PICTURE)}
              >
                Edit
              </Button>
            </div>
            {riderProfile?.photoURL ? (
              <div className="flex items-center space-x-4">
                <img
                  src={riderProfile.photoURL}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="text-green-600 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Photo uploaded
                </div>
              </div>
            ) : (
              <p className="text-yellow-600">⚠️ No photo uploaded</p>
            )}
          </div>

          {/* Address */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🏠 Address</h3>
              <Button
                variant="ghost"
                size="small"
                onClick={() => goToStep(ONBOARDING_STEPS.ADDRESS_INFO)}
              >
                Edit
              </Button>
            </div>
            <p className="text-gray-900">
              {riderProfile?.address && riderProfile?.city && riderProfile?.state
                ? `${riderProfile.address}${riderProfile.addressLine2 ? ', ' + riderProfile.addressLine2 : ''}, ${riderProfile.city}, ${riderProfile.state} ${riderProfile.zipCode}`
                : 'Not set'}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">💳 Payment Methods</h3>
              <Button
                variant="ghost"
                size="small"
                onClick={() => goToStep(ONBOARDING_STEPS.PAYMENT_METHOD)}
              >
                Edit
              </Button>
            </div>
            {riderProfile?.paymentMethods && riderProfile.paymentMethods.length > 0 ? (
              <div className="space-y-2">
                {riderProfile.paymentMethods.map((card) => (
                  <div key={card.id} className="flex items-center space-x-3 text-sm">
                    <div className="w-10 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{card.cardType?.slice(0, 1)}</span>
                    </div>
                    <span className="text-gray-900">
                      {card.cardType} ending in {card.last4}
                    </span>
                    {card.isDefault && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-yellow-600">⚠️ No payment method added</p>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🚨 Emergency Contact</h3>
              <Button
                variant="ghost"
                size="small"
                onClick={() => goToStep(ONBOARDING_STEPS.EMERGENCY_CONTACT)}
              >
                Edit
              </Button>
            </div>
            {riderProfile?.emergencyContact?.name ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium text-gray-900">{riderProfile.emergencyContact.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Relationship:</span>
                  <p className="font-medium text-gray-900 capitalize">{riderProfile.emergencyContact.relationship}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium text-gray-900">{riderProfile.emergencyContact.phone}</p>
                </div>
                {riderProfile.emergencyContact.email && (
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-900">{riderProfile.emergencyContact.email}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-yellow-600">⚠️ No emergency contact added</p>
            )}
          </div>

          {/* Preferences Summary */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">⚙️ Preferences</h3>
              <Button
                variant="ghost"
                size="small"
                onClick={() => goToStep(ONBOARDING_STEPS.PREFERENCES)}
              >
                Edit
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              {riderProfile?.preferences?.accessibility && Object.values(riderProfile.preferences.accessibility).some(v => v === true) && (
                <div>
                  <span className="text-gray-600">Accessibility:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {riderProfile.preferences.accessibility.wheelchairAccessible && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">♿ Wheelchair</span>
                    )}
                    {riderProfile.preferences.accessibility.serviceAnimal && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">🐕‍🦺 Service Animal</span>
                    )}
                  </div>
                </div>
              )}
              <div>
                <span className="text-gray-600">Ride Preferences:</span>
                <p className="text-gray-900 capitalize">
                  {riderProfile?.preferences?.ridePreferences?.temperature} temp, 
                  {riderProfile?.preferences?.ridePreferences?.music} music, 
                  {riderProfile?.preferences?.ridePreferences?.conversation} conversation
                </p>
              </div>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                  Before you continue
                </h3>
                <p className="text-sm text-yellow-800">
                  By completing your profile, you agree to our{' '}
                  <a href="/terms" target="_blank" className="underline font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="underline font-medium">Privacy Policy</a>.
                  You can update your information anytime from your profile.
                </p>
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
              type="button"
              variant="primary"
              onClick={handleSubmit}
              loading={saving}
              disabled={saving}
              size="large"
            >
              Complete Profile ✓
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderReviewForm;

