import React from 'react';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';

const OnboardingProgress = ({ currentStep, progress, applicationStatus }) => {
  const { 
    ONBOARDING_STEPS, 
    getStepStatus,
    goToStep,
    isStepAccessible
  } = useDriverOnboarding();

  const steps = [
    {
      key: ONBOARDING_STEPS.PERSONAL_INFO,
      name: 'Personal Info',
      description: 'Basic information'
    },
    {
      key: ONBOARDING_STEPS.DOCUMENT_UPLOAD,
      name: 'Documents',
      description: 'Upload required documents'
    },
    {
      key: ONBOARDING_STEPS.VIDEO_EQUIPMENT_VERIFICATION,
      name: 'Video Equipment',
      description: 'Video recording setup'
    },
    {
      key: ONBOARDING_STEPS.VEHICLE_INFO,
      name: 'Vehicle',
      description: 'Vehicle details'
    },
    {
      key: ONBOARDING_STEPS.BACKGROUND_CHECK,
      name: 'Background',
      description: 'Background check'
    },
    {
      key: ONBOARDING_STEPS.PAYOUT_SETUP,
      name: 'Payout',
      description: 'Payment setup'
    },
    {
      key: ONBOARDING_STEPS.AVAILABILITY,
      name: 'Availability',
      description: 'Schedule & coverage'
    },
    {
      key: ONBOARDING_STEPS.REVIEW,
      name: 'Review',
      description: 'Review & submit'
    }
  ];

  const getStepIcon = (step, status) => {
    // Add null check for step parameter
    if (!step || !step.key) {
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-100 text-gray-400">
          ?
        </div>
      );
    }

    const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium";
    
    switch (status) {
      case 'completed':
        return (
          <div className={`${baseClasses} bg-primary-600 text-white`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'current':
        return (
          <div className={`${baseClasses} bg-primary-600 text-white border-2 border-primary-200`}>
            {steps.findIndex(s => s.key === step.key) + 1}
          </div>
        );
      case 'accessible':
        return (
          <div className={`${baseClasses} bg-white border-2 border-gray-300 text-gray-500 hover:border-primary-300 cursor-pointer`}>
            {steps.findIndex(s => s.key === step.key) + 1}
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-100 text-gray-400`}>
            {steps.findIndex(s => s.key === step.key) + 1}
          </div>
        );
    }
  };

  const getStepTextClasses = (status) => {
    switch (status) {
      case 'completed':
      case 'current':
        return 'text-gray-900';
      case 'accessible':
        return 'text-gray-600 hover:text-gray-900 cursor-pointer';
      default:
        return 'text-gray-400';
    }
  };

  const handleStepClick = (step) => {
    if (step && step.key && isStepAccessible(step.key)) {
      goToStep(step.key);
    }
  };

  // Get current step info with fallback
  const getCurrentStepInfo = () => {
    const currentStepInfo = steps.find(s => s.key === currentStep);
    if (currentStepInfo) {
      return currentStepInfo;
    }
    // Fallback for welcome step or other steps not in the array
    return {
      key: currentStep,
      name: currentStep === ONBOARDING_STEPS.WELCOME ? 'Welcome' : 'Getting Started',
      description: 'Beginning your driver application'
    };
  };

  // Don't show progress component for welcome step
  if (currentStep === ONBOARDING_STEPS.WELCOME) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Driver Application</h2>
              {applicationStatus && (
                <p className="text-sm text-gray-600">
                  Status: <span className="font-medium capitalize">{applicationStatus.replace('_', ' ')}</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{progress}% Complete</div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Desktop Step Navigation */}
          <nav className="hidden lg:flex" aria-label="Progress">
            <ol className="flex items-center w-full">
              {steps.map((step, stepIdx) => {
                const status = getStepStatus(step.key);
                const isClickable = isStepAccessible(step.key);
                
                return (
                  <li key={step.key} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} flex-1`}>
                    {/* Connection Line */}
                    {stepIdx !== steps.length - 1 && (
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className={`h-0.5 w-full ${
                          getStepStatus(steps[stepIdx + 1].key) !== 'locked' ? 'bg-primary-600' : 'bg-gray-200'
                        }`} />
                      </div>
                    )}
                    
                    <div 
                      className={`relative flex items-center group ${isClickable ? 'cursor-pointer' : ''}`}
                      onClick={() => handleStepClick(step)}
                    >
                      {getStepIcon(step, status)}
                      <div className="ml-4 min-w-0">
                        <div className={`text-sm font-medium ${getStepTextClasses(status)}`}>
                          {step.name}
                        </div>
                        <div className="text-xs text-gray-500">{step.description}</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Mobile Step Navigation */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getStepIcon(getCurrentStepInfo(), 'current')}
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {getCurrentStepInfo().name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Step {Math.max(1, steps.findIndex(s => s.key === currentStep) + 1)} of {steps.length}
                  </div>
                </div>
              </div>
              
              {/* Mobile Progress Dots */}
              <div className="flex space-x-2">
                {steps.map((step) => {
                  const status = getStepStatus(step.key);
                  return (
                    <div
                      key={step.key}
                      className={`w-2 h-2 rounded-full ${
                        status === 'completed' ? 'bg-primary-600' :
                        status === 'current' ? 'bg-primary-400' :
                        'bg-gray-200'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingProgress; 