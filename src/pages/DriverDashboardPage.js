import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DriverOnboardingProvider } from '../contexts/DriverOnboardingContext';
import OnboardingStatus from '../components/driver/dashboard/OnboardingStatus';
import ProfileSummary from '../components/driver/dashboard/ProfileSummary';
import EarningsWidget from '../components/driver/dashboard/EarningsWidget';
import OnlineToggle from '../components/driver/dashboard/OnlineToggle';
import QuickActions from '../components/driver/dashboard/QuickActions';
import TripHistory from '../components/driver/dashboard/TripHistory';
import DocumentStatus from '../components/driver/dashboard/DocumentStatus';

const DriverDashboardPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DriverOnboardingProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user.displayName || user.email}
            </p>
          </div>

          {/* Onboarding Status Banner */}
          <OnboardingStatus />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Summary */}
              <ProfileSummary />
              
              {/* Earnings Widget */}
              <EarningsWidget />
              
              {/* Trip History */}
              <TripHistory />
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Online Toggle */}
              <OnlineToggle />
              
              {/* Quick Actions */}
              <QuickActions />
              
              {/* Document Status */}
              <DocumentStatus />
            </div>
          </div>
        </div>
      </div>
    </DriverOnboardingProvider>
  );
};

export default DriverDashboardPage; 