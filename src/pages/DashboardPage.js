/* eslint-disable */
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../services/authService';
// import UserDebug from '../components/debug/UserDebug'; // Commented out for production
import UserTypeSwitcher from '../components/common/UserTypeSwitcher';
import RiderProfileCard from '../components/dashboard/RiderProfileCard';
import PaymentInfoCard from '../components/dashboard/PaymentInfoCard';
import DriverOnboardingCard from '../components/dashboard/DriverOnboardingCard';
import { DriverOnboardingProvider } from '../contexts/DriverOnboardingContext';
import OnboardingStatusBanner from '../components/driver/dashboard/OnboardingStatusBanner';
import SimplifiedDashboard from '../components/driver/dashboard/SimplifiedDashboard';
import AddUserTypeModal from '../components/auth/AddUserTypeModal';
import { USER_TYPES } from '../services/authService';
import { getAuth } from 'firebase/auth';

const DashboardPage = () => {
  const { user, setUser } = useAuth();
  const isUserAdmin = isAdmin(user);
  const [showAddDriverModal, setShowAddDriverModal] = React.useState(false);
  const [refreshingEmail, setRefreshingEmail] = React.useState(false);

  const refreshEmailVerification = async () => {
    setRefreshingEmail(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload();
        const updatedUser = auth.currentUser;
        
        // Update the user context with fresh email verification status
        setUser(prevUser => ({
          ...prevUser,
          emailVerified: updatedUser.emailVerified
        }));
      }
    } catch (error) {
      console.error('Error refreshing email verification:', error);
    } finally {
      setRefreshingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.displayName || user?.email}
              </p>
            </div>
            
            {/* Add Driver Profile Button - Only show if user doesn't have driver profile */}
            {user?.userTypes && !user.userTypes.includes('driver') && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Want to earn money driving?</span>
                <button
                  onClick={() => setShowAddDriverModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Add Driver Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Admin Dashboard Link */}
        {isUserAdmin && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-800">Admin Access</h3>
                <p className="text-blue-700 text-sm">You have admin privileges</p>
              </div>
              <a
                href="/admin-dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Admin Dashboard
              </a>
            </div>
          </div>
        )}

        {/* User Type Switcher */}
        <div className="mb-6">
          <UserTypeSwitcher />
        </div>


        {/* Temporary Debug Component - Commented out for production */}
        {/* <UserDebug /> */}

        {/* Main Dashboard Content - Show different content based on active profile */}
        {user?.activeUserType === 'driver' ? (
          // Driver Dashboard Content
          <DriverOnboardingProvider>
            <div className="space-y-6">
              {/* Driver Onboarding Status */}
              <OnboardingStatusBanner />
              
              {/* Driver Dashboard Widgets */}
              <SimplifiedDashboard />
            </div>
          </DriverOnboardingProvider>
        ) : (
          // Rider Dashboard Content
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <RiderProfileCard />
              
              {/* Payment Information */}
              <PaymentInfoCard />
            </div>

            {/* Driver Onboarding Card - Only show if user doesn't have driver profile */}
            {user?.userTypes && !user.userTypes.includes('driver') && (
              <div className="mb-8">
                <DriverOnboardingCard />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/request-ride"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                🚗 Request a Ride
              </a>
              <a
                href="/ride-history"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                📋 View Ride History
              </a>
              {user?.role === 'customer' && (
                <a
                  href="/rider/experience"
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  🎯 Enhanced Experience
                </a>
              )}
              <a
                href="/sustainability"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                🌱 Sustainability
              </a>
              <a
                href="/community"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                👥 Community
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="text-gray-500 text-sm">
              No recent activity
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Email:</span> {user?.email}
              </div>
              <div>
                <span className="font-medium">Role:</span> {user?.role || 'Customer'}
              </div>
              <div className="flex items-center">
                <span className="font-medium">Email Verified:</span> 
                <span className="ml-2">{user?.emailVerified ? '✅ Yes' : '❌ No'}</span>
                {!user?.emailVerified && (
                  <button
                    onClick={refreshEmailVerification}
                    disabled={refreshingEmail}
                    className="ml-2 text-xs text-primary-600 hover:text-primary-700 underline disabled:opacity-50"
                  >
                    {refreshingEmail ? 'Refreshing...' : 'Refresh Status'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Driver Profile Modal */}
      <AddUserTypeModal
        isOpen={showAddDriverModal}
        onClose={() => setShowAddDriverModal(false)}
        userType={USER_TYPES.DRIVER}
      />
    </div>
  );
};

export default DashboardPage; 