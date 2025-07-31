import React, { useState, useEffect } from 'react';
import { validateEnvironment } from '../../services/stripeValidationService';
import Button from '../common/Button';

const StripeConfigurationStatus = () => {
  const [configStatus, setConfigStatus] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const status = validateEnvironment();
    setConfigStatus(status);
  }, []);

  if (!configStatus) {
    return <div>Loading configuration status...</div>;
  }

  const { stripe, paymentEnabled, warnings, recommendations } = configStatus;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Payment System Configuration</h3>
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="secondary"
          size="sm"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>

      {/* Status Overview */}
      <div className={`flex items-center p-4 rounded-lg mb-4 ${
        paymentEnabled 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className={`w-4 h-4 rounded-full mr-3 ${
          paymentEnabled ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <div>
          <p className={`font-medium ${
            paymentEnabled ? 'text-green-800' : 'text-red-800'
          }`}>
            Payment System: {paymentEnabled ? 'Enabled' : 'Disabled'}
          </p>
          <p className={`text-sm ${
            paymentEnabled ? 'text-green-700' : 'text-red-700'
          }`}>
            {paymentEnabled 
              ? 'All payment methods are available' 
              : 'Only cash payments are available'
            }
          </p>
        </div>
      </div>

      {/* Stripe Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={`p-4 rounded-lg border ${
          stripe.publishableKey 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              stripe.publishableKey ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              stripe.publishableKey ? 'text-green-800' : 'text-red-800'
            }`}>
              Publishable Key: {stripe.publishableKey ? 'Valid' : 'Invalid/Missing'}
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          stripe.secretKey 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              stripe.secretKey ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              stripe.secretKey ? 'text-green-800' : 'text-red-800'
            }`}>
              Secret Key: {stripe.secretKey ? 'Valid' : 'Invalid/Missing'}
            </span>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Configuration Warnings:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">⚠️</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Information */}
      {showDetails && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Setup Instructions</h4>
          
          <div className="space-y-4">
            {/* Environment Variables */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">Required Environment Variables</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <code className="bg-gray-200 px-2 py-1 rounded">REACT_APP_STRIPE_PUBLISHABLE_KEY</code>
                  <span className={`px-2 py-1 rounded text-xs ${
                    stripe.publishableKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stripe.publishableKey ? '✓ Set' : '✗ Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="bg-gray-200 px-2 py-1 rounded">REACT_APP_STRIPE_SECRET_KEY</code>
                  <span className={`px-2 py-1 rounded text-xs ${
                    stripe.secretKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stripe.secretKey ? '✓ Set' : '✗ Missing'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Recommendations</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">💡</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Example Configuration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">Example .env Configuration</h5>
              <pre className="text-sm bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
{`# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZA567BCD890EFG
REACT_APP_STRIPE_SECRET_KEY=sk_test_51ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZA567BCD890EFG

# For development (disable payments)
# REACT_APP_STRIPE_PUBLISHABLE_KEY=-99999
# REACT_APP_STRIPE_SECRET_KEY=-99999`}
              </pre>
            </div>

            {/* Testing Instructions */}
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-900 mb-2">Testing Payment System</h5>
              <div className="text-sm text-green-700 space-y-2">
                <p>Once configured, you can test the payment system with Stripe's test cards:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Success:</strong> 4242 4242 4242 4242</li>
                  <li><strong>Decline:</strong> 4000 0000 0000 0002</li>
                  <li><strong>Insufficient Funds:</strong> 4000 0000 0000 9995</li>
                  <li><strong>Expired Card:</strong> 4000 0000 0000 0069</li>
                </ul>
                <p className="text-xs mt-2">
                  Use any future expiry date and any 3-digit CVC.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6">
        <Button
          onClick={() => {
            const status = validateEnvironment();
            setConfigStatus(status);
            setShowDetails(true);
          }}
          variant="secondary"
        >
          Refresh Status
        </Button>
        
        {!paymentEnabled && (
          <Button
            onClick={() => {
              // In production, this could open Stripe dashboard or documentation
              window.open('https://dashboard.stripe.com/apikeys', '_blank');
            }}
            variant="primary"
          >
            Get Stripe Keys
          </Button>
        )}
      </div>
    </div>
  );
};

export default StripeConfigurationStatus; 