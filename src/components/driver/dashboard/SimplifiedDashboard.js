import React from 'react';
import { useDriverOnboarding } from '../../../contexts/DriverOnboardingContext';
import Button from '../../common/Button';

const SimplifiedDashboard = () => {
  const { applicationStatus, isApplicationStarted } = useDriverOnboarding();

  // If application not started, show getting started content
  if (!isApplicationStarted) {
    return (
      <div className="space-y-8">
        {/* Getting Started Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">What You'll Need</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Valid driver's license</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Vehicle registration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Proof of insurance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Clean background check</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Earning Potential</h3>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">$25-35/hour</div>
                <div className="text-sm text-green-700">Average earnings</div>
              </div>
              <div className="text-sm text-gray-600">
                Set your own prices and keep more of what you earn compared to other platforms.
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">15-20</div>
            <div className="text-sm text-gray-600">Minutes to complete</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">1-2</div>
            <div className="text-sm text-gray-600">Days for approval</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
            <div className="text-sm text-gray-600">Support available</div>
          </div>
        </div>
      </div>
    );
  }

  // If application is incomplete, show progress and next steps
  if (applicationStatus === 'incomplete') {
    return (
      <div className="space-y-8">
        {/* Progress Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Progress</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Application Progress</span>
              <span className="text-sm text-gray-500">Incomplete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-gray-600">
              Complete the remaining steps to submit your application for review.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-orange-600">1</span>
              </div>
              <span className="text-sm text-gray-700">Complete document upload</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-400">2</span>
              </div>
              <span className="text-sm text-gray-500">Submit for review</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-400">3</span>
              </div>
              <span className="text-sm text-gray-500">Wait for approval</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If application is pending, show waiting content
  if (applicationStatus === 'pending') {
    return (
      <div className="space-y-8">
        {/* Waiting Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Status</h2>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Under Review</h3>
            <p className="text-gray-600 mb-6">
              Your application is being reviewed by our team. This usually takes 1-2 business days.
            </p>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>What happens next?</strong><br />
                You'll receive an email notification once your application is approved or if we need additional information.
              </p>
            </div>
          </div>
        </div>

        {/* While You Wait */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">While You Wait</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Learn About Driving</h3>
              <p className="text-sm text-gray-600 mb-3">
                Check out our driver resources and tips for success.
              </p>
              <Button size="small" variant="outline">
                View Resources
              </Button>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Set Up Your Profile</h3>
              <p className="text-sm text-gray-600 mb-3">
                Complete your driver profile to get ready for your first ride.
              </p>
              <Button size="small" variant="outline">
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If application is rejected, show support options
  if (applicationStatus === 'rejected') {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Status</h2>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Not Approved</h3>
            <p className="text-gray-600 mb-6">
              Unfortunately, your driver application was not approved at this time.
            </p>
            <div className="space-y-3">
              <Button className="w-full">
                Contact Support
              </Button>
              <Button variant="outline" className="w-full">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If approved, show the full dashboard (this would be the existing dashboard content)
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to AnyRyde!</h2>
        <p className="text-gray-600">
          Your driver application has been approved. You can now start accepting rides and earning money!
        </p>
      </div>
      {/* This is where the full dashboard content would go */}
    </div>
  );
};

export default SimplifiedDashboard;
