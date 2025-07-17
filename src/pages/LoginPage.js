/* eslint-disable */
import React from 'react';
import LoginForm from '../components/forms/LoginForm';

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
      </div>
    </div>
  );
};

export default LoginPage; 