import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRide } from '../contexts/RideContext';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/rider/LocationPicker';
import FareEstimator from '../components/rider/FareEstimator';
import DriverBidsList from '../components/rider/DriverBidsList';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const RideRequestPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    pickupLocation,
    destinationLocation,
    rideType,
    specialRequests,
    setSpecialRequests,
    paymentMethod,
    setPaymentMethod,
    currentRide,
    rideStatus,
    driverBids,
    loading,
    error,
    canRequestRide,
    hasActiveRide,
    hasBids,
    biddingTimeRemaining,
    requestRide,
    selectDriver,
    cancelCurrentRide,
    RIDE_STATUS
  } = useRide();

  const [currentStep, setCurrentStep] = useState('location'); // location, preferences, confirm, bidding
  const [showSpecialRequests, setShowSpecialRequests] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=request-ride');
    }
  }, [isAuthenticated, navigate]);

  // Handle step progression
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      if (currentStep === 'location') {
        setCurrentStep('preferences');
      }
    } else {
      setCurrentStep('location');
    }
  }, [pickupLocation, destinationLocation, currentStep]);

  // Handle ride status changes
  useEffect(() => {
    if (rideStatus === RIDE_STATUS.BIDDING && currentStep !== 'bidding') {
      setCurrentStep('bidding');
    } else if (rideStatus === RIDE_STATUS.MATCHED) {
      navigate('/ride-tracking');
    }
  }, [rideStatus, currentStep, navigate]);

  const handleRequestRide = async () => {
    if (!canRequestRide) {
      toast.error('Please complete all required fields');
      return;
    }

    const result = await requestRide({
      specialRequests,
      paymentMethod
    });

    if (result.success) {
      setCurrentStep('bidding');
    }
  };

  const handleDriverSelection = async (driverId) => {
    const result = await selectDriver(driverId);
    if (result.success) {
      // Will redirect via useEffect when status changes to 'matched'
    }
  };

  const handleCancelRide = async () => {
    const confirmed = window.confirm('Are you sure you want to cancel this ride request?');
    if (confirmed) {
      const result = await cancelCurrentRide('Customer cancelled request');
      if (result.success) {
        setCurrentStep('location');
      }
    }
  };

  const formatTimeRemaining = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Special request options
  const specialRequestOptions = [
    { id: 'quiet_ride', label: 'Quiet ride (minimal conversation)', icon: '🤫' },
    { id: 'music_requests', label: 'Allow music requests', icon: '🎵' },
    { id: 'pet_friendly', label: 'Pet-friendly driver', icon: '🐕' },
    { id: 'wheelchair_accessible', label: 'Wheelchair accessible', icon: '♿' },
    { id: 'child_seat', label: 'Child car seat needed', icon: '👶' },
    { id: 'extra_stops', label: 'Multiple stops allowed', icon: '📍' },
    { id: 'help_with_bags', label: 'Help with luggage/bags', icon: '🧳' },
    { id: 'phone_charger', label: 'Phone charger available', icon: '🔌' }
  ];

  const paymentOptions = [
    { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { id: 'cash', label: 'Cash Payment', icon: '💵' },
    { id: 'paypal', label: 'PayPal', icon: '🅿️' }
  ];

  if (!isAuthenticated) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Request a Ride</h1>
          <p className="text-gray-600 mt-1">
            Book your ride with competitive driver bids
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 ${currentStep === 'location' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'location' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
              <span className="font-medium">Location</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'preferences' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['preferences', 'confirm', 'bidding'].includes(currentStep) ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
              <span className="font-medium">Preferences</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['confirm', 'bidding'].includes(currentStep) ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
              <span className="font-medium">Confirm</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'bidding' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'bidding' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>4</div>
              <span className="font-medium">Driver Bids</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Location Selection */}
          {(currentStep === 'location' || currentStep === 'preferences') && (
            <LocationPicker onLocationsSet={() => setCurrentStep('preferences')} />
          )}

          {/* Step 2: Ride Preferences */}
          {(currentStep === 'preferences' || currentStep === 'confirm') && pickupLocation && destinationLocation && (
            <>
              <FareEstimator onRideTypeChange={() => {}} />
              
              {/* Special Requests */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Special Requests</h3>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setShowSpecialRequests(!showSpecialRequests)}
                  >
                    {showSpecialRequests ? 'Hide' : 'Show'} Options
                  </Button>
                </div>
                
                {showSpecialRequests && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {specialRequestOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={specialRequests.includes(option.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSpecialRequests([...specialRequests, option.id]);
                            } else {
                              setSpecialRequests(specialRequests.filter(req => req !== option.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-lg">{option.icon}</span>
                        <span className="text-gray-900">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {specialRequests.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700">
                      <strong>Selected requests:</strong> {specialRequests.length} special request{specialRequests.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {paymentOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.id}
                        checked={paymentMethod === option.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {currentStep === 'preferences' && (
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('location')}
                    className="flex-1"
                  >
                    Back to Locations
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep('confirm')}
                    className="flex-1"
                  >
                    Review Request
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 'confirm' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Your Ride Request</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pickup</label>
                    <p className="text-gray-900">{pickupLocation?.address}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Destination</label>
                    <p className="text-gray-900">{destinationLocation?.address}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ride Type</label>
                    <p className="text-gray-900 capitalize">{rideType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-gray-900 capitalize">{paymentMethod}</p>
                  </div>
                </div>
                
                {specialRequests.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                    <p className="text-gray-900">{specialRequests.length} request{specialRequests.length !== 1 ? 's' : ''} selected</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('preferences')}
                  className="flex-1"
                >
                  Edit Preferences
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRequestRide}
                  loading={loading}
                  className="flex-1"
                >
                  Request Ride
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Driver Bidding */}
          {currentStep === 'bidding' && (
            <>
              {/* Bidding Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">
                      Waiting for Driver Bids
                    </h3>
                    <p className="text-blue-700">
                      Drivers are submitting their offers for your ride
                    </p>
                  </div>
                  <div className="text-right">
                    {biddingTimeRemaining > 0 ? (
                      <div className="text-2xl font-bold text-blue-900">
                        {formatTimeRemaining(biddingTimeRemaining)}
                      </div>
                    ) : (
                      <div className="text-lg font-medium text-blue-700">
                        Bidding Closed
                      </div>
                    )}
                    <div className="text-sm text-blue-600">
                      {hasBids ? `${driverBids.length} bid${driverBids.length !== 1 ? 's' : ''} received` : 'No bids yet'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleCancelRide}
                    loading={loading}
                  >
                    Cancel Request
                  </Button>
                  {hasBids && (
                    <Button
                      variant="primary"
                      onClick={() => {}}
                      disabled={true}
                    >
                      Choose from {driverBids.length} bid{driverBids.length !== 1 ? 's' : ''} below
                    </Button>
                  )}
                </div>
              </div>

              {/* Driver Bids List */}
              {hasBids && (
                <DriverBidsList
                  bids={driverBids}
                  onSelectDriver={handleDriverSelection}
                  loading={loading}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideRequestPage; 