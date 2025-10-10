import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../common/Button';
import confetti from 'canvas-confetti';

const RiderOnboardingComplete = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Celebrate with confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            You're All Set! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Welcome to AnyRyde, {user?.firstName || user?.displayName}!
          </p>
          
          <p className="text-gray-600 max-w-lg mx-auto">
            Your profile is complete and you're ready to start booking rides. Let's get you moving!
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-gradient-primary bg-opacity-10 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h2>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Book Your First Ride</h3>
                  <p className="text-sm text-gray-600">Enter your destination and get matched with nearby drivers</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Compare Driver Bids</h3>
                  <p className="text-sm text-gray-600">Review offers from multiple drivers and choose the best one</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Track Your Ride</h3>
                  <p className="text-sm text-gray-600">See your driver's location in real-time and get ETA updates</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Pro Tips
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Add multiple payment methods for backup</li>
                  <li>• Set your home address for quick bookings</li>
                  <li>• Rate your drivers to help the community</li>
                  <li>• Update your preferences anytime from your profile</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="primary"
            size="large"
            className="w-full"
          >
            Go to Dashboard
          </Button>

          <Button
            onClick={() => navigate('/request-ride')}
            variant="outline"
            size="large"
            className="w-full"
          >
            Book Your First Ride 🚗
          </Button>

          <Button
            onClick={() => navigate('/profile')}
            variant="ghost"
            size="large"
            className="w-full"
          >
            View Profile
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? Visit our <a href="/contact" className="text-primary-600 hover:underline">Help Center</a>
        </p>
      </div>
    </div>
  );
};

export default RiderOnboardingComplete;

