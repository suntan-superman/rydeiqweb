import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';

/**
 * Stripe Payment Form Component
 * Handles secure payment collection using Stripe Elements
 * 
 * @param {Object} props
 * @param {Object} props.rideData - Ride information including amount, rideId, driverId
 * @param {Function} props.onPaymentSuccess - Callback when payment succeeds
 * @param {Function} props.onPaymentError - Callback when payment fails
 * @param {Function} props.onCancel - Callback when user cancels
 */
const StripePaymentForm = ({ rideData, onPaymentSuccess, onPaymentError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const functions = getFunctions();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);

  const {
    amount,
    rideId,
    driverId,
    pickup,
    destination,
    rideType = 'standard',
    metadata = {}
  } = rideData;

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
        const result = await createPaymentIntentFn({
          amount,
          rideId,
          driverId,
          metadata: {
            rideType,
            pickup: pickup?.address || 'Unknown',
            destination: destination?.address || 'Unknown',
            ...metadata
          }
        });

        if (result.data.success) {
          setPaymentIntent(result.data);
          console.log('✅ Payment intent created:', result.data.paymentIntentId);
        } else {
          throw new Error('Failed to create payment intent');
        }

      } catch (error) {
        console.error('❌ Error creating payment intent:', error);
        setErrorMessage('Failed to initialize payment. Please try again.');
        onPaymentError?.(error);
      }
    };

    if (amount && rideId && driverId) {
      createPaymentIntent();
    }
  }, [amount, rideId, driverId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required', // Only redirect if 3D Secure is required
      });

      if (error) {
        // Payment failed
        console.error('❌ Payment error:', error);
        setErrorMessage(error.message);
        toast.error('Payment failed: ' + error.message);
        onPaymentError?.(error);
      } else if (confirmedPaymentIntent && confirmedPaymentIntent.status === 'succeeded') {
        // Payment succeeded!
        console.log('✅ Payment succeeded:', confirmedPaymentIntent.id);
        toast.success('Payment successful!');
        onPaymentSuccess?.({
          paymentIntentId: confirmedPaymentIntent.id,
          amount: confirmedPaymentIntent.amount / 100,
          status: confirmedPaymentIntent.status
        });
      } else {
        // Payment requires additional action (3D Secure, etc.)
        console.log('⏳ Payment requires action:', confirmedPaymentIntent?.status);
        setErrorMessage('Payment requires additional verification');
      }

    } catch (error) {
      console.error('❌ Payment submission error:', error);
      setErrorMessage('An error occurred while processing your payment');
      toast.error('Payment processing failed');
      onPaymentError?.(error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render until payment intent is created
  if (!paymentIntent) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Initializing payment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Payment Summary */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Details</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Ride Type</span>
            <span className="font-medium text-gray-900 capitalize">{rideType}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">From</span>
            <span className="font-medium text-gray-900 text-right max-w-xs truncate">
              {pickup?.address || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">To</span>
            <span className="font-medium text-gray-900 text-right max-w-xs truncate">
              {destination?.address || 'Unknown'}
            </span>
          </div>
          
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount</span>
              <span className="text-2xl font-bold text-blue-600">
                ${amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Payment Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <PaymentElement 
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
                radios: true,
                spacedAccordionItems: false
              }
            }}
          />
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Pay ${amount.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Security Badge */}
      <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>Secured by Stripe • Your payment information is encrypted</span>
      </div>
    </div>
  );
};

export default StripePaymentForm;

