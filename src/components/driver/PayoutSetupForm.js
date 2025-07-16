import React, { useState, useEffect } from 'react';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import SecurityNotice from '../common/SecurityNotice';
import toast from 'react-hot-toast';

const PayoutSetupForm = () => {
  const {
    driverApplication,
    updateStep,
    goToNextStep,
    goToPreviousStep,
    saving,
    ONBOARDING_STEPS
  } = useDriverOnboarding();

  const [formData, setFormData] = useState({
    // Bank Account Information
    accountHolderName: '',
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: '',
    accountType: 'checking',
    
    // Tax Information
    taxIdType: 'ssn', // 'ssn' or 'ein'
    taxId: '',
    businessName: '',
    taxAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    useSameAddressAsPersonal: true,
    
    // Payout Preferences
    payoutFrequency: 'weekly', // 'instant', 'daily', 'weekly'
    minimumPayoutAmount: '25',
    
    // Agreements and Consents
    agreeToPayoutTerms: false,
    agreeTo1099Reporting: false,
    understandFees: false,
    consentToTaxReporting: false,
    
    // Account Verification
    verificationMethod: 'microdeposit' // 'microdeposit', 'instant'
  });

  const [errors, setErrors] = useState({});
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Load existing data
  useEffect(() => {
    if (driverApplication?.payoutInfo) {
      setFormData(prev => ({
        ...prev,
        ...driverApplication.payoutInfo
      }));
    }
    
    // Pre-fill tax address from personal info if using same address
    if (driverApplication?.personalInfo && formData.useSameAddressAsPersonal) {
      const personalInfo = driverApplication.personalInfo;
      setFormData(prev => ({
        ...prev,
        taxAddress: {
          street: personalInfo.address || '',
          city: personalInfo.city || '',
          state: personalInfo.state || '',
          zipCode: personalInfo.zipCode || ''
        }
      }));
    }
  }, [driverApplication, formData.useSameAddressAsPersonal]);

  const formatRoutingNumber = (value) => {
    // Remove all non-numeric characters and limit to 9 digits
    return value.replace(/\D/g, '').slice(0, 9);
  };

  const formatAccountNumber = (value) => {
    // Remove all non-numeric characters and limit to 17 digits
    return value.replace(/\D/g, '').slice(0, 17);
  };

  const formatTaxId = (value) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (formData.taxIdType === 'ssn') {
      // Format as SSN: XXX-XX-XXXX
      if (cleaned.length >= 9) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
      } else if (cleaned.length >= 5) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
      } else if (cleaned.length >= 3) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
      }
      return cleaned;
    } else {
      // Format as EIN: XX-XXXXXXX
      if (cleaned.length >= 9) {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 9)}`;
      } else if (cleaned.length >= 2) {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
      }
      return cleaned;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'routingNumber') {
      const formatted = formatRoutingNumber(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'accountNumber' || name === 'confirmAccountNumber') {
      const formatted = formatAccountNumber(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'taxId') {
      const formatted = formatTaxId(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name.includes('.')) {
      // Handle nested objects (tax address)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Special handling for tax ID type change
    if (name === 'taxIdType') {
      setFormData(prev => ({ ...prev, taxId: '' }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Bank Account validation
    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }
    if (!formData.routingNumber) {
      newErrors.routingNumber = 'Routing number is required';
    } else if (formData.routingNumber.length !== 9) {
      newErrors.routingNumber = 'Routing number must be 9 digits';
    }
    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length < 4) {
      newErrors.accountNumber = 'Account number must be at least 4 digits';
    }
    if (!formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Please confirm your account number';
    } else if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    // Tax Information validation
    const taxIdDigits = formData.taxId.replace(/\D/g, '');
    if (!formData.taxId) {
      newErrors.taxId = `${formData.taxIdType === 'ssn' ? 'SSN' : 'EIN'} is required`;
    } else if (formData.taxIdType === 'ssn' && taxIdDigits.length !== 9) {
      newErrors.taxId = 'SSN must be 9 digits';
    } else if (formData.taxIdType === 'ein' && taxIdDigits.length !== 9) {
      newErrors.taxId = 'EIN must be 9 digits';
    }

    if (formData.taxIdType === 'ein' && !formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required for EIN';
    }

    // Tax Address validation (if not using same as personal)
    if (!formData.useSameAddressAsPersonal) {
      if (!formData.taxAddress.street.trim()) {
        newErrors['taxAddress.street'] = 'Tax address street is required';
      }
      if (!formData.taxAddress.city.trim()) {
        newErrors['taxAddress.city'] = 'Tax address city is required';
      }
      if (!formData.taxAddress.state.trim()) {
        newErrors['taxAddress.state'] = 'Tax address state is required';
      }
      if (!formData.taxAddress.zipCode.trim()) {
        newErrors['taxAddress.zipCode'] = 'Tax address ZIP code is required';
      }
    }

    // Payout preferences validation
    const minAmount = parseFloat(formData.minimumPayoutAmount);
    if (!formData.minimumPayoutAmount) {
      newErrors.minimumPayoutAmount = 'Minimum payout amount is required';
    } else if (minAmount < 1 || minAmount > 1000) {
      newErrors.minimumPayoutAmount = 'Amount must be between $1 and $1000';
    }

    // Agreements validation
    if (!formData.agreeToPayoutTerms) {
      newErrors.agreeToPayoutTerms = 'You must agree to the payout terms';
    }
    if (!formData.agreeTo1099Reporting) {
      newErrors.agreeTo1099Reporting = 'You must agree to tax reporting requirements';
    }
    if (!formData.understandFees) {
      newErrors.understandFees = 'You must acknowledge the fee structure';
    }
    if (!formData.consentToTaxReporting) {
      newErrors.consentToTaxReporting = 'Tax reporting consent is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors below');
      return;
    }

    const result = await updateStep(ONBOARDING_STEPS.PAYOUT_SETUP, formData);
    
    if (result.success) {
      goToNextStep();
    }
  };

  const getErrorMessage = (fieldName) => {
    return errors[fieldName];
  };

  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  if (saving) {
    return <LoadingSpinner message="Saving payout information..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payout Setup</h1>
          <p className="text-gray-600">
            Set up your bank account and tax information to receive payments from rides. Your information is encrypted and secure.
          </p>
        </div>

        <SecurityNotice 
          message="Your banking information is encrypted with bank-level security. We partner with trusted payment processors to ensure your data is protected."
        />

        <form onSubmit={handleSubmit} className="space-y-8 mt-8">
          {/* Bank Account Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Account Holder Name *"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleInputChange}
                  placeholder="Full name on bank account"
                  error={getErrorMessage('accountHolderName')}
                />
              </div>
              
              <div className="md:col-span-2">
                <Input
                  label="Bank Name *"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Name of your bank"
                  error={getErrorMessage('bankName')}
                />
              </div>
              
              <div>
                <Input
                  label="Routing Number *"
                  name="routingNumber"
                  value={formData.routingNumber}
                  onChange={handleInputChange}
                  placeholder="9-digit routing number"
                  maxLength={9}
                  error={getErrorMessage('routingNumber')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Found on the bottom left of your check
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type *
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <div className="relative">
                  <Input
                    type={showAccountNumber ? "text" : "password"}
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Account number"
                    error={getErrorMessage('accountNumber')}
                    className="pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showAccountNumber ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              
              <div>
                <Input
                  label="Confirm Account Number *"
                  type={showAccountNumber ? "text" : "password"}
                  name="confirmAccountNumber"
                  value={formData.confirmAccountNumber}
                  onChange={handleInputChange}
                  placeholder="Re-enter account number"
                  error={getErrorMessage('confirmAccountNumber')}
                />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax ID Type *
                </label>
                <select
                  name="taxIdType"
                  value={formData.taxIdType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ssn">Social Security Number (SSN)</option>
                  <option value="ein">Employer Identification Number (EIN)</option>
                </select>
              </div>
              
              <div>
                <Input
                  label={`${formData.taxIdType === 'ssn' ? 'Social Security Number' : 'EIN'} *`}
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  placeholder={formData.taxIdType === 'ssn' ? 'XXX-XX-XXXX' : 'XX-XXXXXXX'}
                  maxLength={formData.taxIdType === 'ssn' ? 11 : 10}
                  error={getErrorMessage('taxId')}
                />
              </div>
              
              {formData.taxIdType === 'ein' && (
                <div className="md:col-span-2">
                  <Input
                    label="Business Name *"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Your business name"
                    error={getErrorMessage('businessName')}
                  />
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    name="useSameAddressAsPersonal"
                    checked={formData.useSameAddressAsPersonal}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Use same address as personal information</span>
                </label>
              </div>
              
              {!formData.useSameAddressAsPersonal && (
                <>
                  <div className="md:col-span-2">
                    <Input
                      label="Tax Address Street *"
                      name="taxAddress.street"
                      value={formData.taxAddress.street}
                      onChange={handleInputChange}
                      placeholder="123 Tax Address St"
                      error={getErrorMessage('taxAddress.street')}
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="City *"
                      name="taxAddress.city"
                      value={formData.taxAddress.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      error={getErrorMessage('taxAddress.city')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <select
                      name="taxAddress.state"
                      value={formData.taxAddress.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select State</option>
                      {US_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {getErrorMessage('taxAddress.state') && (
                      <p className="text-red-500 text-sm mt-1">{getErrorMessage('taxAddress.state')}</p>
                    )}
                  </div>
                  
                  <div>
                    <Input
                      label="ZIP Code *"
                      name="taxAddress.zipCode"
                      value={formData.taxAddress.zipCode}
                      onChange={handleInputChange}
                      placeholder="12345"
                      maxLength={10}
                      error={getErrorMessage('taxAddress.zipCode')}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payout Preferences */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Frequency *
                </label>
                <select
                  name="payoutFrequency"
                  value={formData.payoutFrequency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weekly">Weekly (Free)</option>
                  <option value="daily">Daily ($0.50 fee per transfer)</option>
                  <option value="instant">Instant ($1.50 fee per transfer)</option>
                </select>
              </div>
              
              <div>
                <Input
                  label="Minimum Payout Amount *"
                  name="minimumPayoutAmount"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.minimumPayoutAmount}
                  onChange={handleInputChange}
                  placeholder="25"
                  error={getErrorMessage('minimumPayoutAmount')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Earnings will accumulate until this amount is reached
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Payout Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Weekly payouts are processed every Monday for the previous week</li>
                <li>• Daily payouts are processed at 3 PM EST Monday-Friday</li>
                <li>• Instant payouts are available 24/7 and typically arrive within minutes</li>
                <li>• Bank holidays may delay processing times</li>
              </ul>
            </div>
          </div>

          {/* Agreements */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreements & Consent</h3>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="agreeToPayoutTerms"
                  checked={formData.agreeToPayoutTerms}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-900">
                    I agree to the payout terms and conditions, including fee structures and processing times *
                  </span>
                  {getErrorMessage('agreeToPayoutTerms') && (
                    <p className="text-red-500 text-sm mt-1">{getErrorMessage('agreeToPayoutTerms')}</p>
                  )}
                </div>
              </label>
              
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="agreeTo1099Reporting"
                  checked={formData.agreeTo1099Reporting}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-900">
                    I understand I will receive a 1099 tax form if I earn more than $600 in a calendar year *
                  </span>
                  {getErrorMessage('agreeTo1099Reporting') && (
                    <p className="text-red-500 text-sm mt-1">{getErrorMessage('agreeTo1099Reporting')}</p>
                  )}
                </div>
              </label>
              
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="understandFees"
                  checked={formData.understandFees}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-900">
                    I understand the payout fee structure and that fees will be deducted from my earnings *
                  </span>
                  {getErrorMessage('understandFees') && (
                    <p className="text-red-500 text-sm mt-1">{getErrorMessage('understandFees')}</p>
                  )}
                </div>
              </label>
              
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="consentToTaxReporting"
                  checked={formData.consentToTaxReporting}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-900">
                    I consent to RydeAlong reporting my earnings to tax authorities as required by law *
                  </span>
                  {getErrorMessage('consentToTaxReporting') && (
                    <p className="text-red-500 text-sm mt-1">{getErrorMessage('consentToTaxReporting')}</p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Account Verification */}
          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Verification</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Method
              </label>
              <select
                name="verificationMethod"
                value={formData.verificationMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="microdeposit">Micro-deposit Verification (1-2 business days)</option>
                <option value="instant">Instant Verification (If supported by your bank)</option>
              </select>
            </div>
            
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Next Steps</h4>
              <p className="text-sm text-yellow-700">
                {formData.verificationMethod === 'microdeposit' 
                  ? "After submitting, we'll deposit two small amounts (under $1) into your account within 1-2 business days. You'll need to verify these amounts to complete setup."
                  : "We'll attempt to instantly verify your account. If this fails, we'll fall back to micro-deposit verification."
                }
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button 
              type="button"
              variant="outline" 
              onClick={goToPreviousStep}
              disabled={saving}
            >
              Previous Step
            </Button>
            
            <Button 
              type="submit"
              variant="primary"
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayoutSetupForm; 