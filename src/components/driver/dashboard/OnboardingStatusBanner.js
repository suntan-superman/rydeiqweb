import React from 'react';
import { useDriverOnboarding } from '../../../contexts/DriverOnboardingContext';
import { Link } from 'react-router-dom';
import Button from '../../common/Button';

const OnboardingStatusBanner = () => {
  const { 
    applicationStatus, 
    progress, 
    isApplicationStarted 
  } = useDriverOnboarding();

  if (!isApplicationStarted) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚗</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Start Your Driver Application
            </h3>
            <p className="text-blue-700 mb-4">
              Complete your driver onboarding to start earning with AnyRyde. The process takes about 15-20 minutes.
            </p>
            <Link to="/driver-onboarding">
              <Button size="medium" className="bg-blue-600 hover:bg-blue-700">
                Begin Application
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (applicationStatus === 'pending') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Application Under Review
            </h3>
            <p className="text-yellow-700 mb-2">
              Your driver application is being reviewed by our team. This usually takes 1-2 business days.
            </p>
            <p className="text-sm text-yellow-600">
              Progress: {Math.round(progress)}% complete
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (applicationStatus === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Application Not Approved
            </h3>
            <p className="text-red-700 mb-4">
              Unfortunately, your driver application was not approved. Please contact support for more information.
            </p>
            <Button size="medium" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (applicationStatus === 'incomplete') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              Complete Your Application
            </h3>
            <p className="text-orange-700 mb-4">
              Your driver application is incomplete. Please finish the remaining steps to submit for review.
            </p>
            <div className="flex space-x-3">
              <Link to="/driver-onboarding">
                <Button size="medium" className="bg-orange-600 hover:bg-orange-700">
                  Continue Application
                </Button>
              </Link>
              <span className="text-sm text-orange-600 self-center">
                {Math.round(progress)}% complete
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (applicationStatus === 'approved') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Welcome to AnyRyde!
            </h3>
            <p className="text-green-700">
              Your driver application has been approved. You can now start accepting rides and earning money!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OnboardingStatusBanner;
