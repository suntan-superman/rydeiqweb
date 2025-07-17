import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { startApplication, saving, isApplicationStarted, goToNextStep } = useDriverOnboarding();

  const handleGetStarted = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=driver-onboarding');
      return;
    }

    if (isApplicationStarted) {
      goToNextStep();
      return;
    }

    const result = await startApplication();
    if (result.success) {
      goToNextStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Drive with AnyRyde
            <span className="block text-primary-600">Earn More, Keep More</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join the driver-friendly platform that puts more money in your pocket. 
            Set your own rates, keep your earnings, and build your business.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Benefit 1: Fair Rates */}
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Fair Commission Rates</h3>
            <p className="text-gray-600 mb-4">
              Keep 80-90% of your earnings with our low 10-20% commission rate
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                <span className="font-semibold">vs. Uber/Lyft:</span> 40-50% commission
              </p>
            </div>
          </div>

          {/* Benefit 2: Set Your Schedule */}
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Set Your Own Schedule</h3>
            <p className="text-gray-600 mb-4">
              Work when you want, where you want. Complete flexibility and control over your time.
            </p>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-sm text-primary-700">
                <span className="font-semibold">Your business,</span> your rules
              </p>
            </div>
          </div>

          {/* Benefit 3: Fast Payouts */}
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Paid Fast</h3>
            <p className="text-gray-600 mb-4">
              Instant payouts available or weekly direct deposits. Your choice.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-700">
                <span className="font-semibold">Same day</span> cash out available
              </p>
            </div>
          </div>
        </div>

        {/* Additional Benefits */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-12">
          <h3 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            Why Independent Drivers Choose AnyRyde
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Transparent Pricing</h4>
                <p className="text-gray-600">No hidden fees or surprise deductions</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Driver Support</h4>
                <p className="text-gray-600">Real human support when you need help</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Local Market Focus</h4>
                <p className="text-gray-600">Build relationships with regular passengers</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Referral Bonuses</h4>
                <p className="text-gray-600">Earn extra by referring other drivers</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to Start Earning More?
          </h3>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Join thousands of drivers who have already made the switch to better earnings and more control.
          </p>
          
          {isAuthenticated && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Welcome back, {user?.displayName || user?.email}
              </p>
            </div>
          )}

          <Button
            onClick={handleGetStarted}
            size="large"
            variant="primary"
            loading={saving}
            className="px-12 py-4 text-lg"
          >
            {saving ? (
              <LoadingSpinner size="small" variant="white" />
            ) : isApplicationStarted ? (
              'Continue Application'
            ) : (
              'Get Started'
            )}
          </Button>

          <div className="mt-6 text-sm text-gray-500">
            <p>
              🚗 Application takes less than 15 minutes • 📱 Start earning in 24-48 hours
            </p>
          </div>

          {!isAuthenticated && (
            <div className="mt-6 text-sm text-gray-600">
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login?redirect=driver-onboarding')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen; 