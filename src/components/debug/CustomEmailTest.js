import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

const CustomEmailTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [testEmail, setTestEmail] = useState('');

  const testCustomEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const testPassword = 'TestPassword123!';

      console.log('🧪 Creating test user with custom email:', testEmail);
      
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      console.log('✅ User created:', user.uid);
      setResult(prev => [...(prev || []), { type: 'success', message: `✅ User created: ${user.uid}` }]);

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('📧 Sending email verification to custom email...');
      
      // Send verification email with custom settings
      await sendEmailVerification(user, {
        url: `${window.location.origin}/email-verified`,
        handleCodeInApp: true
      });
      
      console.log('✅ Email verification sent to custom email');
      setResult(prev => [...(prev || []), { type: 'success', message: `✅ Email verification sent to ${testEmail}` }]);

      // Clean up
      await signOut(auth);
      console.log('✅ Signed out');
      setResult(prev => [...(prev || []), { type: 'info', message: '✅ Test user signed out' }]);

      toast.success('Test completed! Check your email inbox.');

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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Custom Email Test</h3>
      
      <div className="space-y-4">
        <Input
          label="Test Email Address"
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="your-email@example.com"
          required
        />
        
        <Button
          onClick={testCustomEmail}
          loading={loading}
          disabled={loading || !testEmail}
          size="large"
        >
          {loading ? 'Testing...' : 'Test Custom Email'}
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

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Test with Different Email Providers</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>Try these email providers to see which ones work:</p>
            <ul className="list-disc list-inside ml-2">
              <li>Gmail (gmail.com)</li>
              <li>Outlook (outlook.com, hotmail.com)</li>
              <li>Yahoo (yahoo.com)</li>
              <li>ProtonMail (protonmail.com)</li>
              <li>Your custom domain (prologixsa.com)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomEmailTest;
