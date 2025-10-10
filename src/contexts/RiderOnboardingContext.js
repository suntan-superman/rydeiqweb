import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';

const RiderOnboardingContext = createContext();

export const useRiderOnboarding = () => {
  const context = useContext(RiderOnboardingContext);
  if (!context) {
    throw new Error('useRiderOnboarding must be used within a RiderOnboardingProvider');
  }
  return context;
};

// Onboarding step constants
export const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  PERSONAL_INFO: 'personal_info',
  PROFILE_PICTURE: 'profile_picture',
  ADDRESS_INFO: 'address_info',
  PAYMENT_METHOD: 'payment_method',
  EMERGENCY_CONTACT: 'emergency_contact',
  PREFERENCES: 'preferences',
  REVIEW: 'review',
  COMPLETE: 'complete'
};

const STEP_ORDER = [
  ONBOARDING_STEPS.WELCOME,
  ONBOARDING_STEPS.PERSONAL_INFO,
  ONBOARDING_STEPS.PROFILE_PICTURE,
  ONBOARDING_STEPS.ADDRESS_INFO,
  ONBOARDING_STEPS.PAYMENT_METHOD,
  ONBOARDING_STEPS.EMERGENCY_CONTACT,
  ONBOARDING_STEPS.PREFERENCES,
  ONBOARDING_STEPS.REVIEW,
  ONBOARDING_STEPS.COMPLETE
];

export const RiderOnboardingProvider = ({ children }) => {
  const { user } = useAuth();
  const [riderProfile, setRiderProfile] = useState(null);
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.WELCOME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load rider profile data
  useEffect(() => {
    const loadRiderProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setRiderProfile(userData);
          
          // Set current step based on saved progress
          if (userData.onboardingCompleted) {
            setCurrentStep(ONBOARDING_STEPS.COMPLETE);
          } else if (userData.onboardingStep) {
            setCurrentStep(userData.onboardingStep);
          }

          // Calculate progress
          calculateProgress(userData);
        }
      } catch (error) {
        console.error('Error loading rider profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRiderProfile();
  }, [user]);

  // Calculate onboarding progress
  const calculateProgress = (profile) => {
    if (!profile) {
      setProgress(0);
      return;
    }

    let completedSteps = 0;
    const totalSteps = STEP_ORDER.length - 2; // Exclude welcome and complete

    // Check each required section
    if (profile.personalInfo?.dateOfBirth && profile.personalInfo?.gender) completedSteps++;
    if (profile.photoURL) completedSteps++;
    if (profile.address && profile.city && profile.state) completedSteps++;
    if (profile.paymentMethods && profile.paymentMethods.length > 0) completedSteps++;
    if (profile.emergencyContact?.name && profile.emergencyContact?.phone) completedSteps++;
    if (profile.preferences) completedSteps++;

    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
    setProgress(progressPercentage);
  };

  // Update a specific step's data
  const updateStep = async (stepName, data) => {
    if (!user) return { success: false, error: 'No user logged in' };

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      const updateData = {
        ...data,
        onboardingStep: stepName,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updateData);

      // Update local state
      const updatedProfile = { ...riderProfile, ...data };
      setRiderProfile(updatedProfile);
      calculateProgress(updatedProfile);

      return { success: true };
    } catch (error) {
      console.error('Error updating step:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    if (!user) return { success: false, error: 'No user logged in' };

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      await updateDoc(userRef, {
        onboardingCompleted: true,
        onboardingCompletedAt: serverTimestamp(),
        onboardingStep: ONBOARDING_STEPS.COMPLETE,
        updatedAt: serverTimestamp()
      });

      setCurrentStep(ONBOARDING_STEPS.COMPLETE);
      setProgress(100);

      return { success: true };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  // Navigate to next step
  const goToNextStep = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  };

  // Go to specific step
  const goToStep = (stepName) => {
    if (STEP_ORDER.includes(stepName)) {
      setCurrentStep(stepName);
    }
  };

  // Check if a step is completed
  const isStepCompleted = (stepName) => {
    if (!riderProfile) return false;

    switch (stepName) {
      case ONBOARDING_STEPS.PERSONAL_INFO:
        return !!(riderProfile.personalInfo?.dateOfBirth && riderProfile.personalInfo?.gender);
      case ONBOARDING_STEPS.PROFILE_PICTURE:
        return !!riderProfile.photoURL;
      case ONBOARDING_STEPS.ADDRESS_INFO:
        return !!(riderProfile.address && riderProfile.city && riderProfile.state);
      case ONBOARDING_STEPS.PAYMENT_METHOD:
        return !!(riderProfile.paymentMethods && riderProfile.paymentMethods.length > 0);
      case ONBOARDING_STEPS.EMERGENCY_CONTACT:
        return !!(riderProfile.emergencyContact?.name && riderProfile.emergencyContact?.phone);
      case ONBOARDING_STEPS.PREFERENCES:
        return !!riderProfile.preferences;
      default:
        return false;
    }
  };

  const value = {
    riderProfile,
    currentStep,
    loading,
    saving,
    progress,
    ONBOARDING_STEPS,
    updateStep,
    completeOnboarding,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isStepCompleted
  };

  return (
    <RiderOnboardingContext.Provider value={value}>
      {children}
    </RiderOnboardingContext.Provider>
  );
};

