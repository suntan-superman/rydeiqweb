import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { addUserTypeToAccount, USER_TYPES } from '../../services/authService';
import Button from '../common/Button';
import PhoneInput from '../common/PhoneInput';
import { emergencyPhoneValidationRules } from '../../utils/phoneValidation';
import toast from 'react-hot-toast';

const AddUserTypeModal = ({ isOpen, onClose, userType }) => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const getUserTypeLabel = (type) => {
    switch (type) {
      case USER_TYPES.DRIVER:
        return 'Driver';
      case USER_TYPES.PASSENGER:
        return 'Rider';
      case USER_TYPES.ADMINISTRATOR:
        return 'Administrator';
      case USER_TYPES.HEALTHCARE_PROVIDER:
        return 'Healthcare Provider';
      default:
        return type;
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await addUserTypeToAccount({
        user,
        userType,
        city: data.city,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelationship: data.emergencyContactRelationship,
        emergencyContactEmail: data.emergencyContactEmail
      });

      if (result.success) {
        setUser(result.data);
        toast.success(result.message);
        onClose();
        reset();
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      toast.error('Failed to add user type');
      console.error('Add user type error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Add {getUserTypeLabel(userType)} Profile</h2>
              <p className="text-primary-100 text-sm">Add this profile to your existing account</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-primary-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {userType === USER_TYPES.DRIVER && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  City/Coverage Area *
                </label>
                <select
                  {...register('city', { required: 'Please select your city' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select your city</option>
                  <option value="san_francisco">San Francisco, CA</option>
                  <option value="los_angeles">Los Angeles, CA</option>
                  <option value="san_diego">San Diego, CA</option>
                  <option value="bakersfield">Bakersfield, CA</option>
                  <option value="seattle">Seattle, WA</option>
                  <option value="portland">Portland, OR</option>
                  <option value="austin">Austin, TX</option>
                  <option value="miami">Miami, FL</option>
                  <option value="other">Other (Coming Soon)</option>
                </select>
                {errors.city && (
                  <p className="text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>
            )}

            {/* Emergency Contact Information */}
            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Contact</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please provide an emergency contact for safety purposes.
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Emergency Contact Name *
                      </label>
                      <input
                        type="text"
                        {...register('emergencyContactName', { 
                          required: 'Emergency contact name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters'
                          }
                        })}
                        placeholder="Jane Doe"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.emergencyContactName && (
                        <p className="text-sm text-red-600">{errors.emergencyContactName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Emergency Contact Phone *
                      </label>
                      <PhoneInput
                        {...register('emergencyContactPhone', emergencyPhoneValidationRules)}
                        placeholder="(555) 123-4567"
                      />
                      {errors.emergencyContactPhone && (
                        <p className="text-sm text-red-600">{errors.emergencyContactPhone.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Relationship *
                      </label>
                      <input
                        type="text"
                        {...register('emergencyContactRelationship', { 
                          required: 'Relationship is required'
                        })}
                        placeholder="e.g., Spouse, Parent, Sibling"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.emergencyContactRelationship && (
                        <p className="text-sm text-red-600">{errors.emergencyContactRelationship.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Emergency Contact Email (Optional)
                      </label>
                      <input
                        type="email"
                        {...register('emergencyContactEmail', {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Please enter a valid email address'
                          }
                        })}
                        placeholder="contact@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.emergencyContactEmail && (
                        <p className="text-sm text-red-600">{errors.emergencyContactEmail.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="flex-1"
              >
                Add {getUserTypeLabel(userType)} Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserTypeModal;
