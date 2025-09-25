import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DriverOnboardingProvider } from '../contexts/DriverOnboardingContext';
import OnboardingStatusBanner from '../components/driver/dashboard/OnboardingStatusBanner';
import SimplifiedDashboard from '../components/driver/dashboard/SimplifiedDashboard';
import DriverBiddingInterface from '../components/driver/DriverBiddingInterface';
import VideoRecordingInterface from '../components/driver/VideoRecordingInterface';
import PairedDriverInterface from '../components/driver/PairedDriverInterface';
import DriverEarningsWidget from '../components/driver/DriverEarningsWidget';
import DriverRideManagement from '../components/driver/DriverRideManagement';
import MedicalRideInterface from '../components/driver/MedicalRideInterface';

const DriverDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [setDriverStatus] = useState('offline');
  const [isOnline, setIsOnline] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'bidding', name: 'Bidding', icon: '💰' },
    { id: 'rides', name: 'Ride Management', icon: '🚗' },
    { id: 'earnings', name: 'Earnings', icon: '💵' },
    { id: 'video', name: 'Video Recording', icon: '🎥' },
    { id: 'paired', name: 'Paired Driver', icon: '👥' },
    { id: 'medical', name: 'Medical Rides', icon: '🏥' }
  ];

  useEffect(() => {
    // Load driver status and preferences
    const loadDriverStatus = () => {
      // In production, this would load from the driver service
      const savedStatus = localStorage.getItem('driverStatus') || 'offline';
      setDriverStatus(savedStatus);
      setIsOnline(savedStatus === 'online');
    };
    
    loadDriverStatus();
  }, [setDriverStatus]);

  const handleGoOnline = () => {
    setDriverStatus('online');
    setIsOnline(true);
    localStorage.setItem('driverStatus', 'online');
    // In production, this would update the driver service
  };

  const handleGoOffline = () => {
    setDriverStatus('offline');
    setIsOnline(false);
    localStorage.setItem('driverStatus', 'offline');
    // In production, this would update the driver service
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SimplifiedDashboard />;
      case 'bidding':
        return <DriverBiddingInterface driverId={user.uid} />;
      case 'rides':
        return <DriverRideManagement driverId={user.uid} />;
      case 'earnings':
        return <DriverEarningsWidget driverId={user.uid} />;
      case 'video':
        return <VideoRecordingInterface driverId={user.uid} />;
      case 'paired':
        return <PairedDriverInterface driverId={user.uid} />;
      case 'medical':
        return <MedicalRideInterface driverId={user.uid} />;
      default:
        return <SimplifiedDashboard />;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DriverOnboardingProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
                <p className="text-gray-600 mt-2">
                  Welcome back, {user.displayName || user.email}
                </p>
              </div>
              
              {/* Driver Status Toggle */}
              <div className="flex items-center space-x-4">
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isOnline 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isOnline ? '🟢 Online' : '🔴 Offline'}
                </div>
                {isOnline ? (
                  <button
                    onClick={handleGoOffline}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Go Offline
                  </button>
                ) : (
                  <button
                    onClick={handleGoOnline}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Go Online
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Onboarding Status Banner */}
          <OnboardingStatusBanner />

          {/* Navigation Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
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

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </DriverOnboardingProvider>
  );
};

export default DriverDashboardPage; 