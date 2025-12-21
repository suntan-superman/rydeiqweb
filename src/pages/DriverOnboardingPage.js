import React from 'react';
import { DriverOnboardingProvider, useDriverOnboarding } from '../contexts/DriverOnboardingContext';
import WelcomeScreen from '../components/driver/WelcomeScreen';
import PersonalInfoForm from '../components/driver/PersonalInfoForm';
import DocumentUploadForm from '../components/driver/DocumentUploadForm';
import VideoEquipmentVerificationForm from '../components/driver/VideoEquipmentVerificationForm';
import VehicleInfoForm from '../components/driver/VehicleInfoForm';
import BackgroundCheckForm from '../components/driver/BackgroundCheckForm';
import PayoutSetupForm from '../components/driver/PayoutSetupForm';
import AvailabilityForm from '../components/driver/AvailabilityForm';
import ReviewForm from '../components/driver/ReviewForm';
import OnboardingProgress from '../components/driver/OnboardingProgress';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DriverOnboardingContent = () => {
  const { 
    currentStep, 
    loading, 
    ONBOARDING_STEPS,
    isApplicationStarted,
    progress,
    applicationStatus
  } = useDriverOnboarding();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading your application..." />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        return <WelcomeScreen />;
      case ONBOARDING_STEPS.PERSONAL_INFO:
        return <PersonalInfoForm />;
      case ONBOARDING_STEPS.DOCUMENT_UPLOAD:
        return <DocumentUploadForm />;
      case ONBOARDING_STEPS.VIDEO_EQUIPMENT_VERIFICATION:
        return <VideoEquipmentVerificationForm />;
      case ONBOARDING_STEPS.VEHICLE_INFO:
        return <VehicleInfoForm />;
      case ONBOARDING_STEPS.BACKGROUND_CHECK:
        return <BackgroundCheckForm />;
      case ONBOARDING_STEPS.PAYOUT_SETUP:
        return <PayoutSetupForm />;
      case ONBOARDING_STEPS.AVAILABILITY:
        return <AvailabilityForm />;
      case ONBOARDING_STEPS.REVIEW:
        return <ReviewForm />;
      case ONBOARDING_STEPS.SUBMITTED:
        return <ApplicationSubmittedScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  const showProgress = isApplicationStarted && currentStep !== ONBOARDING_STEPS.WELCOME;

  return (
    <div className="min-h-screen bg-gray-50">
      {showProgress && (
        <OnboardingProgress 
          currentStep={currentStep}
          progress={progress}
          applicationStatus={applicationStatus}
        />
      )}
      {renderStep()}
    </div>
  );
};

// Application Submitted Screen
const ApplicationSubmittedScreen = () => {
  const { driverApplication, applicationStatus, DRIVER_STATUS } = useDriverOnboarding();

  const getStatusMessage = () => {
    switch (applicationStatus) {
      case DRIVER_STATUS.REVIEW_PENDING:
        return {
          title: "Application Submitted!",
          message: "Thank you for your application. Our team is reviewing your information and will get back to you within 24-48 hours.",
          color: "blue"
        };
      case DRIVER_STATUS.APPROVED:
        return {
          title: "Congratulations! You're Approved!",
          message: "Welcome to the AnyRyde driver network! You can now start accepting rides and earning money.",
          color: "green"
        };
      case DRIVER_STATUS.REJECTED:
        return {
          title: "Application Update",
          message: "Unfortunately, we're unable to approve your application at this time. Please contact support for more information.",
          color: "red"
        };
      default:
        return {
          title: "Application in Progress",
          message: "Your application is being processed. We'll notify you of any updates.",
          color: "gray"
        };
    }
  };

  const { title, message, color } = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
            color === 'green' ? 'bg-green-100' :
            color === 'blue' ? 'bg-blue-100' :
            color === 'red' ? 'bg-red-100' :
            'bg-gray-100'
          }`}>
            {color === 'green' && (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {color === 'blue' && (
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {color === 'red' && (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {color === 'gray' && (
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          
          {driverApplication?.submittedAt && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Submitted:</span>{' '}
                {new Date(driverApplication.submittedAt.seconds * 1000).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Application ID:</span>{' '}
                {driverApplication.userId.slice(-8).toUpperCase()}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {applicationStatus === DRIVER_STATUS.APPROVED && (
              <button className="w-full btn btn-primary">
                Access Driver Dashboard
              </button>
            )}
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full btn btn-secondary"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DriverOnboardingPage = () => {
  return (
    <DriverOnboardingProvider>
      <DriverOnboardingContent />
    </DriverOnboardingProvider>
  );
};

export default DriverOnboardingPage; 