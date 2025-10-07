import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

const SMSOptInForm = ({ onComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || user?.phoneNumber || '');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const phone = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error('Please agree to the Terms and Conditions to continue');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);

      // Update user's phone and SMS preferences
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        phone: `+1${cleanPhone}`,
        phoneNumber: `+1${cleanPhone}`,
        'notificationPreferences.smsEnabled': true,
        'notificationPreferences.smsRideUpdates': true,
        'notificationPreferences.smsEmergency': true,
        smsOptInDate: new Date().toISOString()
      });

      toast.success('SMS notifications enabled successfully!');

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      } else {
        navigate('/settings/notifications');
      }

    } catch (error) {
      console.error('Error enabling SMS:', error);
      toast.error('Failed to enable SMS notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          SMS Text Message Opt-In
        </h2>
        <p className="text-gray-600 mt-2">
          Stay informed with important ride updates via text message
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            Receive SMS text messages from AnyRyde for important ride notifications. 
            Consent is not a condition of service. Msg & Data rates may apply.
          </p>
        </div>

        {/* Phone Number Input */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900 mb-2">
            Mobile Phone Number <span className="text-red-600">*</span>
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            maxLength={14}
            placeholder="(555) 555-5555"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-600 mt-1">
            Enter the 10-digit mobile phone number where you wish to receive text messages from AnyRyde
          </p>
        </div>

        {/* Consent Checkbox */}
        <div>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-2 border-gray-900 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                I agree to receive SMS text messages from AnyRyde at the mobile phone number provided above. 
                I understand that I can opt out at any time by texting <strong>STOP</strong> to cancel. 
                Msg frequency may vary. Msg & Data rates may apply.
              </p>
              <div className="mt-2 text-sm">
                <Link to="/sms-terms" className="text-green-600 hover:text-green-700 font-medium underline">
                  SMS Terms and Conditions
                </Link>
                {' and '}
                <Link to="/privacy" className="text-green-600 hover:text-green-700 font-medium underline">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </label>
        </div>

        {/* What You'll Receive */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">What notifications will you receive?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Driver acceptance and arrival notifications</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Ride status updates (start, completion, cancellation)</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Emergency alerts and safety notifications</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Scheduled ride reminders</span>
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !agreedToTerms}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            loading || !agreedToTerms
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {loading ? 'Enabling SMS...' : 'Enable SMS Notifications'}
        </button>

        {/* Footer Info */}
        <div className="text-sm text-gray-600 text-center">
          <p>Text <strong>HELP</strong> for help. Text <strong>STOP</strong> to cancel.</p>
          <p className="mt-1">Msg frequency may vary. Msg & Data rates may apply.</p>
        </div>

        {/* Skip Option */}
        {onComplete && (
          <button
            type="button"
            onClick={onComplete}
            className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 underline"
          >
            Skip for now
          </button>
        )}
      </form>
    </div>
  );
};

export default SMSOptInForm;

