import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRiderOnboarding } from '../../../contexts/RiderOnboardingContext';
import Button from '../../common/Button';
import Input from '../../common/Input';
import toast from 'react-hot-toast';

const RiderPaymentMethodForm = () => {
  const { riderProfile, updateStep, goToNextStep, goToPreviousStep, saving, ONBOARDING_STEPS } = useRiderOnboarding();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddCard, setShowAddCard] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      cardNumber: '',
      cardholderName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      billingZip: ''
    }
  });

  useEffect(() => {
    if (riderProfile?.paymentMethods) {
      setPaymentMethods(riderProfile.paymentMethods);
      setShowAddCard(riderProfile.paymentMethods.length === 0);
    }
  }, [riderProfile]);

  const getCardType = (number) => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    return 'Card';
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const onSubmit = async (data) => {
    const cardType = getCardType(data.cardNumber);
    const last4 = data.cardNumber.replace(/\s/g, '').slice(-4);

    const newCard = {
      id: `card_${Date.now()}`,
      type: 'card',
      cardType: cardType,
      cardNumber: `****${last4}`,
      last4: last4,
      cardholderName: data.cardholderName,
      expiryDate: `${data.expiryMonth}/${data.expiryYear}`,
      billingZip: data.billingZip,
      isDefault: paymentMethods.length === 0,
      addedAt: new Date().toISOString()
    };

    const updatedMethods = [...paymentMethods, newCard];
    setPaymentMethods(updatedMethods);

    const result = await updateStep(ONBOARDING_STEPS.PAYMENT_METHOD, {
      paymentMethods: updatedMethods
    });

    if (result.success) {
      toast.success('Payment method added!');
      reset();
      setShowAddCard(false);
    } else {
      toast.error('Failed to add payment method');
    }
  };

  const handleContinue = async () => {
    if (paymentMethods.length === 0) {
      toast.error('Please add at least one payment method');
      return;
    }
    goToNextStep();
  };

  const handleRemoveCard = async (cardId) => {
    const updatedMethods = paymentMethods.filter(card => card.id !== cardId);
    setPaymentMethods(updatedMethods);

    await updateStep(ONBOARDING_STEPS.PAYMENT_METHOD, {
      paymentMethods: updatedMethods
    });

    toast.success('Payment method removed');
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Method</h1>
          <p className="text-gray-600">
            Add a payment method to complete bookings quickly and securely.
          </p>
        </div>

        <div className="space-y-6">
          {/* Existing Cards */}
          {paymentMethods.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Your Payment Methods</h3>
              {paymentMethods.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{card.cardType}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{card.cardholderName}</p>
                      <p className="text-sm text-gray-600">
                        {card.cardType} ending in {card.last4} • Expires {card.expiryDate}
                      </p>
                    </div>
                    {card.isDefault && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveCard(card.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Card Button */}
          {!showAddCard && (
            <Button
              variant="outline"
              onClick={() => setShowAddCard(true)}
              className="w-full"
            >
              + Add Another Card
            </Button>
          )}

          {/* Add Card Form */}
          {showAddCard && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900">Add Payment Method</h3>

              <Input
                label="Card Number"
                required
                {...register('cardNumber', {
                  required: 'Card number is required',
                  pattern: {
                    value: /^[\d\s]{13,19}$/,
                    message: 'Please enter a valid card number'
                  }
                })}
                error={errors.cardNumber?.message}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                onChange={(e) => {
                  e.target.value = formatCardNumber(e.target.value);
                }}
              />

              <Input
                label="Cardholder Name"
                required
                {...register('cardholderName', { required: 'Cardholder name is required' })}
                error={errors.cardholderName?.message}
                placeholder="John Doe"
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('expiryMonth', { required: 'Required' })}
                    className="input-field"
                  >
                    <option value="">MM</option>
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('expiryYear', { required: 'Required' })}
                    className="input-field"
                  >
                    <option value="">YYYY</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="CVV"
                  required
                  {...register('cvv', {
                    required: 'CVV is required',
                    pattern: {
                      value: /^\d{3,4}$/,
                      message: 'Invalid CVV'
                    }
                  })}
                  error={errors.cvv?.message}
                  placeholder="123"
                  maxLength="4"
                  type="password"
                />
              </div>

              <Input
                label="Billing ZIP Code"
                required
                {...register('billingZip', {
                  required: 'Billing ZIP is required',
                  pattern: {
                    value: /^\d{5}$/,
                    message: 'Invalid ZIP code'
                  }
                })}
                error={errors.billingZip?.message}
                placeholder="12345"
                maxLength="5"
              />

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  disabled={saving}
                >
                  Add Card
                </Button>
                {paymentMethods.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddCard(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}

          {/* Security Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900 mb-1">
                  Your payment is secure
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Your card information is encrypted</li>
                  <li>• We never store your CVV</li>
                  <li>• You'll only be charged after completing a ride</li>
                  <li>• You can update or remove cards anytime</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={saving}
            >
              ← Back
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleContinue}
              disabled={paymentMethods.length === 0}
            >
              Continue →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderPaymentMethodForm;

