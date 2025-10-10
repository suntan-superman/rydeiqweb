import React from 'react';
import { useRiderOnboarding, RiderOnboardingProvider } from '../contexts/RiderOnboardingContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Import step components (we'll create these)
import RiderWelcomeScreen from '../components/rider/onboarding/RiderWelcomeScreen';
import RiderPersonalInfoForm from '../components/rider/onboarding/RiderPersonalInfoForm';
import RiderProfilePictureUpload from '../components/rider/onboarding/RiderProfilePictureUpload';
import RiderAddressInfoForm from '../components/rider/onboarding/RiderAddressInfoForm';
import RiderPaymentMethodForm from '../components/rider/onboarding/RiderPaymentMethodForm';
import RiderEmergencyContactForm from '../components/rider/onboarding/RiderEmergencyContactForm';
import RiderPreferencesForm from '../components/rider/onboarding/RiderPreferencesForm';
import RiderReviewForm from '../components/rider/onboarding/RiderReviewForm';
import RiderOnboardingComplete from '../components/rider/onboarding/RiderOnboardingComplete';
import OnboardingProgress from '../components/driver/OnboardingProgress';

const RiderOnboardingContent = () => {
  const { 
    currentStep, 
    loading, 
    ONBOARDING_STEPS,
    progress,
    riderProfile
  } = useRiderOnboarding();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading your profile..." />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        return <RiderWelcomeScreen />;
      case ONBOARDING_STEPS.PERSONAL_INFO:
        return <RiderPersonalInfoForm />;
      case ONBOARDING_STEPS.PROFILE_PICTURE:
        return <RiderProfilePictureUpload />;
      case ONBOARDING_STEPS.ADDRESS_INFO:
        return <RiderAddressInfoForm />;
      case ONBOARDING_STEPS.PAYMENT_METHOD:
        return <RiderPaymentMethodForm />;
      case ONBOARDING_STEPS.EMERGENCY_CONTACT:
        return <RiderEmergencyContactForm />;
      case ONBOARDING_STEPS.PREFERENCES:
        return <RiderPreferencesForm />;
      case ONBOARDING_STEPS.REVIEW:
        return <RiderReviewForm />;
      case ONBOARDING_STEPS.COMPLETE:
        return <RiderOnboardingComplete />;
      default:
        return <RiderWelcomeScreen />;
    }
  };

  const showProgress = currentStep !== ONBOARDING_STEPS.WELCOME && 
                       currentStep !== ONBOARDING_STEPS.COMPLETE;

  return (
    <div className="min-h-screen bg-gray-50">
      {showProgress && (
        <OnboardingProgress 
          currentStep={currentStep}
          progress={progress}
          applicationStatus={{ onboardingCompleted: riderProfile?.onboardingCompleted }}
        />
      )}
      {renderStep()}
    </div>
  );
};

const RiderOnboardingPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only allow riders (customers) to access this page
  if (user.role === 'driver') {
    return <Navigate to="/driver-onboarding" replace />;
  }

  return (
    <RiderOnboardingProvider>
      <RiderOnboardingContent />
    </RiderOnboardingProvider>
  );
};

export default RiderOnboardingPage;

