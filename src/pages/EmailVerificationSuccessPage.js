import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkEmailVerification } from '../services/authService';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const EmailVerificationSuccessPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('checking'); // 'checking', 'success', 'error'
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        console.log('🔍 Checking email verification status...');
        
        // Check if user is logged in
        if (!user) {
          console.log('❌ No user logged in, redirecting to login');
          setVerificationStatus('error');
          return;
        }

        // Check email verification status
        const result = await checkEmailVerification();
        
        if (result.success && result.emailVerified) {
          console.log('✅ Email verified successfully!');
          setVerificationStatus('success');
          
          // Update user in context
          setUser({
            ...user,
            emailVerified: true
          });
          
          toast.success('Email verified successfully!');
          
          // Start countdown to redirect
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                // Redirect based on user type
                if (user.userType === 'driver') {
                  navigate('/driver-dashboard');
                } else if (user.userType === 'admin') {
                  navigate('/admin-dashboard');
                } else if (user.userType === 'healthcare_provider') {
                  navigate('/medical-portal');
                } else {
                  navigate('/dashboard');
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
        } else {
          console.log('❌ Email not verified yet');
          setVerificationStatus('error');
        }
      } catch (error) {
        console.error('❌ Error checking email verification:', error);
        setVerificationStatus('error');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [user, setUser, navigate]);

  const handleManualRedirect = () => {
    if (user?.userType === 'driver') {
      navigate('/driver-dashboard');
    } else if (user?.userType === 'admin') {
      navigate('/admin-dashboard');
    } else if (user?.userType === 'healthcare_provider') {
      navigate('/medical-portal');
    } else {
      navigate('/dashboard');
    }
  };

  const handleResendVerification = () => {
    navigate('/login');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Verifying Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we confirm your email verification...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Email Verified Successfully!
            </h2>
            
            <p className="text-lg text-gray-600 mb-6">
              Your email has been verified. You can now access all features of your account.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Redirecting you to your dashboard in <strong>{countdown}</strong> seconds...
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleManualRedirect}
                className="w-full"
              >
                Go to Dashboard Now
              </Button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Verification Failed
          </h2>
          
          <p className="text-lg text-gray-600 mb-6">
            We couldn't verify your email. This might be because:
          </p>
          
          <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
            <li>• The verification link has expired</li>
            <li>• You're not logged in to the correct account</li>
            <li>• The verification process is still in progress</li>
          </ul>
          
          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              className="w-full"
            >
              Try Again
            </Button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationSuccessPage;
