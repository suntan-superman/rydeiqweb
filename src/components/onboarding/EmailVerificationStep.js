import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import OnboardingValidation from './OnboardingValidation';
import Button from '../common/Button';
import Input from '../common/Input';
import OnboardingProgress from './OnboardingProgress';
import toast from 'react-hot-toast';

const EmailVerificationStep = () => {
  const { 
    formData, 
    updateFormData, 
    nextStep, 
    previousStep, 
    submitOnboarding,
    validateAllRequiredSteps
  } = useOnboarding();

  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showEmailCorrection, setShowEmailCorrection] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Simulate sending verification email on component mount
  useEffect(() => {
    if (!verificationSent) {
      sendVerificationEmail();
    }
  }, [verificationSent]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const sendVerificationEmail = async () => {
    try {
      // Simulate sending verification email
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVerificationSent(true);
      toast.success('Verification email sent!');
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast.error('Failed to send verification email. Please try again.');
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      await sendVerificationEmail();
      setResendCooldown(60); // 60 second cooldown
      toast.success('Verification email resent!');
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate all required steps before proceeding
      const validation = validateAllRequiredSteps();
      if (!validation.allValid) {
        toast.error('Please complete all required information before proceeding');
        setIsSubmitting(false);
        return;
      }

      // Simulate verification code validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any 6-digit code
      if (verificationCode.length === 6) {
        updateFormData({ emailVerified: true });
        toast.success('Email verified successfully!');
        
        // Submit the complete onboarding
        const result = await submitOnboarding();
        if (result.success) {
          // Move to completion step
          nextStep();
        } else {
          toast.error(result.error || 'Failed to complete registration');
        }
      } else {
        toast.error('Please enter a valid 6-digit verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error('Failed to verify code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    previousStep();
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  const handleEmailCorrection = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter a new email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (newEmail === formData.personalInfo.email) {
      toast.error('This is the same email address');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      // Simulate email update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update form data with new email
      updateFormData({
        personalInfo: {
          ...formData.personalInfo,
          email: newEmail
        }
      });
      
      // Reset verification state
      setVerificationCode('');
      setVerificationSent(false);
      setShowEmailCorrection(false);
      setNewEmail('');
      
      // Send verification to new email
      await sendVerificationEmail();
      
      toast.success('Email updated! Verification code sent to new email address.');
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email. Please try again.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleShowEmailCorrection = () => {
    setNewEmail(formData.personalInfo.email);
    setShowEmailCorrection(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingProgress />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600">
              We've sent a verification code to your email address
            </p>
          </div>

          {/* Validation Check */}
          <OnboardingValidation />

          {/* Email Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Verification code sent to:</p>
              <p className="text-lg font-medium text-gray-900">{formData.personalInfo.email}</p>
              <button
                type="button"
                onClick={handleShowEmailCorrection}
                className="mt-2 text-sm text-blue-600 hover:text-blue-500 underline"
              >
                Wrong email? Click here to correct it
              </button>
            </div>
          </div>

          {/* Verification Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Verification Code *
            </label>
            <Input
              type="text"
              value={verificationCode}
              onChange={handleCodeChange}
              placeholder="123456"
              maxLength="6"
              className="text-center text-2xl tracking-widest"
            />
            <p className="text-sm text-gray-500 mt-2">
              Enter the 6-digit code from your email
            </p>
          </div>

          {/* Resend Email */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the email?
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              size="small"
            >
              {isResending ? (
                'Sending...'
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend Email'
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Check Your Email</h4>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Look for an email from AnyRyde</li>
                  <li>• Check your spam/junk folder if you don't see it</li>
                  <li>• The code expires in 10 minutes</li>
                  <li>• Contact support if you continue having issues</li>
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
              onClick={handleVerifyCode}
              loading={isSubmitting}
              disabled={!verificationCode || verificationCode.length !== 6 || isSubmitting}
            >
              Verify & Complete
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Email Correction Modal */}
        {showEmailCorrection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Correct Email Address</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Enter the correct email address to receive your verification code
                </p>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Email Address *
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter your correct email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isUpdatingEmail}
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Important</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Make sure to enter the correct email address. You'll receive a new verification code at this address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEmailCorrection(false);
                      setNewEmail('');
                    }}
                    disabled={isUpdatingEmail}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleEmailCorrection}
                    loading={isUpdatingEmail}
                    disabled={isUpdatingEmail}
                  >
                    Update Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationStep;
