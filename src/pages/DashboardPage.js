/* eslint-disable */
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../services/authService';
import UserDebug from '../components/debug/UserDebug';

const DashboardPage = () => {
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.displayName || user?.email}
          </p>
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

        {/* Temporary Debug Component */}
        <UserDebug />

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
              <a
                href="/driver-onboarding"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                🚙 Become a Driver
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
              <div>
                <span className="font-medium">Email Verified:</span> {user?.emailVerified ? '✅ Yes' : '❌ No'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 