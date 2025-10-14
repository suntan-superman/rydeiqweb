import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import StripePaymentForm from './StripePaymentForm';

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

/**
 * Stripe Payment Wrapper
 * Provides Stripe Elements context and handles payment intent creation
 * 
 * Usage:
 * <StripePaymentWrapper
 *   rideData={{
 *     amount: 25.50,
 *     rideId: 'ride_123',
 *     driverId: 'driver_456',
 *     pickup: { address: '123 Main St' },
 *     destination: { address: '456 Oak Ave' }
 *   }}
 *   onPaymentSuccess={(result) => console.log('Success:', result)}
 *   onPaymentError={(error) => console.error('Error:', error)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 */
const StripePaymentWrapper = ({ rideData, onPaymentSuccess, onPaymentError, onCancel }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const functions = getFunctions();

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate Stripe key
        if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
          throw new Error('Stripe publishable key not configured');
        }

        // Create payment intent via Cloud Function
        const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
        const result = await createPaymentIntentFn({
          amount: rideData.amount,
          rideId: rideData.rideId,
          driverId: rideData.driverId,
          metadata: {
            rideType: rideData.rideType || 'standard',
            pickup: rideData.pickup?.address || 'Unknown',
            destination: rideData.destination?.address || 'Unknown',
            ...rideData.metadata
          }
        });

        if (result.data.success && result.data.clientSecret) {
          setClientSecret(result.data.clientSecret);
        } else {
          throw new Error('Failed to initialize payment');
        }

      } catch (error) {
        console.error('❌ Payment initialization error:', error);
        setError(error.message);
        onPaymentError?.(error);
      } finally {
        setLoading(false);
      }
    };

    if (rideData && rideData.amount && rideData.rideId && rideData.driverId) {
      initializePayment();
    } else {
      setError('Missing required payment information');
      setLoading(false);
    }
  }, [rideData]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Initializing secure payment...</p>
          <p className="text-sm text-gray-500">Please wait while we set up your payment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Payment Initialization Failed</h3>
          <p className="text-gray-600 text-center">{error}</p>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render Stripe Elements with payment form
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          border: '1px solid #d1d5db',
          boxShadow: 'none',
        },
        '.Input:focus': {
          border: '1px solid #2563eb',
          boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
        },
        '.Label': {
          fontWeight: '500',
          marginBottom: '8px',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm
        rideData={rideData}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        onCancel={onCancel}
      />
    </Elements>
  );
};

export default StripePaymentWrapper;

