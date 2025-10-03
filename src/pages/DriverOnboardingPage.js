import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DriverOnboardingProvider, useDriverOnboarding } from '../contexts/DriverOnboardingContext';
import { useAuth } from '../contexts/AuthContext';
import WelcomeScreen from '../components/driver/WelcomeScreen';
import PersonalInfoForm from '../components/driver/PersonalInfoForm';
import DocumentUploadForm from '../components/driver/DocumentUploadForm';
import VehicleInfoForm from '../components/driver/VehicleInfoForm';
import BackgroundCheckForm from '../components/driver/BackgroundCheckForm';
import PayoutSetupForm from '../components/driver/PayoutSetupForm';
import AvailabilityForm from '../components/driver/AvailabilityForm';
import ReviewForm from '../components/driver/ReviewForm';
import OnboardingProgress from '../components/driver/OnboardingProgress';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DRIVER_STATUS } from '../services/driverService';
import { logoutUser } from '../services/authService';
import toast from 'react-hot-toast';

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
  const { driverApplication, applicationStatus } = useDriverOnboarding();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Show initial success toast
    toast.success('Application submitted successfully! You will receive a notification once your application is approved.', {
      duration: 4000,
      position: 'top-center',
    });

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRedirect = async () => {
    setIsRedirecting(true);
    
    // Log out the user
    try {
      await logoutUser();
      setUser(null);
      toast.success('You have been logged out. Please log in again once your application is approved.');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Fallback to home page if logout fails
      navigate('/');
    }
  };

  const getStatusMessage = () => {
    const status = applicationStatus();
    switch (status) {
      case DRIVER_STATUS.REVIEW_PENDING:
        return {
          title: "Application Submitted Successfully!",
          message: "Thank you for applying to become an AnyRyde driver. Our team is reviewing your information and will notify you via email within 24-48 hours.",
          color: "green"
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
            color === 'red' ? 'bg-red-100' :
            'bg-gray-100'
          }`}>
            {color === 'green' && (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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

          {/* Notification Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-green-900 mb-1">What's Next?</h3>
                <p className="text-sm text-green-800">
                  You will receive an email and push notification as soon as your application has been reviewed and approved. This typically takes 24-48 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Auto-redirect countdown */}
          {!isRedirecting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Logging you out in <strong className="text-lg">{countdown}</strong> seconds...
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Please log in again once your application is approved
              </p>
            </div>
          )}

          {isRedirecting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <LoadingSpinner size="small" />
              <p className="text-sm text-blue-800 mt-2">Redirecting...</p>
            </div>
          )}
          
          <div className="space-y-3">
            {applicationStatus() === DRIVER_STATUS.APPROVED && (
              <button 
                onClick={() => navigate('/driver-dashboard')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Access Driver Dashboard
              </button>
            )}
            
            <button
              onClick={handleRedirect}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              disabled={isRedirecting}
            >
              {isRedirecting ? 'Logging Out...' : 'Log Out Now'}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 underline"
              disabled={isRedirecting}
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