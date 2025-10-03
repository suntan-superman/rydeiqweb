import React, { useState, useEffect } from 'react';
import { 
  BellIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  TruckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import ScheduledRideRequests from './ScheduledRideRequests';
import EnhancedDriverScheduleManager from './EnhancedDriverScheduleManager';
import DriverBiddingInterface from './DriverBiddingInterface';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Driver Dashboard Component
 * Main dashboard for drivers showing:
 * - Pending scheduled ride requests
 * - Today's schedule
 * - Available ride requests
 * - Driver statistics
 */
const DriverDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [driverStats, setDriverStats] = useState({
    pendingRequests: 0,
    todaysRides: 0,
    completedRides: 0,
    rating: 0
  });

  const tabs = [
    { id: 'requests', name: 'Scheduled Requests', icon: BellIcon, count: driverStats.pendingRequests },
    { id: 'schedule', name: 'My Schedule', icon: CalendarIcon, count: driverStats.todaysRides },
    { id: 'available', name: 'Available Rides', icon: TruckIcon },
    { id: 'stats', name: 'Statistics', icon: ChartBarIcon }
  ];

  useEffect(() => {
    if (user?.uid) {
      loadDriverStats();
    }
  }, [user?.uid]);

  const loadDriverStats = async () => {
    // This would load actual driver statistics
    // For now, we'll use mock data
    setDriverStats({
      pendingRequests: 2,
      todaysRides: 3,
      completedRides: 45,
      rating: 4.8
    });
  };

  const handleRideAccepted = (request) => {
    console.log('Ride accepted:', request);
    // Refresh stats
    loadDriverStats();
  };

  const handleRideDeclined = (request) => {
    console.log('Ride declined:', request);
    // Refresh stats
    loadDriverStats();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Driver Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Welcome back, {user?.displayName || user?.email || 'Driver'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Driver Rating</p>
                <div className="flex items-center space-x-1">
                  <span className="text-2xl font-bold text-gray-900">{driverStats.rating}</span>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BellIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{driverStats.pendingRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Rides</p>
                <p className="text-2xl font-bold text-gray-900">{driverStats.todaysRides}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Rides</p>
                <p className="text-2xl font-bold text-gray-900">{driverStats.completedRides}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Driver Rating</p>
                <p className="text-2xl font-bold text-gray-900">{driverStats.rating}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activeTab === tab.id 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'requests' && (
            <div className="p-6">
              <ScheduledRideRequests
                driverId={user?.uid}
                onRideAccepted={handleRideAccepted}
                onRideDeclined={handleRideDeclined}
              />
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="p-6">
              <EnhancedDriverScheduleManager
                driverId={user?.uid}
                viewMode="week"
                showMedicalRides={true}
                showRegularRides={true}
                allowEditing={true}
                isMobile={false}
              />
            </div>
          )}

          {activeTab === 'available' && (
            <div className="p-6">
              <DriverBiddingInterface driverId={user?.uid} />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Weekly Performance
                  </h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Performance chart would go here</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Ride completed</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <BellIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">New scheduled request</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <CalendarIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Schedule updated</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
