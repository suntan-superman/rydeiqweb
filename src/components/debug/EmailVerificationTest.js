import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resendEmailVerification, checkEmailVerification } from '../../services/authService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const EmailVerificationTest = () => {
  const { user, setShowEmailVerificationDialog } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleTestEmailVerification = () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    if (user.emailVerified) {
      toast.success('Email is already verified!');
      return;
    }

    // Simulate the email verification flow
    setShowEmailVerificationDialog(true);
    toast.info('Email verification dialog opened');
  };

  const handleResendEmail = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const result = await resendEmailVerification(user);
      if (result.success) {
        toast.success('Verification email sent!');
      } else {
        toast.error(`Failed to send email: ${result.error.message}`);
      }
    } catch (error) {
      toast.error('Error sending verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    try {
      const result = await checkEmailVerification();
      if (result.success) {
        if (result.emailVerified) {
          toast.success('Email is verified!');
        } else {
          toast.error('Email not yet verified');
        }
      } else {
        toast.error(`Check failed: ${result.error.message}`);
      }
    } catch (error) {
      toast.error('Error checking verification status');
    }
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please log in to test email verification</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Verification Test</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
          <p className="text-sm text-gray-600">Email: {user.email}</p>
          <p className="text-sm text-gray-600">Verified: {user.emailVerified ? 'Yes' : 'No'}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleTestEmailVerification}
            disabled={user.emailVerified}
          >
            {user.emailVerified ? 'Email Already Verified' : 'Test Email Verification Dialog'}
          </Button>
          
          <Button
            onClick={handleResendEmail}
            loading={loading}
            disabled={loading}
            variant="outline"
          >
            Resend Verification Email
          </Button>
          
          <Button
            onClick={handleCheckStatus}
            variant="outline"
          >
            Check Verification Status
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Testing Instructions</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Click "Test Email Verification Dialog" to see the dialog</li>
            <li>Use "Resend Verification Email" to send a new email</li>
            <li>Check your email and click the verification link</li>
            <li>Use "Check Verification Status" to verify the status updated</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationTest;
