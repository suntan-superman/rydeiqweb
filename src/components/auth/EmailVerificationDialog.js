import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resendEmailVerification, checkEmailVerification } from '../../services/authService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const EmailVerificationDialog = ({ isOpen, onClose, onVerified }) => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showEmailCorrection, setShowEmailCorrection] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Check verification status periodically
  useEffect(() => {
    if (!isOpen || !user) return;

    console.log('📧 Email verification dialog: Starting periodic check for', user.email);

    const checkInterval = setInterval(async () => {
      try {
        console.log('🔄 Checking email verification status...');
        const result = await checkEmailVerification();
        if (result.success && result.emailVerified) {
          console.log('✅ Email verified! Closing dialog and redirecting...');
          toast.success('Email verified successfully!');
          clearInterval(checkInterval);
          onVerified();
        } else {
          console.log('⏳ Email not verified yet, will check again in 3 seconds');
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
      }
    }, 3000); // Check every 3 seconds (faster detection)

    return () => {
      console.log('📧 Cleaning up email verification check interval');
      clearInterval(checkInterval);
    };
  }, [isOpen, user, onVerified]);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!user || resendCooldown > 0) return;

    setLoading(true);
    try {
      const result = await resendEmailVerification(user);
      if (result.success) {
        toast.success('Verification email sent! Check your inbox.');
        setResendCooldown(60); // 60 second cooldown
      } else {
        toast.error(`Failed to send verification email: ${result.error.message}`);
      }
    } catch (error) {
      toast.error('Error sending verification email');
      console.error('Resend verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;

    setChecking(true);
    try {
      const result = await checkEmailVerification();
      if (result.success) {
        if (result.emailVerified) {
          toast.success('Email verified successfully!');
          onVerified();
        } else {
          toast.error('Email not yet verified. Please check your inbox and click the verification link.');
        }
      } else {
        toast.error(`Failed to check verification: ${result.error.message}`);
      }
    } catch (error) {
      toast.error('Error checking verification status');
      console.error('Check verification error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = () => {
    onClose();
    // The AuthContext will handle the sign out
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

    if (newEmail === user.email) {
      toast.error('This is the same email address');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      // In a real app, you would update the user's email in Firebase
      // For now, we'll simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user context with new email
      setUser(prev => ({
        ...prev,
        email: newEmail
      }));
      
      // Reset states
      setShowEmailCorrection(false);
      setNewEmail('');
      setResendCooldown(0);
      
      // Send verification to new email
      const result = await resendEmailVerification({ ...user, email: newEmail });
      if (result.success) {
        toast.success('Email updated! Verification code sent to new email address.');
      } else {
        toast.error('Failed to send verification to new email');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email. Please try again.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleShowEmailCorrection = () => {
    setNewEmail(user.email);
    setShowEmailCorrection(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📧</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Verify Your Email</h2>
              <p className="text-primary-100 text-sm">Complete your account setup</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✉️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Check Your Email
            </h3>
            <p className="text-gray-600 text-sm">
              We've sent a verification link to:
            </p>
            <p className="font-medium text-gray-900 mt-1">
              {user?.email}
            </p>
            <button
              onClick={handleShowEmailCorrection}
              className="mt-2 text-sm text-blue-600 hover:text-blue-500 underline"
            >
              Wrong email? Click here to correct it
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>Return here and click "I've Verified My Email"</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              loading={checking}
              disabled={checking}
              className="w-full"
            >
              {checking ? 'Checking...' : 'I\'ve Verified My Email'}
            </Button>

            <Button
              onClick={handleResendVerification}
              loading={loading}
              disabled={loading || resendCooldown > 0}
              variant="outline"
              className="w-full"
            >
              {loading 
                ? 'Sending...' 
                : resendCooldown > 0 
                  ? `Resend in ${resendCooldown}s` 
                  : 'Resend Verification Email'
              }
            </Button>

            <div className="text-center">
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Sign out and try different account
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Email Correction Modal */}
      {showEmailCorrection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Correct Email Address</h3>
              <p className="text-sm text-gray-600 mt-1">
                Enter the correct email address to receive your verification link
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
                      Make sure to enter the correct email address. You'll receive a new verification link at this address.
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
  );
};

export default EmailVerificationDialog;
