import React from 'react';
import { useDriverOnboarding } from '../../../contexts/DriverOnboardingContext';
import { Link } from 'react-router-dom';

const OnboardingStatus = () => {
  const { driverApplication } = useDriverOnboarding();

  if (!driverApplication) {
    return null;
  }

  const isOnboardingComplete = driverApplication.onboardingStatus?.completed || false;
  const isApproved = driverApplication.approvalStatus?.status === 'approved';

  // Show pending onboarding banner
  if (!isOnboardingComplete) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Onboarding Incomplete
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                You need to complete your driver onboarding to access all features. 
                Some features may be limited until onboarding is complete.
              </p>
            </div>
            <div className="mt-4">
              <div className="flex space-x-3">
                <Link
                  to="/driver-onboarding"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Continue Onboarding
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show approval status
  if (!isApproved) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Application Under Review
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Your driver application is being reviewed by our team. 
                You'll receive a notification once the review is complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success status
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            Onboarding Complete
          </h3>
          <div className="mt-2 text-sm text-green-700">
            <p>
              Congratulations! Your driver onboarding is complete and you're approved to drive. 
              You can now access all features in the mobile app.
            </p>
          </div>
          {driverApplication.onboardingStatus?.completedAt && (
            <div className="mt-2 text-xs text-green-600">
              Completed on {new Date(driverApplication.onboardingStatus.completedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingStatus; 