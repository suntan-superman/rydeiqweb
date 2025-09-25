import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding, OnboardingProvider, ONBOARDING_STEPS } from '../contexts/OnboardingContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Import onboarding step components
import WelcomeStep from '../components/onboarding/WelcomeStep';
import ProfilePictureStep from '../components/onboarding/ProfilePictureStep';
import PaymentSetupStep from '../components/onboarding/PaymentSetupStep';
import CompleteStep from '../components/onboarding/CompleteStep';

// Onboarding content component
const OnboardingContent = () => {
  const { currentStep, isLoading } = useOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only redirect if user is already logged in and fully onboarded
  useEffect(() => {
    if (user && user.emailVerified && user.onboardingComplete) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" text="Setting up your account..." />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        return <WelcomeStep />;
      case ONBOARDING_STEPS.PROFILE_PICTURE:
        return <ProfilePictureStep />;
      case ONBOARDING_STEPS.PAYMENT_SETUP:
        return <PaymentSetupStep />;
      case ONBOARDING_STEPS.COMPLETE:
        return <CompleteStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderStep()}
    </div>
  );
};

// Main onboarding page with provider
const OnboardingPage = () => {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
};

export default OnboardingPage;
