import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  getDriverApplication, 
  updateDriverStep, 
  completeOnboarding,
  createDriverApplication,
  submitDriverApplication,
  ONBOARDING_STEPS
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
  const { user } = useAuth();
  const [driverApplication, setDriverApplication] = useState(null);
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.WELCOME);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load driver application on mount
  useEffect(() => {
    const loadDriverApplication = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const result = await getDriverApplication(user.uid);
        if (result.success) {
          setDriverApplication(result.data);
          setCurrentStep(result.data.currentStep || ONBOARDING_STEPS.WELCOME);
        } else {
          // Create new application if none exists
          const createResult = await createDriverApplication(user.uid, {
            email: user.email,
            currentStep: ONBOARDING_STEPS.WELCOME
          });
          if (createResult.success) {
            setDriverApplication(createResult.data);
            setCurrentStep(ONBOARDING_STEPS.WELCOME);
          }
        }
      } catch (error) {
        console.error('Error loading driver application:', error);
        toast.error('Failed to load driver application');
      } finally {
        setLoading(false);
      }
    };

    loadDriverApplication();
  }, [user]);

  // Check if onboarding is complete and auto-complete if needed
  useEffect(() => {
    const checkAndCompleteOnboarding = async () => {
      if (!driverApplication || !user) return;

      const stepProgress = driverApplication.stepProgress || {};
      const allStepsComplete = Object.values(stepProgress).every(completed => completed);

      if (allStepsComplete && !driverApplication.onboardingStatus?.completed) {
        try {
          const result = await completeOnboarding(user.uid);
          if (result.success) {
            setDriverApplication(prev => ({
              ...prev,
              onboardingStatus: {
                completed: true,
                completedAt: new Date().toISOString(),
                completedBy: 'web',
                lastUpdated: new Date().toISOString()
              },
              approvalStatus: {
                status: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: 'system',
                notes: ''
              }
            }));
            toast.success('Onboarding completed successfully! You can now access the mobile app.');
          }
        } catch (error) {
          console.error('Error completing onboarding:', error);
        }
      }
    };

    checkAndCompleteOnboarding();
  }, [driverApplication, user]);

  const updateStep = useCallback(async (stepName, stepData) => {
    if (!user) return;

    try {
      setSaving(true);
      const result = await updateDriverStep(user.uid, stepName, stepData);
      
      if (result.success) {
        setDriverApplication(prev => ({
          ...prev,
          ...stepData,
          currentStep: stepName,
          updatedAt: new Date().toISOString()
        }));
        setCurrentStep(stepName);
        return { success: true };
      } else {
        toast.error('Failed to save step data');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating step:', error);
      toast.error('Error saving step data');
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user]);

  const goToNextStep = useCallback(async () => {
    const stepOrder = [
      ONBOARDING_STEPS.WELCOME,
      ONBOARDING_STEPS.PERSONAL_INFO,
      ONBOARDING_STEPS.DOCUMENT_UPLOAD,
      ONBOARDING_STEPS.VEHICLE_INFO,
      ONBOARDING_STEPS.BACKGROUND_CHECK,
      ONBOARDING_STEPS.PAYOUT_SETUP,
      ONBOARDING_STEPS.AVAILABILITY,
      ONBOARDING_STEPS.REVIEW,
      ONBOARDING_STEPS.SUBMITTED
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      setCurrentStep(nextStep);
      
      // Update the current step in the database
      if (driverApplication) {
        await updateStep(nextStep, { currentStep: nextStep });
      }
    }
  }, [currentStep, driverApplication, updateStep]);

  const goToPreviousStep = useCallback(() => {
    const stepOrder = [
      ONBOARDING_STEPS.WELCOME,
      ONBOARDING_STEPS.PERSONAL_INFO,
      ONBOARDING_STEPS.DOCUMENT_UPLOAD,
      ONBOARDING_STEPS.VEHICLE_INFO,
      ONBOARDING_STEPS.BACKGROUND_CHECK,
      ONBOARDING_STEPS.PAYOUT_SETUP,
      ONBOARDING_STEPS.AVAILABILITY,
      ONBOARDING_STEPS.REVIEW,
      ONBOARDING_STEPS.SUBMITTED
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = stepOrder[currentIndex - 1];
      setCurrentStep(prevStep);
    }
  }, [currentStep]);

  const submitApplication = useCallback(async () => {
    if (!user) return;

    try {
      setSaving(true);
      const result = await submitDriverApplication(user.uid);
      
      if (result.success) {
        setDriverApplication(prev => ({
          ...prev,
          status: 'submitted',
          submittedAt: new Date().toISOString()
        }));
        setCurrentStep(ONBOARDING_STEPS.SUBMITTED);
        toast.success('Application submitted successfully!');
        return { success: true };
      } else {
        toast.error('Failed to submit application');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Error submitting application');
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user]);

  const updateMobileAppStatus = useCallback(async (accountCreated = true) => {
    if (!user) return;

    try {
      const result = await updateMobileAppStatus(user.uid, accountCreated);
      if (result.success) {
        setDriverApplication(prev => ({
          ...prev,
          mobileAppStatus: {
            accountCreated,
            accountCreatedAt: accountCreated ? new Date().toISOString() : null,
            lastMobileLogin: new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      console.error('Error updating mobile app status:', error);
    }
  }, [user]);

  // Add missing startApplication function
  const startApplication = useCallback(async () => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setSaving(true);
      
      // Create new driver application if it doesn't exist
      if (!driverApplication) {
        const createResult = await createDriverApplication(user.uid, {
          email: user.email,
          currentStep: ONBOARDING_STEPS.WELCOME
        });
        
        if (createResult.success) {
          setDriverApplication(createResult.data);
          setCurrentStep(ONBOARDING_STEPS.WELCOME);
          return { success: true };
        } else {
          return { success: false, error: createResult.error };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error starting application:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user, driverApplication]);

  // Add isApplicationStarted computed property
  const isApplicationStarted = !!driverApplication;

  // Add missing getStepStatus function
  const getStepStatus = useCallback((stepKey) => {
    if (!driverApplication) return 'locked';
    
    const stepProgress = driverApplication.stepProgress || {};
    const stepOrder = [
      ONBOARDING_STEPS.WELCOME,
      ONBOARDING_STEPS.PERSONAL_INFO,
      ONBOARDING_STEPS.DOCUMENT_UPLOAD,
      ONBOARDING_STEPS.VEHICLE_INFO,
      ONBOARDING_STEPS.BACKGROUND_CHECK,
      ONBOARDING_STEPS.PAYOUT_SETUP,
      ONBOARDING_STEPS.AVAILABILITY,
      ONBOARDING_STEPS.REVIEW,
      ONBOARDING_STEPS.SUBMITTED
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepKey);

    if (stepIndex === -1) return 'locked';

    if (stepProgress[stepKey]) {
      return 'completed';
    } else if (stepKey === currentStep) {
      return 'current';
    } else if (stepIndex <= currentIndex + 1) {
      return 'accessible';
    } else {
      return 'locked';
    }
  }, [driverApplication, currentStep]);

  // Add missing isStepAccessible function
  const isStepAccessible = useCallback((stepKey) => {
    const status = getStepStatus(stepKey);
    return status === 'completed' || status === 'current' || status === 'accessible';
  }, [getStepStatus]);

  // Add missing goToStep function
  const goToStep = useCallback((stepKey) => {
    const stepOrder = [
      ONBOARDING_STEPS.WELCOME,
      ONBOARDING_STEPS.PERSONAL_INFO,
      ONBOARDING_STEPS.DOCUMENT_UPLOAD,
      ONBOARDING_STEPS.VEHICLE_INFO,
      ONBOARDING_STEPS.BACKGROUND_CHECK,
      ONBOARDING_STEPS.PAYOUT_SETUP,
      ONBOARDING_STEPS.AVAILABILITY,
      ONBOARDING_STEPS.REVIEW,
      ONBOARDING_STEPS.SUBMITTED
    ];

    const stepIndex = stepOrder.indexOf(stepKey);
    if (stepIndex !== -1 && isStepAccessible(stepKey)) {
      setCurrentStep(stepKey);
      if (driverApplication) {
        updateStep(stepKey, { currentStep: stepKey });
      }
    }
  }, [isStepAccessible, driverApplication, updateStep]);

  const value = {
    driverApplication,
    currentStep,
    saving,
    loading,
    updateStep,
    goToNextStep,
    goToPreviousStep,
    submitApplication,
    updateMobileAppStatus,
    startApplication,
    isApplicationStarted,
    getStepStatus,
    isStepAccessible,
    goToStep,
    ONBOARDING_STEPS
  };

  return (
    <DriverOnboardingContext.Provider value={value}>
      {children}
    </DriverOnboardingContext.Provider>
  );
}; 