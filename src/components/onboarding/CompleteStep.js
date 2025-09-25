import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import OnboardingProgress from './OnboardingProgress';
import toast from 'react-hot-toast';

const CompleteStep = () => {
  const { formData, submitOnboarding } = useOnboarding();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleCompleteOnboarding = async () => {
    try {
      const result = await submitOnboarding();
      if (result.success) {
        // Update user context with new profile data
        if (user) {
          // Process payment method to match the mobile app structure exactly
          const processedPaymentMethod = formData.paymentMethod && formData.paymentMethod.cardNumber ? {
            type: formData.paymentMethod.type,
            cardNumber: formData.paymentMethod.cardNumber,
            expiryDate: formData.paymentMethod.expiryDate,
            cvv: formData.paymentMethod.cvv,
            name: formData.paymentMethod.cardholderName, // Note: mobile app uses 'name', not 'cardholderName'
            // Also store the simplified version for display purposes
            last4: formData.paymentMethod.cardNumber.slice(-4),
            brand: formData.paymentMethod.type === 'credit_card' ? 'card' : formData.paymentMethod.type
          } : null;
          
          
          setUser(prev => {
            const updatedUser = { 
              ...prev, 
              profilePicture: formData.profilePicture,
              paymentMethod: processedPaymentMethod,
              onboardingComplete: true 
            };
            return updatedUser;
          });
        }
        toast.success('Welcome to AnyRyde! Your profile has been updated successfully.');
        
        // Wait a bit longer to ensure Firestore is updated before navigation
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    }
  };

  const handleGetStarted = async () => {
    // Complete onboarding first, then navigate
    await handleCompleteOnboarding();
  };

  const handleExploreFeatures = async () => {
    // Complete onboarding first, then navigate to ride request
    await handleCompleteOnboarding();
    setTimeout(() => {
      navigate('/request-ride');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <OnboardingProgress />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center">
            {/* Success Animation */}
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to AnyRyde!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your account has been created successfully. You're all set to start saving money on rides!
            </p>

            {/* User Info Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Account Type</p>
                  <p className="font-medium text-gray-900">Rider</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profile Picture</p>
                  <p className="font-medium text-gray-900">
                    {formData.profilePicture ? '✓ Uploaded' : 'Not uploaded'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium text-gray-900">
                    {formData.paymentMethod.cardNumber ? '✓ Added' : 'Not added'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Type</p>
                  <p className="font-medium text-gray-900 capitalize">{formData.userType}</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Request a Ride</h3>
                  <p className="text-sm text-gray-600">Book your first ride and start saving money</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Compare Prices</h3>
                  <p className="text-sm text-gray-600">Get competitive bids from multiple drivers</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Track Rides</h3>
                  <p className="text-sm text-gray-600">Monitor your rides in real-time</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                type="button"
                variant="primary"
                onClick={handleExploreFeatures}
                size="large"
                className="px-8 py-3"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> Request Your First Ride
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGetStarted}
                size="large"
                className="px-8 py-3"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" /></svg> Go to Dashboard
              </Button>
            </div>

            {/* Support Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Need help getting started?
              </p>
              <div className="flex justify-center space-x-6">
                <a href="/contact" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                  Contact Support
                </a>
                <a href="/about" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                  Learn More
                </a>
                <a href="/terms" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteStep;
