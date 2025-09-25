import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const EmailVerificationTestSuite = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [currentTest, setCurrentTest] = useState('');

  const runTest = async (testName, testFunction) => {
    setCurrentTest(testName);
    setLoading(true);
    
    try {
      console.log(`🧪 Running test: ${testName}`);
      const result = await testFunction();
      setTestResults(prev => [...prev, {
        test: testName,
        success: true,
        result,
        timestamp: new Date().toISOString()
      }]);
      console.log(`✅ Test ${testName} passed:`, result);
    } catch (error) {
      console.error(`❌ Test ${testName} failed:`, error);
      setTestResults(prev => [...prev, {
        test: testName,
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
      setCurrentTest('');
    }
  };

  const test1_FirebaseConfig = async () => {
    const config = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };
    
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing configuration: ${missing.join(', ')}`);
    }
    
    return { config, isValid: true };
  };

  const test2_UserAuthentication = async () => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    if (!auth.currentUser) {
      throw new Error('No Firebase auth current user');
    }
    
    if (user.uid !== auth.currentUser.uid) {
      throw new Error('User ID mismatch between context and auth');
    }
    
    return {
      contextUser: { uid: user.uid, email: user.email, verified: user.emailVerified },
      authUser: { uid: auth.currentUser.uid, email: auth.currentUser.email, verified: auth.currentUser.emailVerified }
    };
  };

  const test3_DirectEmailVerification = async () => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }
    
    await sendEmailVerification(auth.currentUser, {
      url: `${window.location.origin}/login?verified=true`,
      handleCodeInApp: true
    });
    
    return { message: 'Email verification sent successfully' };
  };

  const test4_EmailVerificationWithActionCodeSettings = async () => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }
    
    // Import ActionCodeSettings dynamically
    const { ActionCodeSettings } = await import('firebase/auth');
    
    const actionCodeSettings = {
      url: `${window.location.origin}/login?verified=true`,
      handleCodeInApp: true,
    };
    
    await sendEmailVerification(auth.currentUser, actionCodeSettings);
    
    return { message: 'Email verification sent with ActionCodeSettings' };
  };

  const test5_CheckEmailVerificationStatus = async () => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }
    
    // Reload the user to get the latest verification status
    await auth.currentUser.reload();
    
    return {
      emailVerified: auth.currentUser.emailVerified,
      lastReloadTime: new Date().toISOString()
    };
  };

  const runAllTests = async () => {
    setTestResults([]);
    
    const tests = [
      { name: 'Firebase Configuration', fn: test1_FirebaseConfig },
      { name: 'User Authentication', fn: test2_UserAuthentication },
      { name: 'Direct Email Verification', fn: test3_DirectEmailVerification },
      { name: 'Email with ActionCodeSettings', fn: test4_EmailVerificationWithActionCodeSettings },
      { name: 'Check Verification Status', fn: test5_CheckEmailVerificationStatus }
    ];
    
    for (const test of tests) {
      await runTest(test.name, test.fn);
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please log in to run email verification tests</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 Email Verification Test Suite</h3>
      
      <div className="space-y-4">
        {/* Test Controls */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={runAllTests}
            loading={loading}
            disabled={loading}
            size="small"
          >
            {loading ? `Running ${currentTest}...` : 'Run All Tests'}
          </Button>
          
          <Button
            onClick={clearResults}
            variant="outline"
            size="small"
            disabled={loading}
          >
            Clear Results
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Test Results</h4>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`font-medium ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.success ? '✅' : '❌'} {result.test}
                  </h5>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {result.success ? (
                  <div className="text-sm text-green-700">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-sm text-red-700">
                    <p><strong>Error:</strong> {result.error}</p>
                    {result.code && <p><strong>Code:</strong> {result.code}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* User Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current User</h4>
          <div className="text-sm text-gray-600">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Test Instructions</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>1. <strong>Run All Tests</strong> - This will test each component step by step</p>
            <p>2. <strong>Check Results</strong> - Look for any failed tests</p>
            <p>3. <strong>Check Email</strong> - Look in your inbox and spam folder</p>
            <p>4. <strong>Check Console</strong> - Look for detailed error messages</p>
            <p>5. <strong>Firebase Console</strong> - Check Authentication > Templates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationTestSuite;
