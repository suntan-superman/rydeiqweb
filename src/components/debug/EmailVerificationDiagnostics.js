import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resendEmailVerification, checkEmailVerification } from '../../services/authService';
import { auth } from '../../services/firebase';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const EmailVerificationDiagnostics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [diagnostics, setDiagnostics] = useState({});
  const [firebaseConfig, setFirebaseConfig] = useState({});

  useEffect(() => {
    // Get Firebase configuration
    const config = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };
    setFirebaseConfig(config);
  }, []);

  const runDiagnostics = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);
    const results = {};

    try {
      // Check user status
      results.userStatus = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        creationTime: user.metadata?.creationTime,
        lastSignInTime: user.metadata?.lastSignInTime
      };

      // Check Firebase Auth current user
      const currentUser = auth.currentUser;
      results.firebaseAuthUser = {
        exists: !!currentUser,
        uid: currentUser?.uid,
        email: currentUser?.email,
        emailVerified: currentUser?.emailVerified,
        providerData: currentUser?.providerData
      };

      // Test email verification
      try {
        const resendResult = await resendEmailVerification(user);
        results.emailVerificationTest = {
          success: resendResult.success,
          error: resendResult.error
        };
      } catch (error) {
        results.emailVerificationTest = {
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        };
      }

      // Check verification status
      try {
        const checkResult = await checkEmailVerification();
        results.verificationCheck = {
          success: checkResult.success,
          emailVerified: checkResult.emailVerified,
          error: checkResult.error
        };
      } catch (error) {
        results.verificationCheck = {
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        };
      }

      // Check environment variables
      results.environment = {
        nodeEnv: process.env.NODE_ENV,
        hasApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
        hasAuthDomain: !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        hasProjectId: !!process.env.REACT_APP_FIREBASE_PROJECT_ID,
        origin: window.location.origin
      };

      setDiagnostics(results);
      toast.success('Diagnostics completed');
    } catch (error) {
      console.error('Diagnostics error:', error);
      toast.error('Error running diagnostics');
    } finally {
      setLoading(false);
    }
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
      console.error('Resend error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!user) {
      toast.error('Please log in first');
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
        toast.error(`Check failed: ${result.error.message}`);
      }
    } catch (error) {
      toast.error('Error checking verification status');
      console.error('Check error:', error);
    } finally {
      setChecking(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please log in to run email verification diagnostics</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Verification Diagnostics</h3>
      
      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={runDiagnostics}
            loading={loading}
            disabled={loading}
          >
            Run Full Diagnostics
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
            loading={checking}
            disabled={checking}
            variant="outline"
          >
            Check Verification Status
          </Button>
        </div>

        {/* Firebase Configuration */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Firebase Configuration</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Auth Domain: {firebaseConfig.authDomain || 'Not set'}</p>
            <p>Project ID: {firebaseConfig.projectId || 'Not set'}</p>
            <p>API Key: {firebaseConfig.apiKey ? 'Set' : 'Not set'}</p>
            <p>Origin: {firebaseConfig.origin || window.location.origin}</p>
          </div>
        </div>

        {/* Diagnostics Results */}
        {Object.keys(diagnostics).length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Diagnostics Results</h4>
            
            {diagnostics.userStatus && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">User Status</h5>
                <pre className="text-xs text-blue-800 overflow-auto">
                  {JSON.stringify(diagnostics.userStatus, null, 2)}
                </pre>
              </div>
            )}

            {diagnostics.firebaseAuthUser && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Firebase Auth User</h5>
                <pre className="text-xs text-green-800 overflow-auto">
                  {JSON.stringify(diagnostics.firebaseAuthUser, null, 2)}
                </pre>
              </div>
            )}

            {diagnostics.emailVerificationTest && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h5 className="font-medium text-yellow-900 mb-2">Email Verification Test</h5>
                <pre className="text-xs text-yellow-800 overflow-auto">
                  {JSON.stringify(diagnostics.emailVerificationTest, null, 2)}
                </pre>
              </div>
            )}

            {diagnostics.verificationCheck && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="font-medium text-purple-900 mb-2">Verification Check</h5>
                <pre className="text-xs text-purple-800 overflow-auto">
                  {JSON.stringify(diagnostics.verificationCheck, null, 2)}
                </pre>
              </div>
            )}

            {diagnostics.environment && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Environment</h5>
                <pre className="text-xs text-gray-800 overflow-auto">
                  {JSON.stringify(diagnostics.environment, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Troubleshooting Tips */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">Common Issues & Solutions</h4>
          <ul className="text-sm text-red-800 space-y-1">
            <li>• <strong>No email received:</strong> Check spam folder, wait 5-10 minutes</li>
            <li>• <strong>Firebase config missing:</strong> Check .env file has all Firebase variables</li>
            <li>• <strong>Auth domain mismatch:</strong> Ensure REACT_APP_FIREBASE_AUTH_DOMAIN is correct</li>
            <li>• <strong>Rate limiting:</strong> Wait 60 seconds between resend attempts</li>
            <li>• <strong>Firebase console:</strong> Check Authentication > Templates > Email verification</li>
            <li>• <strong>Browser console:</strong> Look for error messages in Network tab</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationDiagnostics;
