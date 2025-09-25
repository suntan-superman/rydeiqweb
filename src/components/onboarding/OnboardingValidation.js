import React from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

const OnboardingValidation = () => {
  const { formData, validateAllRequiredSteps } = useOnboarding();

  const validation = validateAllRequiredSteps();
  
  if (validation.allValid) {
    return null; // Don't show validation if everything is valid
  }

  // const getStepName = (step) => {
  //   const stepNames = {
  //     [ONBOARDING_STEPS.PERSONAL_INFO]: 'Personal Information',
  //     [ONBOARDING_STEPS.PROFILE_PICTURE]: 'Profile Picture',
  //     [ONBOARDING_STEPS.EMERGENCY_CONTACT]: 'Emergency Contact',
  //     [ONBOARDING_STEPS.PAYMENT_SETUP]: 'Payment Setup',
  //     [ONBOARDING_STEPS.TERMS]: 'Terms & Conditions'
  //   };
  //   return stepNames[step] || step;
  // };

  const getMissingRequirements = () => {
    const missing = [];
    
    // Check personal info
    if (!formData.personalInfo.firstName || !formData.personalInfo.lastName || 
        !formData.personalInfo.email || !formData.personalInfo.phone || 
        !formData.personalInfo.password) {
      missing.push('Complete personal information (name, email, phone, password)');
    }
    
    // Check profile picture
    if (!formData.profilePicture) {
      missing.push('Upload a profile picture (MANDATORY)');
    }
    
    // Check emergency contact
    if (!formData.emergencyContact.name || !formData.emergencyContact.phone || 
        !formData.emergencyContact.relationship) {
      missing.push('Complete emergency contact information');
    }
    
    // Check payment method
    if (!formData.paymentMethod.type || 
        (formData.paymentMethod.type === 'credit_card' && 
         (!formData.paymentMethod.cardNumber || !formData.paymentMethod.expiryDate || 
          !formData.paymentMethod.cvv || !formData.paymentMethod.cardholderName))) {
      missing.push('Set up a valid payment method (MANDATORY)');
    }
    
    // Check terms acceptance
    if (!formData.termsAccepted) {
      missing.push('Accept terms and conditions (MANDATORY)');
    }
    
    return missing;
  };

  const missingRequirements = getMissingRequirements();

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h4 className="text-sm font-medium text-red-800">Required Information Missing</h4>
          <p className="text-sm text-red-700 mt-1 mb-2">
            You must complete the following requirements before proceeding:
          </p>
          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
            {missingRequirements.map((requirement, index) => (
              <li key={index}>{requirement}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OnboardingValidation;
