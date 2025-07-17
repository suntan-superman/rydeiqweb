import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  getDriverApplication, 
  createDriverApplication,
  updateDriverStep,
  getOnboardingProgress,
  ONBOARDING_STEPS,
  DRIVER_STATUS
} from '../services/driverService';
import toast from 'react-hot-toast';

const DriverOnboardingContext = createContext();

export const useDriverOnboarding = () => {
  const context = useContext(DriverOnboardingContext);
  if (!context) {
    throw new Error('useDriverOnboarding must be used within a DriverOnboardingProvider');
  }
  return context;
};

export const DriverOnboardingProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [driverApplication, setDriverApplication] = useState(null);
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.WELCOME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const loadDriverApplication = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getDriverApplication(user.uid);
      
      if (result.success) {
        setDriverApplication(result.data);
        setCurrentStep(result.data.currentStep || ONBOARDING_STEPS.PERSONAL_INFO);
      } else {
        // No existing application
        setDriverApplication(null);
        setCurrentStep(ONBOARDING_STEPS.WELCOME);
      }
    } catch (error) {
      console.error('Error loading driver application:', error);
      setError('Failed to load driver application');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load existing driver application on user change
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      loadDriverApplication();
    } else {
      setDriverApplication(null);
      setCurrentStep(ONBOARDING_STEPS.WELCOME);
      setLoading(false);
      setProgress(0);
    }
  }, [user, isAuthenticated, loadDriverApplication]);

  // Update progress when application data changes
  useEffect(() => {
    if (driverApplication?.stepProgress) {
      const progressPercentage = getOnboardingProgress(driverApplication.stepProgress);
      setProgress(progressPercentage);
    }
  }, [driverApplication]);

  const startApplication = async () => {
    if (!user?.uid) {
      setError('You must be logged in to start driver onboarding');
      return { success: false };
    }

    setSaving(true);
    setError(null);

    try {
      const result = await createDriverApplication(user.uid, {
        email: user.email,
        displayName: user.displayName || user.email
      });

      if (result.success) {
        setDriverApplication(result.data);
        setCurrentStep(ONBOARDING_STEPS.PERSONAL_INFO);
        toast.success('Driver application started successfully!');
        return { success: true };
      } else {
        setError(result.error);
        toast.error('Failed to start driver application');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error starting driver application:', error);
      setError('Failed to start driver application');
      toast.error('Failed to start driver application');
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  const updateStep = async (stepName, stepData) => {
    if (!user?.uid) {
      setError('You must be logged in to update driver information');
      return { success: false };
    }

    setSaving(true);
    setError(null);

    try {
      const result = await updateDriverStep(user.uid, stepName, stepData);

      if (result.success) {
        // Reload the application to get updated data
        await loadDriverApplication();
        toast.success('Information saved successfully!');
        return { success: true };
      } else {
        setError(result.error);
        toast.error('Failed to save information');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating driver step:', error);
      setError('Failed to save information');
      toast.error('Failed to save information');
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const goToNextStep = () => {
    const stepOrder = Object.values(ONBOARDING_STEPS);
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const stepOrder = Object.values(ONBOARDING_STEPS);
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const isStepCompleted = (step) => {
    return driverApplication?.stepProgress?.[step] || false;
  };

  const isStepAccessible = (step) => {
    const stepOrder = Object.values(ONBOARDING_STEPS);
    const stepIndex = stepOrder.indexOf(step);
    const currentIndex = stepOrder.indexOf(currentStep);
    
    // Allow access to current step and all previous steps
    return stepIndex <= currentIndex;
  };

  const canProceedToNextStep = (step) => {
    return isStepCompleted(step);
  };

  const getStepStatus = (step) => {
    if (isStepCompleted(step)) return 'completed';
    if (step === currentStep) return 'current';
    if (isStepAccessible(step)) return 'accessible';
    return 'locked';
  };

  const refreshApplication = async () => {
    await loadDriverApplication();
  };

  const resetApplication = () => {
    setDriverApplication(null);
    setCurrentStep(ONBOARDING_STEPS.WELCOME);
    setProgress(0);
    setError(null);
  };

  const value = {
    // State
    driverApplication,
    currentStep,
    loading,
    saving,
    error,
    progress,
    
    // Actions
    startApplication,
    updateStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    refreshApplication,
    resetApplication,
    
    // Utilities
    isStepCompleted,
    isStepAccessible,
    canProceedToNextStep,
    getStepStatus,
    
    // Constants
    ONBOARDING_STEPS,
    DRIVER_STATUS,
    
    // Computed properties
    isApplicationStarted: !!driverApplication,
    isApplicationSubmitted: driverApplication?.status === DRIVER_STATUS.REVIEW_PENDING || 
                           driverApplication?.status === DRIVER_STATUS.APPROVED ||
                           driverApplication?.status === DRIVER_STATUS.REJECTED,
    applicationStatus: driverApplication?.status || DRIVER_STATUS.PENDING,
  };

  return (
    <DriverOnboardingContext.Provider value={value}>
      {children}
    </DriverOnboardingContext.Provider>
  );
}; 