import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resendEmailVerification, checkEmailVerification } from '../../services/authService';
import { auth } from '../../services/firebase';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const EmailVerificationDebugger = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [emailTestResult, setEmailTestResult] = useState(null);

  useEffect(() => {
    // Run initial diagnostics
    runDiagnostics();
  }, [user]);

  const runDiagnostics = () => {
    const info = {
      timestamp: new Date().toISOString(),
      user: user ? {
        email: user.email,
        uid: user.uid,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        creationTime: user.metadata?.creationTime,
        lastSignInTime: user.metadata?.lastSignInTime
      } : null,
      firebase: {
        currentUser: auth.currentUser ? {
          email: auth.currentUser.email,
          uid: auth.currentUser.uid,
          emailVerified: auth.currentUser.emailVerified
        } : null,
        app: auth.app ? {
          name: auth.app.name,
          options: auth.app.options
        } : null
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        origin: window.location.origin,
        userAgent: navigator.userAgent.substring(0, 100)
      },
      config: {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'Set' : 'Not set',
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'Not set',
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'Not set',
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'Not set',
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'Not set',
        appId: process.env.REACT_APP_FIREBASE_APP_ID || 'Not set'
      }
    };
    
    setDebugInfo(info);
    console.log('🔍 Email Verification Diagnostics:', info);
  };

  const testEmailVerification = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);
    setEmailTestResult(null);
    
    try {
      console.log('🧪 Testing email verification for:', user.email);
      
      // Test 1: Check if user is properly authenticated
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Test 2: Check if user email matches
      if (auth.currentUser.email !== user.email) {
        throw new Error('User email mismatch between auth and context');
      }
      
      // Test 3: Attempt to send verification email
      console.log('📧 Sending verification email...');
      const result = await resendEmailVerification(user);
      
      if (result.success) {
        console.log('✅ Email verification sent successfully');
        setEmailTestResult({
          success: true,
          message: 'Email verification sent successfully',
          timestamp: new Date().toISOString()
        });
        toast.success('✅ Email verification sent! Check your inbox.');
      } else {
        console.error('❌ Email verification failed:', result.error);
        setEmailTestResult({
          success: false,
          message: result.error.message,
          error: result.error,
          timestamp: new Date().toISOString()
        });
        toast.error(`❌ Failed to send email: ${result.error.message}`);
      }
    } catch (error) {
      console.error('❌ Email verification test error:', error);
      setEmailTestResult({
        success: false,
        message: error.message,
        error: { code: error.code, message: error.message },
        timestamp: new Date().toISOString()
      });
      toast.error(`❌ Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setChecking(true);
    try {
      const result = await checkEmailVerification();
      
      if (result.success) {
        if (result.emailVerified) {
          toast.success('✅ Email is verified!');
        } else {
          toast.error('❌ Email not yet verified');
        }
      } else {
        toast.error(`❌ Check failed: ${result.error.message}`);
      }
    } catch (error) {
      toast.error('❌ Verification check failed');
      console.error('❌ Verification check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const getConfigStatus = () => {
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missing = required.filter(key => debugInfo.config?.[key] === 'Not set');
    return {
      isValid: missing.length === 0,
      missing
    };
  };

  const configStatus = getConfigStatus();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Email Verification Debugger</h3>
      
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={testEmailVerification}
            loading={loading}
            disabled={loading || !user}
            size="small"
          >
            {loading ? 'Testing...' : 'Test Send Email'}
          </Button>
          
          <Button
            onClick={checkVerificationStatus}
            loading={checking}
            disabled={checking || !user}
            variant="outline"
            size="small"
          >
            Check Status
          </Button>
          
          <Button
            onClick={runDiagnostics}
            variant="outline"
            size="small"
          >
            Refresh Diagnostics
          </Button>
        </div>

        {/* Configuration Status */}
        <div className={`p-4 rounded-lg ${
          configStatus.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h4 className={`font-medium mb-2 ${
            configStatus.isValid ? 'text-green-900' : 'text-red-900'
          }`}>
            Firebase Configuration: {configStatus.isValid ? '✅ Valid' : '❌ Invalid'}
          </h4>
          
          {!configStatus.isValid && (
            <div className="text-sm text-red-700">
              <p className="mb-1">Missing configuration:</p>
              <ul className="list-disc list-inside">
                {configStatus.missing.map(key => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Email Test Result */}
        {emailTestResult && (
          <div className={`p-4 rounded-lg ${
            emailTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              emailTestResult.success ? 'text-green-900' : 'text-red-900'
            }`}>
              Email Test Result: {emailTestResult.success ? '✅ Success' : '❌ Failed'}
            </h4>
            <p className={`text-sm ${
              emailTestResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {emailTestResult.message}
            </p>
            {emailTestResult.error && (
              <div className="mt-2 text-xs text-red-600">
                <p><strong>Error Code:</strong> {emailTestResult.error.code}</p>
                <p><strong>Error Message:</strong> {emailTestResult.error.message}</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Tested at: {new Date(emailTestResult.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        {/* Debug Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Debug Information</h4>
          
          <div className="space-y-4 text-sm">
            {/* User Info */}
            <div>
              <h5 className="font-medium text-gray-700 mb-1">User Status</h5>
              <div className="bg-white p-3 rounded border text-xs">
                <pre>{JSON.stringify(debugInfo.user, null, 2)}</pre>
              </div>
            </div>

            {/* Firebase Info */}
            <div>
              <h5 className="font-medium text-gray-700 mb-1">Firebase Auth</h5>
              <div className="bg-white p-3 rounded border text-xs">
                <pre>{JSON.stringify(debugInfo.firebase, null, 2)}</pre>
              </div>
            </div>

            {/* Configuration */}
            <div>
              <h5 className="font-medium text-gray-700 mb-1">Configuration</h5>
              <div className="bg-white p-3 rounded border text-xs">
                <pre>{JSON.stringify(debugInfo.config, null, 2)}</pre>
              </div>
            </div>

            {/* Environment */}
            <div>
              <h5 className="font-medium text-gray-700 mb-1">Environment</h5>
              <div className="bg-white p-3 rounded border text-xs">
                <pre>{JSON.stringify(debugInfo.environment, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Common Issues & Solutions</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>• <strong>No email received:</strong> Check spam folder, wait 5-10 minutes</p>
            <p>• <strong>Rate limiting:</strong> Wait 60 seconds between attempts</p>
            <p>• <strong>Firebase project issues:</strong> Check Firebase Console > Authentication</p>
            <p>• <strong>Email template disabled:</strong> Enable in Firebase Console > Templates</p>
            <p>• <strong>Domain not authorized:</strong> Add your domain to authorized domains</p>
            <p>• <strong>Billing disabled:</strong> Enable billing for your Firebase project</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationDebugger;
