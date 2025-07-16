/* eslint-disable */
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
                🚗 Request a Ride
              </h3>
              <p className="text-gray-600 mb-4">
                Book a ride with competitive driver bidding
              </p>
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => navigate('/request-ride')}
              >
                Request Ride
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📊 Compare Rides
              </h3>
              <p className="text-gray-600 mb-4">
                Find the best prices for your next trip
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/compare')}
              >
                Start Comparing
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📋 Trip History
              </h3>
              <p className="text-gray-600 mb-4">
                View your past rides and savings
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/ride-history')}
              >
                View History
              </Button>
            </div>
          </div>
        </div>

        {/* Driver Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white mb-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">Interested in driving?</h2>
            <p className="text-blue-100 mb-6">
              Join our network of independent drivers and earn more with our fair pricing model. 
              No surge pricing, transparent fees, and competitive commission rates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                className="bg-white text-blue-600 border-white hover:bg-blue-50"
                onClick={() => navigate('/driver-onboarding')}
              >
                Become a Driver
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white hover:bg-opacity-20"
                onClick={() => navigate('/driver-dashboard')}
              >
                Driver Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-green-600 text-2xl mb-3">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Save Money
            </h3>
            <p className="text-gray-600">
              Our competitive bidding system ensures you get the best prices. 
              No surge pricing, just fair market rates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-blue-600 text-2xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Choose Your Driver
            </h3>
            <p className="text-gray-600">
              See driver bids, ratings, and vehicle info. 
              Pick the best option for your needs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-purple-600 text-2xl mb-3">🛡️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Transparent Pricing
            </h3>
            <p className="text-gray-600">
              See exactly what you're paying for. 
              No hidden fees or surprise charges.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-yellow-600 text-2xl mb-3">⭐</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Support Local Drivers
            </h3>
            <p className="text-gray-600">
              Help independent drivers and local taxi companies 
              compete with fair commission rates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-red-600 text-2xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fast & Reliable
            </h3>
            <p className="text-gray-600">
              Quick driver matching with real-time tracking 
              and professional service.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-indigo-600 text-2xl mb-3">📱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Mobile Optimized
            </h3>
            <p className="text-gray-600">
              Seamless experience across web and mobile. 
              Book rides anytime, anywhere.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to experience better rides?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of riders who are saving money and supporting local drivers 
            with our innovative bidding platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="primary" 
              size="large"
              onClick={() => navigate('/request-ride')}
              className="px-8"
            >
              Book Your First Ride
            </Button>
            <Button 
              variant="outline" 
              size="large"
              onClick={() => navigate('/compare')}
              className="px-8"
            >
              Compare Prices
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 