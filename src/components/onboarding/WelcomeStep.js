import React from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import Button from '../common/Button';
import OnboardingProgress from './OnboardingProgress';

const WelcomeStep = () => {
  const { nextStep } = useOnboarding();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <OnboardingProgress />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-20 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">R</span>
            </div>
          </div>

          {/* Welcome Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Your Rider Profile
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Just a few quick steps to get you started. We'll need your profile picture and payment information.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Money</h3>
              <p className="text-gray-600">Get competitive bids from drivers and choose the best price for your ride.</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Safe & Secure</h3>
              <p className="text-gray-600">All drivers are verified with background checks and insurance coverage.</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast & Reliable</h3>
              <p className="text-gray-600">Quick matching with nearby drivers and real-time ride tracking.</p>
            </div>
          </div>
        </div>

        {/* Get Started Button */}
        <div className="max-w-2xl mx-auto text-center">
          <Button
            onClick={() => nextStep()}
            variant="primary"
            size="large"
            className="px-12 py-3 min-w-[200px]"
          >
            Get Started <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeStep;
