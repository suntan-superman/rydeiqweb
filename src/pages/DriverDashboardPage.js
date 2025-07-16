import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDriverOnboarding } from '../contexts/DriverOnboardingContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

// Dashboard Components
import OnlineToggle from '../components/driver/dashboard/OnlineToggle';
import EarningsWidget from '../components/driver/dashboard/EarningsWidget';
import ProfileSummary from '../components/driver/dashboard/ProfileSummary';
import QuickActions from '../components/driver/dashboard/QuickActions';
import TripHistory from '../components/driver/dashboard/TripHistory';
import DocumentStatus from '../components/driver/dashboard/DocumentStatus';

const DriverDashboardPage = () => {
  const { user } = useAuth();
  const { driverApplication, loading, applicationStatus, DRIVER_STATUS } = useDriverOnboarding();
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Check if driver is approved and can go online
  const canGoOnline = driverApplication && 
                     (applicationStatus === DRIVER_STATUS.APPROVED || 
                      applicationStatus === DRIVER_STATUS.ACTIVE);

  // Handle online/offline toggle
  const handleOnlineToggle = async (online) => {
    if (!canGoOnline && online) {
      toast.error('Complete your application approval process before going online');
      return;
    }
    
    setIsOnline(online);
    toast.success(online ? 'You are now online and available for rides!' : 'You are now offline');
  };

  // Show loading state
  if (loading) {
    return <LoadingSpinner message="Loading driver dashboard..." />;
  }

  // Show onboarding prompt if no application exists
  if (!driverApplication) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Driver Application</h2>
            <p className="text-gray-600 mb-6">
              Before you can access your driver dashboard, you need to complete the onboarding process.
            </p>
          </div>
          <Button 
            variant="primary" 
            className="w-full mb-4"
            onClick={() => window.location.href = '/driver-onboarding'}
          >
            Complete Onboarding
          </Button>
        </div>
      </div>
    );
  }

  const getDriverName = () => {
    if (driverApplication?.personalInfo?.firstName && driverApplication?.personalInfo?.lastName) {
      return `${driverApplication.personalInfo.firstName} ${driverApplication.personalInfo.lastName}`;
    }
    return user?.displayName || user?.email || 'Driver';
  };

  const getStatusMessage = () => {
    switch (applicationStatus) {
      case DRIVER_STATUS.PENDING:
        return 'Application under review';
      case DRIVER_STATUS.REVIEW_PENDING:
        return 'Documents being reviewed';
      case DRIVER_STATUS.APPROVED:
        return 'Ready to drive!';
      case DRIVER_STATUS.ACTIVE:
        return 'Active driver';
      case DRIVER_STATUS.REJECTED:
        return 'Application needs attention';
      default:
        return 'Application in progress';
    }
  };

  const getStatusColor = () => {
    switch (applicationStatus) {
      case DRIVER_STATUS.APPROVED:
      case DRIVER_STATUS.ACTIVE:
        return 'text-green-600 bg-green-50';
      case DRIVER_STATUS.PENDING:
      case DRIVER_STATUS.REVIEW_PENDING:
        return 'text-yellow-600 bg-yellow-50';
      case DRIVER_STATUS.REJECTED:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'earnings', name: 'Earnings', icon: '💰' },
    { id: 'trips', name: 'Trips', icon: '🚗' },
    { id: 'profile', name: 'Profile', icon: '👤' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                RydeAlong Driver
              </h1>
            </div>
            
            {/* Online Status & Toggle */}
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {getStatusMessage()}
              </div>
              <OnlineToggle 
                isOnline={isOnline}
                onToggle={handleOnlineToggle}
                disabled={!canGoOnline}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Welcome back, {getDriverName()}!
              </h2>
              <p className="text-blue-100 mt-1">
                {isOnline ? 'You\'re online and available for rides' : 'You\'re currently offline'}
              </p>
            </div>
            
            {canGoOnline && (
              <div className="mt-4 sm:mt-0 flex space-x-3">
                {!isOnline && (
                  <Button 
                    variant="secondary"
                    onClick={() => handleOnlineToggle(true)}
                    className="bg-white text-blue-600 hover:bg-gray-50"
                  >
                    Go Online
                  </Button>
                )}
                <Button 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                  onClick={() => setActiveTab('profile')}
                >
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">$0</div>
                <div className="text-sm text-gray-600">Today's Earnings</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Trips Today</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-yellow-600">5.0</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>

            {/* Quick Actions */}
            <QuickActions 
              onGoOnline={() => handleOnlineToggle(true)}
              onEditProfile={() => setActiveTab('profile')}
              onViewEarnings={() => setActiveTab('earnings')}
              canGoOnline={canGoOnline}
              isOnline={isOnline}
            />

            {/* Document Status */}
            <DocumentStatus driverApplication={driverApplication} />
          </div>
        )}

        {activeTab === 'earnings' && (
          <EarningsWidget driverApplication={driverApplication} />
        )}

        {activeTab === 'trips' && (
          <TripHistory driverApplication={driverApplication} />
        )}

        {activeTab === 'profile' && (
          <ProfileSummary 
            driverApplication={driverApplication} 
            onEditComplete={() => window.location.reload()}
          />
        )}
      </div>
    </div>
  );
};

export default DriverDashboardPage; 