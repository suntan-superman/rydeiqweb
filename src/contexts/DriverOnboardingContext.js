import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  getDriverApplication, 
  updateDriverStep, 
  completeOnboarding,
  createDriverApplication,
  submitDriverApplication,
  updateMobileAppStatus as updateMobileAppStatusService,
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

  // Load driver application on mount - only for users with driver userType
  useEffect(() => {
    const loadDriverApplication = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Only load driver application for users who are drivers
      if (user.userType !== 'driver' && user.activeUserType !== 'driver' && !user.userTypes?.includes('driver')) {
        setLoading(false);
        return;
      }

      // Only proceed if email is verified
      if (!user.emailVerified) {
        setLoading(false);
        return;
      }

      try {
        const result = await getDriverApplication(user.uid);
        if (result.success) {
          setDriverApplication(result.data);
          setCurrentStep(result.data.currentStep || ONBOARDING_STEPS.WELCOME);
        } else {
          // Only create new application if user is actually a driver AND email is verified
          if (user.userType === 'driver' || user.activeUserType === 'driver' || user.userTypes?.includes('driver')) {
            const createResult = await createDriverApplication(user.uid, {
              email: user.email,
              currentStep: ONBOARDING_STEPS.WELCOME
            });
            if (createResult.success) {
              setDriverApplication(createResult.data);
              setCurrentStep(ONBOARDING_STEPS.WELCOME);
            }
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
      console.log('updateStep called with:', { stepName, stepData: JSON.stringify(stepData, null, 2) });
      const result = await updateDriverStep(user.uid, stepName, stepData);
      
      if (result.success) {
        // The updateDriverStep function already handles setting the correct next step
        // So we should get the updated currentStep from the result or calculate it
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
        
        const currentIndex = stepOrder.indexOf(stepName);
        const nextStep = currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : stepName;
        
        setDriverApplication(prev => {
          const updated = {
            ...prev,
            [stepName]: stepData,  // Store step data under the step name
            currentStep: nextStep, // Set to next step, not current step
            updatedAt: new Date().toISOString()
          };
          console.log('Updated driver application:', { stepName, savedData: updated[stepName], nextStep });
          return updated;
        });
        setCurrentStep(nextStep);
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
      
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Update only the current step in the database (don't overwrite form data)
      if (driverApplication) {
        // Only update currentStep, don't overwrite existing form data
        setDriverApplication(prev => ({
          ...prev,
          currentStep: nextStep,
          updatedAt: new Date().toISOString()
        }));
        
        // Save currentStep to database without overwriting form data
        try {
          // Update the currentStep field directly in the database
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          const driverAppRef = doc(db, 'driverApplications', user.uid);
          await updateDoc(driverAppRef, {
            currentStep: nextStep,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error updating current step:', error);
        }
      }
    }
  }, [currentStep, driverApplication, user]);

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
      
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      const result = await updateMobileAppStatusService(user.uid, accountCreated);
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

    // Check if email is verified before creating driver application
    if (!user.emailVerified) {
      return { success: false, error: 'Email must be verified before starting driver application' };
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

  // Calculate progress percentage
  const progress = useCallback(() => {
    if (!driverApplication) return 0;
    
    const stepProgress = driverApplication.stepProgress || {};
    const totalSteps = 7; // Exclude WELCOME and SUBMITTED
    const completedSteps = Object.values(stepProgress).filter(Boolean).length;
    
    return Math.round((completedSteps / totalSteps) * 100);
  }, [driverApplication]);

  // Get application status
  const applicationStatus = useCallback(() => {
    if (!driverApplication) return null;
    return driverApplication.status || 'draft';
  }, [driverApplication]);

  // Add missing goToStep function
  const goToStep = useCallback(async (stepKey) => {
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
      
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      if (driverApplication) {
        // Only update currentStep, don't overwrite existing form data
        setDriverApplication(prev => ({
          ...prev,
          currentStep: stepKey,
          updatedAt: new Date().toISOString()
        }));
        
        // Save currentStep to database without overwriting form data
        try {
          // Update the currentStep field directly in the database
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          const driverAppRef = doc(db, 'driverApplications', user.uid);
          await updateDoc(driverAppRef, {
            currentStep: stepKey,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error updating current step:', error);
        }
      }
    }
  }, [isStepAccessible, driverApplication, user]);

  // Function to refresh driver application data from database
  const refreshDriverApplication = useCallback(async () => {
    if (!user) return;
    
    try {
      const result = await getDriverApplication(user.uid);
      if (result.success) {
        setDriverApplication(result.data);
        console.log('Driver application data refreshed:', result.data);
      }
    } catch (error) {
      console.error('Error refreshing driver application:', error);
    }
  }, [user]);

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
    refreshDriverApplication,
    ONBOARDING_STEPS,
    progress,
    applicationStatus
  };

  return (
    <DriverOnboardingContext.Provider value={value}>
      {children}
    </DriverOnboardingContext.Provider>
  );
}; 