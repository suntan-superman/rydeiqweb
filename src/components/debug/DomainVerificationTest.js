import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resendEmailVerification } from '../../services/authService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const DomainVerificationTest = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const testEmailVerification = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);
    try {
      console.log('🧪 Testing email verification with custom domain...');
      console.log('📧 User email:', user.email);
      console.log('🌐 Current origin:', window.location.origin);
      
      const result = await resendEmailVerification(user);
      
      if (result.success) {
        toast.success('✅ Test email sent! Check your inbox for verification from anyryde.com');
        console.log('✅ Email verification test successful');
      } else {
        toast.error('❌ Test failed: ' + result.error.message);
        console.error('❌ Email verification test failed:', result.error);
      }
    } catch (error) {
      toast.error('❌ Test error: ' + error.message);
      console.error('❌ Email verification test error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 Custom Domain Email Test
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Test email verification with your custom domain <strong>anyryde.com</strong>
      </p>
      
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            <strong>Expected:</strong> Email should come from <code>noreply@anyryde.com</code>
          </p>
        </div>
        
        <Button
          onClick={testEmailVerification}
          loading={loading}
          disabled={loading || !user}
          className="w-full"
        >
          {loading ? 'Sending Test Email...' : 'Send Test Verification Email'}
        </Button>
        
        {!user && (
          <p className="text-sm text-gray-500 text-center">
            Please log in to test email verification
          </p>
        )}
      </div>
    </div>
  );
};

export default DomainVerificationTest;
