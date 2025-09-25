import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resendEmailVerification, checkEmailVerification } from '../../services/authService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const EmailVerificationDebug = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleResendVerification = async () => {
    if (!user) {
      toast.error('No user logged in');
      return;
    }

    setLoading(true);
    try {
      const result = await resendEmailVerification(user);
      if (result.success) {
        toast.success('Verification email sent! Check your inbox.');
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
    if (!user) {
      toast.error('No user logged in');
      return;
    }

    setChecking(true);
    try {
      const result = await checkEmailVerification();
      if (result.success) {
        if (result.emailVerified) {
          toast.success('Email is verified!');
        } else {
          toast.error('Email not yet verified');
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

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please log in to test email verification</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Verification Debug</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">User Info</h4>
          <p className="text-sm text-gray-600">Email: {user.email}</p>
          <p className="text-sm text-gray-600">Verified: {user.emailVerified ? 'Yes' : 'No'}</p>
          <p className="text-sm text-gray-600">UID: {user.uid}</p>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleResendVerification}
            loading={loading}
            disabled={loading}
          >
            Resend Verification Email
          </Button>
          
          <Button
            onClick={handleCheckVerification}
            loading={checking}
            disabled={checking}
            variant="outline"
          >
            Check Verification Status
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Debugging Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Check your spam/junk folder</li>
            <li>• Make sure Firebase email settings are configured</li>
            <li>• Check browser console for error messages</li>
            <li>• Verify Firebase project email settings in console</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationDebug;
