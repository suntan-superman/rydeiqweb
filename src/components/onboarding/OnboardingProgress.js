import React from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

const OnboardingProgress = () => {
  const { currentStepIndex, totalSteps, progressPercentage, currentStep } = useOnboarding();

  const getStepTitle = (step) => {
    const titles = {
      welcome: 'Welcome',
      personal_info: 'Personal Info',
      profile_picture: 'Profile Picture',
      emergency_contact: 'Emergency Contact',
      payment_setup: 'Payment Setup',
      terms: 'Terms & Conditions',
      email_verification: 'Email Verification',
      complete: 'Complete'
    };
    return titles[step] || 'Step';
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step Title */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {getStepTitle(currentStep)}
          </h2>
        </div>

        {/* Step Indicators */}
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index <= currentStepIndex
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingProgress;
