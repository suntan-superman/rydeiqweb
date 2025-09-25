import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateProfileCompletion, getProfileCompletionPercentage, getProfileCompletionMessage } from '../../services/profileValidationService';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const ProfileCompletionModal = ({ isOpen, onClose, onComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const result = await validateProfileCompletion(user.uid);
      console.log('🎯 Profile validation result:', result);
      setValidationResult(result);
    } catch (error) {
      console.error('Error validating profile:', error);
      toast.error('Failed to validate profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      validateUserProfile();
    }
  }, [isOpen, user, validateUserProfile]);

  const handleCompleteProfile = () => {
    console.log('🎯 Complete Profile button clicked');
    console.log('🎯 Closing modal and navigating to /onboarding');
    onClose();
    navigate('/onboarding');
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="large" text="Checking your profile..." />
            </div>
          ) : validationResult ? (
            <div className="space-y-6">
              {/* Profile Status */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {validationResult.isComplete ? (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {validationResult.isComplete ? 'Profile Complete!' : 'Profile Incomplete'}
                </h4>
                <p className="text-gray-600">
                  {getProfileCompletionMessage(validationResult)}
                </p>
              </div>

              {/* Progress Bar */}
              {!validationResult.isComplete && (
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getProfileCompletionPercentage(validationResult)}%` }}
                  />
                </div>
              )}

              {/* Missing Fields */}
              {validationResult.missingFields.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-medium text-red-900 mb-2">Required Information:</h5>
                  <ul className="text-sm text-red-800 space-y-1">
                    {validationResult.missingFields.map((field, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-900 mb-2">Recommendations:</h5>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Profile Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Profile Status:</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${validationResult.userData.hasProfilePicture ? 'bg-green-500' : 'bg-red-500'}`} />
                    Profile Picture
                  </div>
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${validationResult.userData.hasPaymentMethod ? 'bg-green-500' : 'bg-red-500'}`} />
                    Payment Method
                  </div>
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${validationResult.userData.hasEmergencyContact ? 'bg-green-500' : 'bg-red-500'}`} />
                    Emergency Contact
                  </div>
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${validationResult.userData.termsAccepted ? 'bg-green-500' : 'bg-red-500'}`} />
                    Terms Accepted
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Unable to validate profile</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            {validationResult && !validationResult.isComplete && (
              <Button
                type="button"
                variant="primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎯 Button clicked with event:', e);
                  handleCompleteProfile();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Complete Profile
              </Button>
            )}
            {validationResult && validationResult.isComplete && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  onComplete();
                  onClose();
                }}
              >
                Continue to Ride Booking
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;
