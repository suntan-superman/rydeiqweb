import React, { useState } from 'react';
import { auth } from '../../services/firebase';
import { sendEmailVerification } from 'firebase/auth';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const EmailTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testEmailVerification = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing email verification...');
      console.log('Current user:', auth.currentUser);
      
      if (!auth.currentUser) {
        throw new Error('No user is currently signed in');
      }

      console.log('📧 Sending email verification to:', auth.currentUser.email);
      console.log('📧 User UID:', auth.currentUser.uid);
      console.log('📧 Email verified:', auth.currentUser.emailVerified);
      
      // Send email verification
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/email-verified`,
        handleCodeInApp: true
      });
      
      console.log('✅ Email verification sent successfully');
      setResult({
        success: true,
        message: 'Email verification sent successfully! Check your inbox and spam folder.',
        user: {
          email: auth.currentUser.email,
          uid: auth.currentUser.uid,
          emailVerified: auth.currentUser.emailVerified
        }
      });
      toast.success('Email verification sent!');
      
    } catch (error) {
      console.error('❌ Email verification failed:', error);
      setResult({
        success: false,
        message: error.message,
        error: {
          code: error.code,
          message: error.message
        }
      });
      toast.error(`Email verification failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Email Verification Test</h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Current User Status</h4>
          <div className="text-sm text-blue-800">
            {auth.currentUser ? (
              <div>
                <p><strong>Email:</strong> {auth.currentUser.email}</p>
                <p><strong>UID:</strong> {auth.currentUser.uid}</p>
                <p><strong>Email Verified:</strong> {auth.currentUser.emailVerified ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p>No user is currently signed in</p>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={testEmailVerification}
            loading={loading}
            disabled={loading || !auth.currentUser}
            size="large"
          >
            {loading ? 'Sending Email...' : 'Send Test Email Verification'}
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.success ? '✅ Success' : '❌ Failed'}
            </h4>
            <p className={`text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
            {result.error && (
              <div className="mt-2 text-xs text-red-600">
                <p><strong>Error Code:</strong> {result.error.code}</p>
                <p><strong>Error Message:</strong> {result.error.message}</p>
              </div>
            )}
            {result.user && (
              <div className="mt-2 text-xs text-green-600">
                <pre>{JSON.stringify(result.user, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Instructions</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>1. <strong>Make sure you're signed in</strong> (register first if needed)</p>
            <p>2. <strong>Click "Send Test Email Verification"</strong></p>
            <p>3. <strong>Check your inbox and spam folder</strong></p>
            <p>4. <strong>Look for sender:</strong> noreply@ryde-9d4bf.firebaseapp.com</p>
            <p>5. <strong>Check console logs</strong> for detailed information</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTest;
