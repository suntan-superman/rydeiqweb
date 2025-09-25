import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';
import DateInput from '../common/DateInput';

const PaymentInfoCard = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const handleSavePayment = async () => {
    setLoading(true);
    try {
      // TODO: Implement payment info saving
      console.log('Saving payment info...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving payment info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPaymentInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
        <Button
          size="small"
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Add/Edit'}
        </Button>
      </div>

      {!isEditing ? (
        user?.paymentMethod ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="text-green-600 text-2xl">💳</div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-green-900">
                    {user.paymentMethod.type === 'credit_card' ? 'Credit Card' : user.paymentMethod.type}
                  </h3>
                  <p className="text-sm text-green-700">
                    {user.paymentMethod.last4 ? `****${user.paymentMethod.last4}` : 
                     user.paymentMethod.cardNumber ? `****${user.paymentMethod.cardNumber.slice(-4)}` : 
                     'Payment method on file'}
                  </p>
                  {user.paymentMethod.name && (
                    <p className="text-sm text-green-600">
                      {user.paymentMethod.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                size="small"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit Payment Method
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Method</h3>
            <p className="text-gray-600 mb-4">
              Add a payment method to start booking rides
            </p>
            <Button onClick={() => setIsEditing(true)}>
              Add Payment Method
            </Button>
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <Input
              value={paymentInfo.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <DateInput
                value={paymentInfo.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <Input
                value={paymentInfo.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                placeholder="123"
                maxLength={4}
                type="password"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Billing Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <Input
                  value={paymentInfo.billingAddress}
                  onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <Input
                    value={paymentInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <Input
                    value={paymentInfo.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <Input
                    value={paymentInfo.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSavePayment}
              loading={loading}
              disabled={loading}
              size="small"
            >
              Save Payment Method
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              size="small"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentInfoCard;
