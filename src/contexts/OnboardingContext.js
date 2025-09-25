import React, { createContext, useContext, useState, useCallback } from 'react';
import { updateUserProfile } from '../services/authService';
import { checkRiderOnboardingStatus } from '../services/riderOnboardingService';
import toast from 'react-hot-toast';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

// Simplified onboarding steps
export const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  PROFILE_PICTURE: 'profile_picture',
  PAYMENT_SETUP: 'payment_setup',
  COMPLETE: 'complete'
};

// Simplified step order for navigation
export const STEP_ORDER = [
  ONBOARDING_STEPS.WELCOME,
  ONBOARDING_STEPS.PROFILE_PICTURE,
  ONBOARDING_STEPS.PAYMENT_SETUP,
  ONBOARDING_STEPS.COMPLETE
];

export const OnboardingProvider = ({ children }) => {
  // No auth dependencies needed for onboarding context
  
  // Onboarding state
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.WELCOME);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    userType: 'rider',
    profilePicture: null,
    paymentMethod: {
      type: 'credit_card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    },
    onboardingComplete: false
  });
  const [errors, setErrors] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Get current step index
  const getCurrentStepIndex = useCallback(() => {
    return STEP_ORDER.indexOf(currentStep);
  }, [currentStep]);

  // Get total steps
  const getTotalSteps = useCallback(() => {
    return STEP_ORDER.length;
  }, []);

  // Get progress percentage
  const getProgressPercentage = useCallback(() => {
    return ((getCurrentStepIndex() + 1) / getTotalSteps()) * 100;
  }, [getCurrentStepIndex, getTotalSteps]);

  // Navigation functions
  const nextStep = useCallback(() => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStepName = STEP_ORDER[currentIndex + 1];
      setCurrentStep(nextStepName);
    }
  }, [getCurrentStepIndex]);

  const previousStep = useCallback(() => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [getCurrentStepIndex]);

  const goToStep = useCallback((step) => {
    if (STEP_ORDER.includes(step)) {
      setCurrentStep(step);
    }
  }, []);

  // Form data management
  const updateFormData = useCallback((newData) => {
    setFormData(prev => ({
      ...prev,
      ...newData
    }));
  }, []);

  const updatePersonalInfo = useCallback((personalInfo) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        ...personalInfo
      }
    }));
  }, []);

  const updateEmergencyContact = useCallback((emergencyContact) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        ...emergencyContact
      }
    }));
  }, []);

  const updatePaymentMethod = useCallback((paymentMethod) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        ...paymentMethod
      }
    }));
  }, []);

  // Validation functions
  const validateStep = useCallback((step) => {
    const newErrors = {};

    switch (step) {
      case ONBOARDING_STEPS.PERSONAL_INFO:
        if (!formData.personalInfo.firstName.trim()) {
          newErrors.firstName = 'First name is required';
        }
        if (!formData.personalInfo.lastName.trim()) {
          newErrors.lastName = 'Last name is required';
        }
        if (!formData.personalInfo.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.personalInfo.email)) {
          newErrors.email = 'Email is invalid';
        }
        if (!formData.personalInfo.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        }
        if (!formData.personalInfo.password) {
          newErrors.password = 'Password is required';
        } else if (formData.personalInfo.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        if (formData.personalInfo.password !== formData.personalInfo.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      case ONBOARDING_STEPS.PROFILE_PICTURE:
        if (!formData.profilePicture) {
          newErrors.profilePicture = 'Profile picture is MANDATORY and cannot be skipped';
        }
        break;

      case ONBOARDING_STEPS.EMERGENCY_CONTACT:
        if (!formData.emergencyContact.name.trim()) {
          newErrors.emergencyContactName = 'Emergency contact name is required';
        }
        if (!formData.emergencyContact.phone.trim()) {
          newErrors.emergencyContactPhone = 'Emergency contact phone is required';
        }
        if (!formData.emergencyContact.relationship.trim()) {
          newErrors.emergencyContactRelationship = 'Relationship is required';
        }
        break;

      case ONBOARDING_STEPS.PAYMENT_SETUP:
        if (!formData.paymentMethod.type) {
          newErrors.paymentType = 'Payment method type is required';
        }
        if (formData.paymentMethod.type === 'credit_card' || formData.paymentMethod.type === 'debit_card') {
          if (!formData.paymentMethod.cardNumber.trim()) {
            newErrors.cardNumber = 'Card number is required';
          } else if (!/^[0-9\s]{13,19}$/.test(formData.paymentMethod.cardNumber.replace(/\s/g, ''))) {
            newErrors.cardNumber = 'Please enter a valid card number';
          }
          if (!formData.paymentMethod.expiryDate.trim()) {
            newErrors.expiryDate = 'Expiry date is required';
          } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.paymentMethod.expiryDate)) {
            newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
          }
          if (!formData.paymentMethod.cvv.trim()) {
            newErrors.cvv = 'CVV is required';
          } else if (!/^[0-9]{3,4}$/.test(formData.paymentMethod.cvv)) {
            newErrors.cvv = 'Please enter a valid CVV';
          }
          if (!formData.paymentMethod.cardholderName.trim()) {
            newErrors.cardholderName = 'Cardholder name is required';
          }
        }
        break;

      case ONBOARDING_STEPS.TERMS:
        if (!formData.termsAccepted) {
          newErrors.termsAccepted = 'You MUST accept the terms and conditions to continue';
        }
        break;
      
      default:
        // No validation needed for other steps
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Comprehensive validation for all required steps
  const validateAllRequiredSteps = useCallback(() => {
    const requiredSteps = [
      ONBOARDING_STEPS.PERSONAL_INFO,
      ONBOARDING_STEPS.PROFILE_PICTURE,
      ONBOARDING_STEPS.EMERGENCY_CONTACT,
      ONBOARDING_STEPS.PAYMENT_SETUP,
      ONBOARDING_STEPS.TERMS
    ];

    const validationResults = requiredSteps.map(step => ({
      step,
      isValid: validateStep(step)
    }));

    const allValid = validationResults.every(result => result.isValid);
    const failedSteps = validationResults.filter(result => !result.isValid);

    return {
      allValid,
      failedSteps: failedSteps.map(result => result.step),
      validationResults
    };
  }, [validateStep]);

  // Submit onboarding
  const submitOnboarding = useCallback(async () => {
    setIsLoading(true);
    try {
      // Validate all steps (excluding COMPLETE)
      const stepsToValidate = STEP_ORDER.slice(0, -1);
      const allStepsValid = stepsToValidate.every(step => validateStep(step));
      
      if (!allStepsValid) {
        toast.error('Please complete all required fields');
        return { success: false, error: 'Validation failed' };
      }

      // Update user profile with onboarding data
      const updateData = {};
      
      if (formData.profilePicture) {
        updateData.profilePicture = formData.profilePicture;
        updateData.photoURL = formData.profilePicture;
      }

      if (formData.paymentMethod && formData.paymentMethod.cardNumber) {
        // Store complete payment method data to match mobile app structure exactly
        updateData.paymentMethod = {
          type: formData.paymentMethod.type,
          cardNumber: formData.paymentMethod.cardNumber,
          expiryDate: formData.paymentMethod.expiryDate,
          cvv: formData.paymentMethod.cvv,
          name: formData.paymentMethod.cardholderName, // Note: mobile app uses 'name', not 'cardholderName'
          // Also store the simplified version for display purposes
          last4: formData.paymentMethod.cardNumber.slice(-4),
          brand: formData.paymentMethod.type === 'credit_card' ? 'card' : formData.paymentMethod.type
        };
      }

      updateData.onboardingComplete = true;

      await updateUserProfile(updateData);

      toast.success('Profile updated successfully!');
      return { success: true };

    } catch (error) {
      console.error('Onboarding submission error:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateStep]);

  // Check onboarding status
  const checkOnboardingStatus = useCallback(async (userId) => {
    try {
      const result = await checkRiderOnboardingStatus(userId);
      return result;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Reset onboarding
  const resetOnboarding = useCallback(() => {
    setCurrentStep(ONBOARDING_STEPS.WELCOME);
    setFormData({
      userType: 'rider',
      profilePicture: null,
      paymentMethod: {
        type: 'credit_card',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      },
      onboardingComplete: false
    });
    setErrors({});
  }, []);

  // Set mobile mode
  const setMobileMode = useCallback((mobile) => {
    setIsMobile(mobile);
  }, []);

  const value = {
    // State
    currentStep,
    isLoading,
    formData,
    errors,
    isMobile,
    
    // Computed values
    currentStepIndex: getCurrentStepIndex(),
    totalSteps: getTotalSteps(),
    progressPercentage: getProgressPercentage(),
    
    // Navigation
    nextStep,
    previousStep,
    goToStep,
    
    // Form management
    updateFormData,
    updatePersonalInfo,
    updateEmergencyContact,
    updatePaymentMethod,
    
    // Validation
    validateStep,
    validateAllRequiredSteps,
    
    // Actions
    submitOnboarding,
    checkOnboardingStatus,
    resetOnboarding,
    setMobileMode,
    
    // Constants
    ONBOARDING_STEPS,
    STEP_ORDER
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
