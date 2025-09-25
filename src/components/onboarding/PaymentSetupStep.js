import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useOnboarding, ONBOARDING_STEPS } from '../../contexts/OnboardingContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import OnboardingProgress from './OnboardingProgress';
import toast from 'react-hot-toast';

const PaymentSetupStep = () => {
  const { 
    formData, 
    updatePaymentMethod, 
    nextStep, 
    previousStep, 
    validateStep,
    errors
  } = useOnboarding();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setPaymentType] = useState(formData.paymentMethod.type || 'credit_card');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: formErrors },
    setValue,
    clearErrors
  } = useForm({
    defaultValues: {
      type: formData.paymentMethod.type || 'credit_card',
      cardNumber: formData.paymentMethod.cardNumber,
      expiryDate: formData.paymentMethod.expiryDate,
      cvv: formData.paymentMethod.cvv,
      cardholderName: formData.paymentMethod.cardholderName
    },
    mode: 'onChange'
  });

  // Update form data when form values change
  useEffect(() => {
    const subscription = watch((value) => {
      updatePaymentMethod(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, updatePaymentMethod]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      clearErrors();
    }
  }, [watch, clearErrors, formErrors]);

  const paymentTypeOptions = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'prepaid', label: 'Prepaid Card' }
  ];

  const handlePaymentTypeChange = (e) => {
    const newType = e.target.value;
    setPaymentType(newType);
    setValue('type', newType);
    updatePaymentMethod({ type: newType });
  };

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryDate = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (digits.length >= 2) {
      return digits.substring(0, 2) + '/' + digits.substring(2, 4);
    }
    return digits;
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Validate the step
      const isValid = validateStep(ONBOARDING_STEPS.PAYMENT_SETUP);
      
      if (!isValid) {
        toast.error('Please fill in all required fields correctly');
        return;
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Payment method saved successfully!');
      nextStep();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error('Failed to save payment method. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    previousStep();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingProgress />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Setup
            </h1>
            <p className="text-gray-600">
              A valid payment method is <strong>REQUIRED</strong> to complete rides and pay drivers
            </p>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ Payment method is MANDATORY - You cannot proceed without setting up payment
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Payment Type */}
            <Select
              label="Payment Method Type *"
              {...register('type', { 
                required: 'Payment type is required'
              })}
              error={formErrors.type?.message}
              options={paymentTypeOptions}
              onChange={handlePaymentTypeChange}
            />

            {/* Cardholder Name */}
            <Input
              label="Cardholder Name *"
              {...register('cardholderName', { 
                required: 'Cardholder name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
              error={formErrors.cardholderName?.message || errors.cardholderName}
              placeholder="Enter name as it appears on card"
            />

            {/* Card Number */}
            <Input
              label="Card Number *"
              {...register('cardNumber', { 
                required: 'Card number is required',
                pattern: {
                  value: /^[0-9\s]{13,19}$/,
                  message: 'Please enter a valid card number'
                }
              })}
              error={formErrors.cardNumber?.message || errors.cardNumber}
              placeholder="1234 5678 9012 3456"
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                setValue('cardNumber', formatted);
              }}
            />

            {/* Expiry Date and CVV */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Expiry Date *"
                {...register('expiryDate', { 
                  required: 'Expiry date is required',
                  pattern: {
                    value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                    message: 'Please enter a valid expiry date (MM/YY)'
                  }
                })}
                error={formErrors.expiryDate?.message || errors.expiryDate}
                placeholder="MM/YY"
                onChange={(e) => {
                  const formatted = formatExpiryDate(e.target.value);
                  setValue('expiryDate', formatted);
                }}
              />
              
              <Input
                label="CVV *"
                type="password"
                {...register('cvv', { 
                  required: 'CVV is required',
                  pattern: {
                    value: /^[0-9]{3,4}$/,
                    message: 'Please enter a valid CVV'
                  }
                })}
                error={formErrors.cvv?.message || errors.cvv}
                placeholder="123"
                maxLength="4"
              />
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-green-800">Secure Payment Processing</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your payment information is encrypted and processed securely. We never store your full card details on our servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Accepted Payment Methods</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                    V
                  </div>
                  <span className="text-sm text-gray-600">Visa</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                    M
                  </div>
                  <span className="text-sm text-gray-600">Mastercard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-5 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">
                    A
                  </div>
                  <span className="text-sm text-gray-600">American Express</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-5 bg-orange-600 rounded text-white text-xs flex items-center justify-center font-bold">
                    D
                  </div>
                  <span className="text-sm text-gray-600">Discover</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="min-w-[200px]"
              >
                Save Payment Method <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentSetupStep;
