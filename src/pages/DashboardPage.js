/* eslint-disable */
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.displayName || user?.firstName || 'User'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Ready to find the best ride deals? Start comparing prices now.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Compare Rides
              </h3>
              <p className="text-gray-600 mb-4">
                Find the best prices for your next trip
              </p>
              <Button variant="primary" className="w-full">
                Start Comparing
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Trip History
              </h3>
              <p className="text-gray-600 mb-4">
                View your past rides and savings
              </p>
              <Button variant="outline" className="w-full">
                View History
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Account Settings
              </h3>
              <p className="text-gray-600 mb-4">
                Manage your profile and preferences
              </p>
              <Button variant="secondary" className="w-full">
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">$0</div>
              <div className="text-sm text-gray-600">Total Savings</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Rides Compared</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Trips Taken</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">$0</div>
              <div className="text-sm text-gray-600">Avg. Savings</div>
            </div>
          </div>
        </div>

        {/* Mobile App Promotion */}
        <div className="card bg-gradient-primary text-white">
          <div className="card-body">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-semibold mb-2">
                  Get the Mobile App for More Features
                </h3>
                <p className="opacity-90">
                  Download our mobile app for real-time notifications, GPS tracking, and more advanced features.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="secondary"
                  className="whitespace-nowrap"
                >
                  Download App
                </Button>
                <Button
                  variant="outline"
                  className="whitespace-nowrap border-white text-white hover:bg-white hover:text-primary-600"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 