import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

const DriverOnboardingCard = () => {
  const { user } = useAuth();

  // Check if user already has driver profile
  const hasDriverProfile = user?.userTypes?.includes('driver');

  if (hasDriverProfile) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚗</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Driver Profile Active</h3>
          <p className="text-gray-600 mb-4">
            You already have a driver profile. Switch to driver mode to start earning.
          </p>
          <Link to="/driver-dashboard">
            <Button className="w-full">
              Go to Driver Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚗</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Become a Driver</h3>
        <p className="text-gray-600 mb-6">
          Start earning money by driving with AnyRyde. Set your own prices and keep more of what you earn.
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-green-900 mb-2 text-center">Why Drive with AnyRyde?</h4>
          <ul className="text-sm text-green-800 space-y-1 text-center">
            <li>• Set your own prices</li>
            <li>• Keep more of your earnings</li>
            <li>• Work on your own schedule</li>
            <li>• Choose your passengers</li>
          </ul>
        </div>

        {/* <div className="space-y-3">
          <Link to="/register" state={{ userType: 'driver' }}>
            <Button className="w-full">
              Add Driver Profile
            </Button>
          </Link>
          <p className="text-xs text-gray-500">
            This will add a driver profile to your existing account
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default DriverOnboardingCard;
