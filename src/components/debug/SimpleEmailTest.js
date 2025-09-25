import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const SimpleEmailTest = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testDirectEmailVerification = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing direct Firebase email verification...');
      console.log('User:', { email: user.email, uid: user.uid });
      console.log('Auth current user:', auth.currentUser);
      
      // Test direct Firebase email verification
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/login?verified=true`,
        handleCodeInApp: true
      });
      
      console.log('✅ Direct email verification sent successfully');
      setResult({
        success: true,
        message: 'Email verification sent successfully using direct Firebase method',
        timestamp: new Date().toISOString()
      });
      toast.success('✅ Email sent using direct Firebase method!');
      
    } catch (error) {
      console.error('❌ Direct email verification failed:', error);
      setResult({
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      toast.error(`❌ Direct method failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithCustomActionCodeSettings = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing with custom action code settings...');
      
      // Import ActionCodeSettings
      const { ActionCodeSettings } = await import('firebase/auth');
      
      const actionCodeSettings = {
        url: `${window.location.origin}/login?verified=true`,
        handleCodeInApp: true,
      };
      
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
      
      console.log('✅ Email verification with custom settings sent successfully');
      setResult({
        success: true,
        message: 'Email verification sent with custom ActionCodeSettings',
        timestamp: new Date().toISOString()
      });
      toast.success('✅ Email sent with custom settings!');
      
    } catch (error) {
      console.error('❌ Custom settings email verification failed:', error);
      setResult({
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      toast.error(`❌ Custom settings failed: ${error.message}`);
    } finally {
      setLoading(false);
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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 Simple Email Verification Test</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">User Info</h4>
          <p className="text-sm text-gray-600">Email: {user.email}</p>
          <p className="text-sm text-gray-600">UID: {user.uid}</p>
          <p className="text-sm text-gray-600">Verified: {user.emailVerified ? 'Yes' : 'No'}</p>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={testDirectEmailVerification}
            loading={loading}
            disabled={loading}
            size="small"
          >
            Test Direct Method
          </Button>
          
          <Button
            onClick={testWithCustomActionCodeSettings}
            loading={loading}
            disabled={loading}
            variant="outline"
            size="small"
          >
            Test Custom Settings
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              Test Result: {result.success ? '✅ Success' : '❌ Failed'}
            </h4>
            <p className={`text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
            {result.code && (
              <p className="text-xs text-red-600 mt-1">
                Error Code: {result.code}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Tested at: {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What This Tests</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Direct Method:</strong> Uses Firebase's sendEmailVerification directly</p>
            <p>• <strong>Custom Settings:</strong> Uses ActionCodeSettings for more control</p>
            <p>• <strong>Purpose:</strong> Bypass our service layer to test Firebase directly</p>
            <p>• <strong>Expected:</strong> Both should work if Firebase is configured correctly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleEmailTest;
