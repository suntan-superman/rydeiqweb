/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSuperAdmin } from '../services/authService';
import Button from '../components/common/Button';
import SuperUserHelper from '../components/dev/SuperUserHelper';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  
  // Check if user is super admin
  const isSuperUser = isSuperAdmin(user);
  
  // Handle admin access
  const handleAdminAccess = () => {
    // Use /admin in development for convenience, /admin-dashboard in production
    const adminRoute = process.env.NODE_ENV === 'development' ? '/admin' : '/admin-dashboard';
    navigate(adminRoute);
  };
  
  // Handle super user activation (click on logo area or keyboard shortcut)
  const handleSuperUserActivation = () => {
    if (isSuperUser) {
      setShowAdminAccess(!showAdminAccess);
    }
  };

  // Keyboard shortcut for super users (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isSuperUser && event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        handleSuperUserActivation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSuperUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Super User Admin Access */}
          {isSuperUser && (
            <div className="absolute top-4 right-4 z-10">
              <div 
                className="cursor-pointer p-2 rounded-full bg-gray-800 bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
                onClick={handleSuperUserActivation}
                title="Super User: Click to toggle admin access"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              
              {showAdminAccess && (
                <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-48">
                  <div className="text-sm font-medium text-gray-900 mb-2">Super User Access</div>
                  <Button
                    onClick={handleAdminAccess}
                    variant="primary"
                    size="sm"
                    className="w-full"
                  >
                    🚀 Access Admin Dashboard
                  </Button>
                  <div className="text-xs text-gray-500 mt-2">
                    Full administrative privileges
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="text-center">
            <h1 
              className={`text-4xl md:text-6xl font-bold text-gray-900 mb-6 ${isSuperUser ? 'cursor-pointer select-none' : ''}`}
              onClick={isSuperUser ? handleSuperUserActivation : undefined}
              title={isSuperUser ? "Super User: Click to access admin functions" : undefined}
            >
              Smart Ride Comparisons
              <span className="block text-primary-600">Save Money Every Trip</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Compare prices from Uber, Lyft, and local providers in real-time. 
              Find the best deal for your journey and save money on every ride.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => window.location.href = '/compare'}
                variant="primary"
                size="large"
                className="w-full sm:w-auto"
              >
                Compare Rides Now
              </Button>
              <Button
                onClick={() => window.location.href = '/register'}
                variant="outline"
                size="large"
                className="w-full sm:w-auto"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AnyRyde?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to make smarter transportation decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-lg bg-gray-50">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Save Money</h3>
              <p className="text-gray-600">
                Compare prices across all major ride-sharing platforms and local providers to find the best deal.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-lg bg-gray-50">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
              <p className="text-gray-600">
                Get live pricing and availability updates from all providers to make informed decisions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-lg bg-gray-50">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Analytics</h3>
              <p className="text-gray-600">
                Track your savings over time and discover patterns in your travel habits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get the Full Experience
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Download our mobile app for the complete AnyRyde experience with advanced features and real-time notifications.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a
                href="#"
                className="flex items-center space-x-3 bg-black hover:bg-gray-800 text-white rounded-lg px-6 py-3 transition-colors"
              >
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <div className="text-left">
                  <div className="text-sm text-gray-300">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </a>
              
              <a
                href="#"
                className="flex items-center space-x-3 bg-black hover:bg-gray-800 text-white rounded-lg px-6 py-3 transition-colors"
              >
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.496 12l2.202-2.491zM5.864 2.658L16.802 8.99l-2.303 2.302L5.864 2.658z"/>
                </svg>
                <div className="text-left">
                  <div className="text-sm text-gray-300">Get it on</div>
                  <div className="text-lg font-semibold">Google Play</div>
                </div>
              </a>
            </div>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                🚀 <strong>Mobile app features:</strong> Real-time tracking, push notifications, saved locations, trip history, and more!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Smart Travelers
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">50K+</div>
              <div className="text-gray-600">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">$2M+</div>
              <div className="text-gray-600">Money Saved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">1M+</div>
              <div className="text-gray-600">Rides Compared</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">4.8★</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Save on Your Next Ride?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of smart travelers who use AnyRyde to save money on every trip.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.href = '/register'}
              variant="secondary"
              size="large"
              className="w-full sm:w-auto"
            >
              Get Started Free
            </Button>
            <Button
              onClick={() => window.location.href = '/compare'}
              variant="outline"
              size="large"
              className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600"
            >
              Try It Now
            </Button>
            {/* Super User Quick Admin Access */}
            {isSuperUser && (
              <Button
                onClick={handleAdminAccess}
                variant="outline"
                size="large"
                className="w-full sm:w-auto border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900"
                title="Super User: Quick access to admin dashboard"
              >
                ⚡ Admin Access
              </Button>
            )}
          </div>
          {/* Super User Hint */}
          {isSuperUser && (
            <div className="mt-6 text-yellow-300 text-sm opacity-75">
              💡 Super User: Press Ctrl+Shift+A or click the title for quick admin access
            </div>
          )}
        </div>
      </section>
      
      {/* Development Helper */}
      {/* <SuperUserHelper /> */}
    </div>
  );
};

export default HomePage; 