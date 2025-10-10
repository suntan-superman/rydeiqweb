import React, { useState, useEffect } from 'react';
import { useRiderOnboarding } from '../../../contexts/RiderOnboardingContext';
import Button from '../../common/Button';
import toast from 'react-hot-toast';

const RiderPreferencesForm = () => {
  const { riderProfile, updateStep, goToNextStep, goToPreviousStep, saving, ONBOARDING_STEPS } = useRiderOnboarding();

  const [preferences, setPreferences] = useState({
    accessibility: {
      wheelchairAccessible: false,
      hearingImpaired: false,
      visuallyImpaired: false,
      serviceAnimal: false,
      other: ''
    },
    ridePreferences: {
      temperature: 'neutral',
      music: 'ask',
      conversation: 'neutral'
    },
    notifications: {
      push: true,
      sms: true,
      email: true
    }
  });

  useEffect(() => {
    if (riderProfile?.preferences) {
      setPreferences(prev => ({
        accessibility: riderProfile.preferences.accessibility || prev.accessibility,
        ridePreferences: riderProfile.preferences.ridePreferences || prev.ridePreferences,
        notifications: riderProfile.preferences.notifications || prev.notifications
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderProfile]);

  const handleAccessibilityChange = (field) => {
    setPreferences(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [field]: !prev.accessibility[field]
      }
    }));
  };

  const handleRidePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      ridePreferences: {
        ...prev.ridePreferences,
        [field]: value
      }
    }));
  };

  const handleNotificationChange = (field) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: !prev.notifications[field]
      }
    }));
  };

  const handleSubmit = async () => {
    const result = await updateStep(ONBOARDING_STEPS.PREFERENCES, {
      preferences: preferences
    });

    if (result.success) {
      toast.success('Preferences saved!');
      goToNextStep();
    } else {
      toast.error('Failed to save preferences');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Preferences</h1>
          <p className="text-gray-600">
            Customize your ride experience. You can update these anytime from your profile.
          </p>
        </div>

        <div className="space-y-8">
          {/* Accessibility Needs */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Accessibility Needs
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select any accessibility requirements you have. We'll match you with appropriate vehicles.
            </p>

            <div className="space-y-3">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={preferences.accessibility.wheelchairAccessible}
                  onChange={() => handleAccessibilityChange('wheelchairAccessible')}
                  className="h-5 w-5 text-primary-600 rounded"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">♿ Wheelchair Accessible Vehicle</p>
                  <p className="text-sm text-gray-600">Vehicle with ramp or lift</p>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={preferences.accessibility.hearingImpaired}
                  onChange={() => handleAccessibilityChange('hearingImpaired')}
                  className="h-5 w-5 text-primary-600 rounded"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">🦻 Hearing Impaired</p>
                  <p className="text-sm text-gray-600">Driver will use text communication</p>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={preferences.accessibility.visuallyImpaired}
                  onChange={() => handleAccessibilityChange('visuallyImpaired')}
                  className="h-5 w-5 text-primary-600 rounded"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">👁️ Visually Impaired</p>
                  <p className="text-sm text-gray-600">Driver will provide verbal assistance</p>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={preferences.accessibility.serviceAnimal}
                  onChange={() => handleAccessibilityChange('serviceAnimal')}
                  className="h-5 w-5 text-primary-600 rounded"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">🐕‍🦺 Service Animal</p>
                  <p className="text-sm text-gray-600">Traveling with a service animal</p>
                </div>
              </label>
            </div>
          </div>

          {/* Ride Preferences */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ride Preferences
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Let drivers know your preferences for a comfortable ride.
            </p>

            <div className="space-y-6">
              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Temperature Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['cool', 'neutral', 'warm'].map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => handleRidePreferenceChange('temperature', temp)}
                      className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                        preferences.ridePreferences.temperature === temp
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {temp === 'cool' && '❄️ Cool'}
                      {temp === 'neutral' && '🌡️ Neutral'}
                      {temp === 'warm' && '🔥 Warm'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Music */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Music Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['yes', 'no', 'ask'].map((music) => (
                    <button
                      key={music}
                      type="button"
                      onClick={() => handleRidePreferenceChange('music', music)}
                      className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                        preferences.ridePreferences.music === music
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {music === 'yes' && '🎵 Yes Please'}
                      {music === 'no' && '🔇 No Thanks'}
                      {music === 'ask' && '🤔 Ask Me'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Conversation Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['chatty', 'neutral', 'quiet'].map((conv) => (
                    <button
                      key={conv}
                      type="button"
                      onClick={() => handleRidePreferenceChange('conversation', conv)}
                      className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                        preferences.ridePreferences.conversation === conv
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {conv === 'chatty' && '💬 Chatty'}
                      {conv === 'neutral' && '😊 Neutral'}
                      {conv === 'quiet' && '🤫 Quiet Please'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Notification Preferences
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose how you'd like to receive ride updates and notifications.
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">📱 Push Notifications</p>
                  <p className="text-sm text-gray-600">Real-time updates in the app</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications.push}
                  onChange={() => handleNotificationChange('push')}
                  className="h-5 w-5 text-primary-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">💬 SMS Notifications</p>
                  <p className="text-sm text-gray-600">Text messages for important updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications.sms}
                  onChange={() => handleNotificationChange('sms')}
                  className="h-5 w-5 text-primary-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">📧 Email Notifications</p>
                  <p className="text-sm text-gray-600">Receipts and ride summaries</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications.email}
                  onChange={() => handleNotificationChange('email')}
                  className="h-5 w-5 text-primary-600 rounded"
                />
              </label>
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
            >
              Save and Continue →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderPreferencesForm;

