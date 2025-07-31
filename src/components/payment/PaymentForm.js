import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createPaymentIntent, processPayment, PAYMENT_CONFIG } from '../../services/paymentService';
import { checkStripeAvailability } from '../../services/stripeValidationService';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const PaymentForm = ({ 
  rideData, 
  onPaymentSuccess, 
  onPaymentError,
  showCommissionBreakdown = true 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(isPaymentEnabled ? 'card' : 'cash');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [billingAddress, setBillingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  
  // Check if Stripe is available
  const stripeStatus = checkStripeAvailability();
  const isPaymentEnabled = stripeStatus.isAvailable;

  const {
    amount,
    rideId,
    driverId,
    estimatedFare,
    specialRequests = [],
    rideType = 'standard'
  } = rideData;

  // Calculate commission and breakdown
  const commissionRate = PAYMENT_CONFIG.commissionRates[rideType] || PAYMENT_CONFIG.commissionRates.standard;
  const commissionAmount = amount * commissionRate;
  const driverAmount = amount - commissionAmount;
  const finalAmount = amount;

  // Payment method options (filter based on Stripe availability)
  const paymentMethods = isPaymentEnabled ? [
    { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { id: 'digital_wallet', label: 'Digital Wallet', icon: '📱' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { id: 'cash', label: 'Cash Payment', icon: '💵' }
  ] : [
    { id: 'cash', label: 'Cash Payment', icon: '💵' }
  ];

  // Initialize payment intent when component mounts
  useEffect(() => {
    if (amount && rideId && isPaymentEnabled) {
      initializePayment();
    }
  }, [amount, rideId, isPaymentEnabled]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      const result = await createPaymentIntent({
        amount: finalAmount,
        customerId: user.uid,
        rideId,
        paymentMethod,
        metadata: {
          customerEmail: user.email,
          rideType,
          specialRequests: specialRequests.join(', '),
          driverId
        }
      });

      if (result.success) {
        setPaymentIntent(result.data);
      } else {
        toast.error('Failed to initialize payment');
        onPaymentError?.(result.error);
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast.error('Payment initialization failed');
      onPaymentError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'cash') {
      // For cash payments, we don't need payment intent
      setPaymentIntent(null);
    } else {
      initializePayment();
    }
  };

  const handleCardInputChange = (field, value) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBillingAddressChange = (field, value) => {
    setBillingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (paymentMethod === 'card') {
      if (!cardData.number || !cardData.expiry || !cardData.cvc || !cardData.name) {
        toast.error('Please fill in all card details');
        return false;
      }
      if (!billingAddress.line1 || !billingAddress.city || !billingAddress.state || !billingAddress.zipCode) {
        toast.error('Please fill in billing address');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (paymentMethod === 'cash') {
        // Handle cash payment
        const result = await processPayment(rideId, {
          amount: finalAmount,
          paymentMethod: 'cash',
          customerId: user.uid,
          driverId,
          metadata: {
            customerEmail: user.email,
            rideType,
            specialRequests: specialRequests.join(', '),
            paymentType: 'cash_on_delivery'
          }
        });

        if (result.success) {
          toast.success('Cash payment recorded successfully');
          onPaymentSuccess?.(result.data);
        } else {
          toast.error('Failed to process cash payment');
          onPaymentError?.(result.error);
        }
      } else {
        // Handle card/digital payment
        if (!paymentIntent) {
          toast.error('Payment not initialized');
          return;
        }

        // In production, this would integrate with Stripe Elements
        // For now, we'll simulate the payment processing
        const result = await processPayment(rideId, {
          paymentIntentId: paymentIntent.id,
          amount: finalAmount,
          paymentMethod,
          customerId: user.uid,
          driverId,
          metadata: {
            customerEmail: user.email,
            rideType,
            specialRequests: specialRequests.join(', '),
            cardLast4: cardData.number.slice(-4),
            billingAddress
          }
        });

        if (result.success) {
          toast.success('Payment processed successfully');
          onPaymentSuccess?.(result.data);
        } else {
          toast.error('Payment failed');
          onPaymentError?.(result.error);
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment processing failed');
      onPaymentError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Show disabled state if Stripe is not available
  if (!isPaymentEnabled) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment System Unavailable</h3>
          <p className="text-gray-600 mb-4">
            Payment functionality is currently disabled due to missing or invalid Stripe configuration.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800 font-medium mb-2">Configuration Issue:</p>
            <p className="text-sm text-yellow-700">{stripeStatus.reason}</p>
            <div className="mt-3 text-sm text-yellow-700">
              <p className="font-medium">To enable payments:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Add valid Stripe API keys to your .env file</li>
                <li>Use format: REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...</li>
                <li>Use format: REACT_APP_STRIPE_SECRET_KEY=sk_test_...</li>
                <li>Restart the application after adding keys</li>
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              For now, only cash payments are available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !paymentIntent) {
    return <LoadingSpinner message="Initializing payment..." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
      
      {/* Commission Breakdown */}
      {showCommissionBreakdown && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Payment Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ride Fare:</span>
              <span className="font-medium">${estimatedFare?.toFixed(2) || amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Commission ({Math.round(commissionRate * 100)}%):</span>
              <span className="font-medium text-red-600">-${commissionAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Driver Earnings:</span>
              <span className="font-medium text-green-600">${driverAmount.toFixed(2)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-gray-900">Total Amount:</span>
              <span className="text-gray-900">${finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-2xl">{method.icon}</span>
                <span className="font-medium text-gray-900 text-sm">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Card Details */}
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <Input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardData.number}
                onChange={(e) => handleCardInputChange('number', formatCardNumber(e.target.value))}
                maxLength="19"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <Input
                  type="text"
                  placeholder="MM/YY"
                  value={cardData.expiry}
                  onChange={(e) => handleCardInputChange('expiry', formatExpiry(e.target.value))}
                  maxLength="5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVC
                </label>
                <Input
                  type="text"
                  placeholder="123"
                  value={cardData.cvc}
                  onChange={(e) => handleCardInputChange('cvc', e.target.value.replace(/\D/g, ''))}
                  maxLength="4"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={cardData.name}
                onChange={(e) => handleCardInputChange('name', e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Billing Address */}
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Billing Address</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1
              </label>
              <Input
                type="text"
                placeholder="123 Main St"
                value={billingAddress.line1}
                onChange={(e) => handleBillingAddressChange('line1', e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2 (Optional)
              </label>
              <Input
                type="text"
                placeholder="Apt, suite, etc."
                value={billingAddress.line2}
                onChange={(e) => handleBillingAddressChange('line2', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <Input
                  type="text"
                  placeholder="New York"
                  value={billingAddress.city}
                  onChange={(e) => handleBillingAddressChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <Input
                  type="text"
                  placeholder="NY"
                  value={billingAddress.state}
                  onChange={(e) => handleBillingAddressChange('state', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <Input
                  type="text"
                  placeholder="10001"
                  value={billingAddress.zipCode}
                  onChange={(e) => handleBillingAddressChange('zipCode', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={billingAddress.country}
                  onChange={(e) => handleBillingAddressChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Save Payment Method */}
        {paymentMethod === 'card' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="savePaymentMethod"
              checked={savePaymentMethod}
              onChange={(e) => setSavePaymentMethod(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="savePaymentMethod" className="ml-2 block text-sm text-gray-900">
              Save this payment method for future rides
            </label>
          </div>
        )}

        {/* Payment Button */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Processing Payment...</span>
              </div>
            ) : (
              `Pay $${finalAmount.toFixed(2)}`
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <span>🔒</span>
            <span>Your payment information is secure and encrypted</span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm; 