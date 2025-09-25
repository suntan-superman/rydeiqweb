import React, { useState } from 'react';
import { useOnboarding, ONBOARDING_STEPS } from '../../contexts/OnboardingContext';
import { getTermsForUserType } from '../../services/termsService';
import Button from '../common/Button';
import OnboardingProgress from './OnboardingProgress';
import toast from 'react-hot-toast';

const TermsStep = () => {
  const { 
    formData, 
    updateFormData, 
    nextStep, 
    previousStep, 
    validateStep,
    errors
  } = useOnboarding();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(formData.termsAccepted || false);
  
  // Get the appropriate terms based on user type
  const termsContent = getTermsForUserType(formData.userType);
  // const termsTitle = getTermsTitleForUserType(formData.userType);

  const handleTermsChange = (e) => {
    const accepted = e.target.checked;
    setTermsAccepted(accepted);
    updateFormData({ termsAccepted: accepted });
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      // Validate the step
      const isValid = validateStep(ONBOARDING_STEPS.TERMS);
      
      if (!isValid) {
        toast.error('You must accept the terms and conditions to continue');
        return;
      }

      toast.success('Terms accepted successfully!');
      nextStep();
    } catch (error) {
      console.error('Error accepting terms:', error);
      toast.error('Failed to process terms acceptance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    previousStep();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingProgress />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Terms & Conditions
            </h1>
            <p className="text-gray-600">
              Please review and accept our terms of service for {formData.userType === 'driver' ? 'drivers' : 'riders'}
            </p>
          </div>

          {/* Terms Content */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-6 mb-6">
            <div className="prose prose-sm max-w-none">
              <div 
                className="text-gray-700 whitespace-pre-line"
                dangerouslySetInnerHTML={{ 
                  __html: termsContent.replace(/\n/g, '<br>').replace(/# /g, '<h3 class="text-lg font-semibold text-gray-900 mb-2 mt-4">').replace(/## /g, '<h4 class="text-md font-semibold text-gray-900 mb-2 mt-3">').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }}
              />
            </div>
          </div>

          {/* Acceptance Checkbox */}
          <div className="mb-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={handleTermsChange}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="text-sm text-gray-700">
                <span className="font-medium">I agree to the Terms of Service and Privacy Policy</span>
                <p className="text-gray-500 mt-1">
                  I have read and understand the terms and conditions above. I agree to be bound by these terms when using AnyRyde services.
                </p>
              </div>
            </label>
            {errors.termsAccepted && (
              <p className="text-red-600 text-sm mt-2">
                {errors.termsAccepted}
              </p>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Important Information</h4>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• You can update your preferences in your account settings</li>
                  <li>• We may send you important service updates via email</li>
                  <li>• Your data is protected with industry-standard encryption</li>
                  <li>• You can contact us anytime with questions or concerns</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            
            <Button
              type="button"
              variant="primary"
              onClick={handleContinue}
              loading={isSubmitting}
              disabled={!termsAccepted || isSubmitting}
            >
              Accept & Continue
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsStep;
