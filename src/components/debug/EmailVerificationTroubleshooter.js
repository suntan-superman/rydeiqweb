import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resendEmailVerification, checkEmailVerification } from '../../services/authService';
import { auth } from '../../services/firebase';
import { getFirebaseConfig, getFirebaseConsoleUrl, getEmailVerificationTroubleshootingSteps } from '../../utils/firebaseConfig';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const EmailVerificationTroubleshooter = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [step, setStep] = useState(1);

  const firebaseConfig = getFirebaseConfig();
  const troubleshootingSteps = getEmailVerificationTroubleshootingSteps();

  useEffect(() => {
    // Auto-run basic checks when component mounts
    runBasicChecks();
  }, []);

  const runBasicChecks = () => {
    const results = {
      firebaseConfig: firebaseConfig,
      userStatus: user ? {
        email: user.email,
        verified: user.emailVerified,
        uid: user.uid
      } : null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        origin: window.location.origin,
        userAgent: navigator.userAgent
      }
    };
    setTestResults(results);
  };

  const testEmailVerification = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);
    try {
      console.log('🧪 Testing email verification...');
      console.log('User:', { email: user.email, uid: user.uid, verified: user.emailVerified });
      
      const result = await resendEmailVerification(user);
      
      if (result.success) {
        toast.success('✅ Email verification sent successfully!');
        console.log('✅ Email verification test passed');
      } else {
        toast.error(`❌ Email verification failed: ${result.error.message}`);
        console.error('❌ Email verification test failed:', result.error);
      }
      
      setTestResults(prev => ({
        ...prev,
        emailTest: {
          success: result.success,
          error: result.error,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      toast.error('❌ Email verification test failed');
      console.error('❌ Email verification test error:', error);
      setTestResults(prev => ({
        ...prev,
        emailTest: {
          success: false,
          error: { code: error.code, message: error.message },
          timestamp: new Date().toISOString()
        }
      }));
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
      
      setTestResults(prev => ({
        ...prev,
        verificationCheck: {
          success: result.success,
          emailVerified: result.emailVerified,
          error: result.error,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      toast.error('❌ Verification check failed');
      console.error('❌ Verification check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const getStatusColor = (isValid) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isValid) => {
    return isValid ? '✅' : '❌';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Email Verification Troubleshooter</h3>
      
      <div className="space-y-6">
        {/* Step 1: Firebase Configuration */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">
            Step 1: Firebase Configuration Check
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Configuration Valid:</span>
              <span className={getStatusColor(firebaseConfig.isValid)}>
                {getStatusIcon(firebaseConfig.isValid)} {firebaseConfig.isValid ? 'Yes' : 'No'}
              </span>
            </div>
            
            {!firebaseConfig.isValid && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 font-medium">Missing Configuration:</p>
                <ul className="mt-1 text-red-700">
                  {firebaseConfig.missing.map(key => (
                    <li key={key}>• {key}</li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-red-600">
                  <p>To fix: Create a .env file with your Firebase configuration</p>
                </div>
              </div>
            )}
            
            <div className="mt-3 text-xs text-gray-600">
              <p><strong>Project ID:</strong> {firebaseConfig.config.projectId || 'Not set'}</p>
              <p><strong>Auth Domain:</strong> {firebaseConfig.config.authDomain || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Step 2: User Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">
            Step 2: User Status Check
          </h4>
          
          {user ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Logged In:</span>
                <span className="text-green-600">✅ Yes</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="text-gray-600">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email Verified:</span>
                <span className={getStatusColor(user.emailVerified)}>
                  {getStatusIcon(user.emailVerified)} {user.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>User ID:</span>
                <span className="text-xs text-gray-500">{user.uid}</span>
              </div>
            </div>
          ) : (
            <div className="text-yellow-600">
              ⚠️ Please log in to test email verification
            </div>
          )}
        </div>

        {/* Step 3: Email Verification Test */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">
            Step 3: Email Verification Test
          </h4>
          
          <div className="space-y-3">
            <div className="flex space-x-3">
              <Button
                onClick={testEmailVerification}
                loading={loading}
                disabled={loading || !user}
                size="small"
              >
                Test Send Email
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
            </div>
            
            {testResults.emailTest && (
              <div className={`p-3 rounded text-sm ${
                testResults.emailTest.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <p><strong>Test Result:</strong> {testResults.emailTest.success ? 'Success' : 'Failed'}</p>
                {testResults.emailTest.error && (
                  <p><strong>Error:</strong> {testResults.emailTest.error.message}</p>
                )}
                <p><strong>Time:</strong> {new Date(testResults.emailTest.timestamp).toLocaleTimeString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Troubleshooting Steps */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">
            Step 4: Troubleshooting Steps
          </h4>
          
          <div className="text-sm text-blue-800 space-y-2">
            {troubleshootingSteps.map((step, index) => (
              <div key={index} className="flex items-start">
                <span className="mr-2 text-blue-600">{index + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          
          {firebaseConfig.config.projectId && (
            <div className="mt-4">
              <a
                href={getFirebaseConsoleUrl(firebaseConfig.config.projectId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🔗 Open Firebase Console
              </a>
            </div>
          )}
        </div>

        {/* Step 5: Environment Check */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-3">
            Step 5: Environment Check
          </h4>
          
          <div className="text-sm text-yellow-800 space-y-1">
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Origin:</strong> {window.location.origin}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationTroubleshooter;
