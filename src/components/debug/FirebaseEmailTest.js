import React, { useState } from 'react';
import { auth } from '../../services/firebase';
import { sendEmailVerification, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

const FirebaseEmailTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [testEmail, setTestEmail] = useState('worksidedemo+test@gmail.com');
  const [testPassword, setTestPassword] = useState('TestPassword123');

  const testFirebaseEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing Firebase email verification...');
      console.log('Firebase config:', {
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        hasApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY
      });

      // First, try to create a test user
      console.log('📝 Creating test user...');
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      console.log('✅ Test user created:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      });

      // Wait a moment for the user to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now try to send email verification
      console.log('📧 Sending email verification...');
      await sendEmailVerification(user, {
        url: `${window.location.origin}/email-verified`,
        handleCodeInApp: true
      });

      console.log('✅ Email verification sent successfully');
      setResult({
        success: true,
        message: 'Test user created and email verification sent successfully!',
        user: {
          email: user.email,
          uid: user.uid,
          emailVerified: user.emailVerified
        }
      });
      toast.success('Test email sent!');

    } catch (error) {
      console.error('❌ Firebase email test failed:', error);
      setResult({
        success: false,
        message: error.message,
        error: {
          code: error.code,
          message: error.message
        }
      });
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithExistingUser = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🔐 Testing with existing user...');
      
      // Try to sign in with existing user
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      console.log('✅ Signed in with existing user:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      });

      // Send email verification
      console.log('📧 Sending email verification to existing user...');
      await sendEmailVerification(user, {
        url: `${window.location.origin}/email-verified`,
        handleCodeInApp: true
      });

      console.log('✅ Email verification sent to existing user');
      setResult({
        success: true,
        message: 'Email verification sent to existing user successfully!',
        user: {
          email: user.email,
          uid: user.uid,
          emailVerified: user.emailVerified
        }
      });
      toast.success('Email sent to existing user!');

    } catch (error) {
      console.error('❌ Existing user test failed:', error);
      setResult({
        success: false,
        message: error.message,
        error: {
          code: error.code,
          message: error.message
        }
      });
      toast.error(`Existing user test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Firebase Email Test</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Email
            </label>
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Password
            </label>
            <Input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="password"
            />
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            onClick={testFirebaseEmail}
            loading={loading}
            disabled={loading}
            size="large"
          >
            {loading ? 'Testing...' : 'Test New User + Email'}
          </Button>
          <Button
            onClick={testWithExistingUser}
            loading={loading}
            disabled={loading}
            size="large"
            variant="secondary"
          >
            {loading ? 'Testing...' : 'Test Existing User'}
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

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Firebase Configuration</h4>
          <div className="text-sm text-blue-800">
            <p><strong>Project ID:</strong> {process.env.REACT_APP_FIREBASE_PROJECT_ID || 'Not set'}</p>
            <p><strong>Auth Domain:</strong> {process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'Not set'}</p>
            <p><strong>API Key:</strong> {process.env.REACT_APP_FIREBASE_API_KEY ? 'Set' : 'Not set'}</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Instructions</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>1. <strong>Test New User + Email</strong> - Creates a new user and sends verification</p>
            <p>2. <strong>Test Existing User</strong> - Uses existing user to send verification</p>
            <p>3. <strong>Check console logs</strong> for detailed information</p>
            <p>4. <strong>Check email inbox and spam folder</strong></p>
            <p>5. <strong>Look for sender:</strong> noreply@ryde-9d4bf.firebaseapp.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseEmailTest;
