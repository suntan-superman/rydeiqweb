import React from 'react';
import { useRiderOnboarding } from '../../../contexts/RiderOnboardingContext';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../common/Button';

const RiderWelcomeScreen = () => {
  const { goToNextStep } = useRiderOnboarding();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-primary-100 rounded-full mb-6">
            <svg className="w-16 h-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to AnyRyde! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Hi {user?.firstName || user?.displayName || 'there'}!
          </p>
          
          <p className="text-gray-600 max-w-lg mx-auto">
            Let's get your profile set up so you can start booking rides. This will only take a few minutes.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">What we'll need:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600">👤</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Personal Information</h3>
                <p className="text-sm text-gray-600">Date of birth, gender, contact details</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600">📸</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Profile Picture</h3>
                <p className="text-sm text-gray-600">Help drivers identify you</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600">🏠</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Address</h3>
                <p className="text-sm text-gray-600">For faster ride booking</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600">💳</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Payment Method</h3>
                <p className="text-sm text-gray-600">Secure payment information</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600">🚨</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Emergency Contact</h3>
                <p className="text-sm text-gray-600">For your safety</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600">⚙️</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Preferences</h3>
                <p className="text-sm text-gray-600">Customize your experience</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Your information is secure
              </h3>
              <p className="text-sm text-blue-800">
                We use industry-standard encryption to protect your data. You can update your information anytime from your profile.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={goToNextStep}
          variant="primary"
          size="large"
          className="w-full"
        >
          Let's Get Started →
        </Button>

        <p className="text-center text-sm text-gray-500 mt-4">
          This should take about 5 minutes to complete
        </p>
      </div>
    </div>
  );
};

export default RiderWelcomeScreen;

