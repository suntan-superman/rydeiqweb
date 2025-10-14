import React, { useState } from 'react';

const RiderOptInModal = ({ isOpen, onConfirm, onSkip, driverData }) => {
  const [optIn, setOptIn] = useState(true);
  const [paymentOption, setPaymentOption] = useState('later');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(optIn, paymentOption);
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-xl">
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-white">
                Become a Rider Too!
              </h2>
              <p className="text-green-50 mt-2 text-sm">
                Your driver profile has everything we need
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Opt-in Toggle */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 transition-all hover:border-green-300">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={optIn}
                  onChange={(e) => setOptIn(e.target.checked)}
                  className="mt-1 mr-3 h-5 w-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    Yes, create my rider account
                  </div>
                  <div className="text-sm text-gray-600">
                    Use AnyRyde for your personal transportation needs
                  </div>
                </div>
              </label>
            </div>

            {optIn && (
              <div className="space-y-4 animate-fadeIn">
                {/* Benefits Section */}
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Why Dual Account?
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon: '🚗', text: 'Book rides when you don\'t want to drive' },
                      { icon: '🧪', text: 'Test the rider experience yourself' },
                      { icon: '🔄', text: 'Same account, easy mode switching' },
                      { icon: '💳', text: 'Add payment method when booking first ride' },
                      { icon: '🍺', text: 'Perfect for nights out or special occasions' },
                      { icon: '🔧', text: 'Use rides when your car is in the shop' }
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-start text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-100">
                        <span className="text-lg mr-3 flex-shrink-0">{benefit.icon}</span>
                        <span className="pt-0.5">{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Options */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                    Payment Method (Optional)
                  </div>
                  <div className="space-y-2.5">
                    <label className="flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 hover:border-green-300"
                           style={{
                             borderColor: paymentOption === 'later' ? '#10b981' : '#e5e7eb',
                             backgroundColor: paymentOption === 'later' ? '#f0fdf4' : 'white'
                           }}>
                      <input
                        type="radio"
                        name="payment"
                        value="later"
                        checked={paymentOption === 'later'}
                        onChange={(e) => setPaymentOption(e.target.value)}
                        className="mt-0.5 mr-3 h-4 w-4 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 flex items-center">
                          Add when booking first ride
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                            Recommended
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-1.5 items-center">
                          <span>Use</span>
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded">
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                            </svg>
                            Apple Pay
                          </span>
                          <span>,</span>
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded">
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M12 2L2 7v3h20V7z"/>
                            </svg>
                            Google Pay
                          </span>
                          <span>or credit card</span>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 hover:border-green-300"
                           style={{
                             borderColor: paymentOption === 'driver_account' ? '#10b981' : '#e5e7eb',
                             backgroundColor: paymentOption === 'driver_account' ? '#f0fdf4' : 'white'
                           }}>
                      <input
                        type="radio"
                        name="payment"
                        value="driver_account"
                        checked={paymentOption === 'driver_account'}
                        onChange={(e) => setPaymentOption(e.target.value)}
                        className="mt-0.5 mr-3 h-4 w-4 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          Link to driver payout account
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          For refunds and credits (you'll still add a payment method)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <strong className="font-semibold">No extra steps!</strong> We'll use your existing name, email, phone, and address. You're all set to go.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!optIn && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 animate-fadeIn">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    No problem! You can always add rider capabilities later from your dashboard settings.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Continue as Driver Only
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {optIn ? (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Create Both Accounts
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default RiderOptInModal;

