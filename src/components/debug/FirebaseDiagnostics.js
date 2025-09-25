import React, { useState } from 'react';
import { auth } from '../../services/firebase';
import { sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const FirebaseDiagnostics = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (type, message, data = null) => {
    setResults(prev => [...prev, { type, message, data, timestamp: new Date().toISOString() }]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);

    try {
      addResult('info', '🔍 Starting Firebase Email Diagnostics...');

      // 1. Check Firebase Configuration
      addResult('info', '📋 Checking Firebase Configuration...');
      const config = {
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'Set' : 'Not Set',
        appId: process.env.REACT_APP_FIREBASE_APP_ID ? 'Set' : 'Not Set',
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Not Set',
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? 'Set' : 'Not Set'
      };
      addResult('success', '✅ Firebase Configuration', config);

      // 2. Check Auth State
      addResult('info', '🔐 Checking Authentication State...');
      const currentUser = auth.currentUser;
      if (currentUser) {
        addResult('success', '✅ User is authenticated', {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
          providerId: currentUser.providerId
        });
      } else {
        addResult('warning', '⚠️ No user is currently authenticated');
      }

      // 3. Test Email Verification with Current User
      if (currentUser) {
        addResult('info', '📧 Testing email verification with current user...');
        try {
          await sendEmailVerification(currentUser, {
            url: `${window.location.origin}/email-verified`,
            handleCodeInApp: true
          });
          addResult('success', '✅ Email verification sent successfully to current user');
        } catch (error) {
          addResult('error', '❌ Failed to send email verification', {
            code: error.code,
            message: error.message
          });
        }
      }

      // 4. Test with a fresh user
      addResult('info', '👤 Testing with fresh user...');
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      try {
        // Create a test user
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        const testUser = userCredential.user;
        
        addResult('success', '✅ Test user created successfully', {
          uid: testUser.uid,
          email: testUser.email
        });

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Send verification email
        await sendEmailVerification(testUser, {
          url: `${window.location.origin}/email-verified`,
          handleCodeInApp: true
        });
        
        addResult('success', '✅ Email verification sent to test user');
        
        // Clean up - delete the test user
        try {
          await testUser.delete();
          addResult('info', '🗑️ Test user cleaned up');
        } catch (deleteError) {
          addResult('warning', '⚠️ Could not delete test user', deleteError.message);
        }

      } catch (error) {
        addResult('error', '❌ Test user creation failed', {
          code: error.code,
          message: error.message
        });
      }

      // 5. Check Firebase Project Settings
      addResult('info', '⚙️ Checking Firebase Project Settings...');
      addResult('info', '📝 Manual checks needed:', [
        '1. Go to Firebase Console > Authentication > Templates',
        '2. Check if email verification template is enabled',
        '3. Verify the sender email address',
        '4. Check if your domain is authorized',
        '5. Look for any error messages in the console'
      ]);

      // 6. Email Provider Recommendations
      addResult('info', '📮 Email Provider Recommendations:', [
        '1. Check spam/junk folders',
        '2. Look for emails from noreply@ryde-9d4bf.firebaseapp.com',
        '3. Add Firebase domain to email whitelist',
        '4. Check if email provider blocks automated emails',
        '5. Try with a different email provider (Gmail, Outlook, etc.)'
      ]);

      addResult('success', '🎉 Diagnostics completed!');

    } catch (error) {
      addResult('error', '❌ Diagnostics failed', {
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Firebase Email Diagnostics</h3>
      
      <div className="space-y-4">
        <div className="flex justify-center space-x-4">
          <Button
            onClick={runDiagnostics}
            loading={loading}
            disabled={loading}
            size="large"
          >
            {loading ? 'Running Diagnostics...' : 'Run Email Diagnostics'}
          </Button>
          <Button
            onClick={clearResults}
            disabled={loading}
            size="large"
            variant="secondary"
          >
            Clear Results
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border text-sm ${
                  result.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : result.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : result.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="font-medium">{result.message}</div>
                {result.data && (
                  <div className="mt-1">
                    {typeof result.data === 'object' ? (
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-xs">{result.data}</div>
                    )}
                  </div>
                )}
                <div className="text-xs opacity-75 mt-1">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">What This Tests</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• <strong>Firebase Configuration</strong> - Checks if all required environment variables are set</p>
            <p>• <strong>Authentication State</strong> - Verifies current user status</p>
            <p>• <strong>Email Sending</strong> - Tests email verification with current and test users</p>
            <p>• <strong>Project Settings</strong> - Provides manual checks for Firebase Console</p>
            <p>• <strong>Email Provider</strong> - Suggests troubleshooting steps for email delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseDiagnostics;
