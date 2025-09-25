import React from 'react';
import SmartRedirect from '../components/auth/SmartRedirect';

const SmartRedirectPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SmartRedirect>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up your experience...</p>
          </div>
        </div>
      </SmartRedirect>
    </div>
  );
};

export default SmartRedirectPage;
