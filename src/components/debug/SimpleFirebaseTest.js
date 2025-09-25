import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const SimpleFirebaseTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testEmailSending = async () => {
    setLoading(true);
    setResult(null);

    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';

      console.log('🧪 Creating test user:', testEmail);
      
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      console.log('✅ User created:', user.uid);
      setResult(prev => [...(prev || []), { type: 'success', message: `✅ User created: ${user.uid}` }]);

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('📧 Sending email verification...');
      
      // Send verification email
      await sendEmailVerification(user, {
        url: `${window.location.origin}/email-verified`,
        handleCodeInApp: true
      });
      
      console.log('✅ Email verification sent');
      setResult(prev => [...(prev || []), { type: 'success', message: '✅ Email verification sent successfully' }]);

      // Clean up
      await signOut(auth);
      console.log('✅ Signed out');
      setResult(prev => [...(prev || []), { type: 'info', message: '✅ Test user signed out' }]);

      toast.success('Test completed! Check console for details.');

    } catch (error) {
      console.error('❌ Test failed:', error);
      setResult(prev => [...(prev || []), { type: 'error', message: `❌ Error: ${error.message}` }]);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 Simple Firebase Email Test</h3>
      
      <div className="space-y-4">
        <Button
          onClick={testEmailSending}
          loading={loading}
          disabled={loading}
          size="large"
        >
          {loading ? 'Testing...' : 'Test Email Sending'}
        </Button>

        {result && (
          <div className="space-y-2">
            {result.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  item.type === 'success' 
                    ? 'bg-green-50 text-green-800'
                    : item.type === 'error'
                    ? 'bg-red-50 text-red-800'
                    : 'bg-blue-50 text-blue-800'
                }`}
              >
                {item.message}
              </div>
            ))}
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">⚠️ If emails aren't received:</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>1. Check Firebase Console > Authentication > Templates</p>
            <p>2. Make sure "Email address verification" is <strong>ENABLED</strong></p>
            <p>3. Check the sender email address</p>
            <p>4. Look for any error messages in Firebase Console</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleFirebaseTest;
