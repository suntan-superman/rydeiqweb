/* eslint-disable */
import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/forms/LoginForm';
import DomainVerificationTest from '../components/debug/DomainVerificationTest';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome back to AnyRyde
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your account to continue comparing rides and saving money
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
        
        {/* Sign Up Section */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">New to AnyRyde?</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/onboarding"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create New Account
              </span>
            </Link>
          </div>
          
          <p className="mt-3 text-center text-xs text-gray-500">
            Join thousands of riders saving money with competitive driver bids
          </p>
        </div>
      </div>
      
      {/* Domain Verification Test - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <DomainVerificationTest />
        </div>
      )}
    </div>
  );
};

export default LoginPage; 