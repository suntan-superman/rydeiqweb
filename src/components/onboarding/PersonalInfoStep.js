import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useOnboarding, ONBOARDING_STEPS } from '../../contexts/OnboardingContext';
import Button from '../common/Button';
import Input from '../common/Input';
import OnboardingProgress from './OnboardingProgress';
import toast from 'react-hot-toast';

const PersonalInfoStep = () => {
  const { 
    formData, 
    updatePersonalInfo, 
    nextStep, 
    previousStep, 
    validateStep,
    errors
  } = useOnboarding();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: formErrors },
    clearErrors
  } = useForm({
    defaultValues: {
      firstName: formData.personalInfo.firstName,
      lastName: formData.personalInfo.lastName,
      email: formData.personalInfo.email,
      phone: formData.personalInfo.phone,
      password: formData.personalInfo.password,
      confirmPassword: formData.personalInfo.confirmPassword
    },
    mode: 'onChange'
  });

  const password = watch('password');

  // Update form data when form values change
  useEffect(() => {
    const subscription = watch((value) => {
      updatePersonalInfo(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, updatePersonalInfo]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      clearErrors();
    }
  }, [watch, clearErrors, formErrors]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Validate the step
      const isValid = validateStep(ONBOARDING_STEPS.PERSONAL_INFO);
      
      if (!isValid) {
        toast.error('Please fill in all required fields correctly');
        return;
      }

      // Check if email is already in use (basic validation)
      if (data.email) {
        // In a real app, you'd check against your backend
        // For now, we'll just proceed
      }

      toast.success('Personal information saved!');
      nextStep();
    } catch (error) {
      console.error('Error saving personal info:', error);
      toast.error('Failed to save personal information. Please try again.');
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
              Tell us about yourself
            </h1>
            <p className="text-gray-600">
              We need some basic information to create your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name *"
                {...register('firstName', { 
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters'
                  }
                })}
                error={formErrors.firstName?.message || errors.firstName}
                placeholder="Enter your first name"
              />
              
              <Input
                label="Last Name *"
                {...register('lastName', { 
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters'
                  }
                })}
                error={formErrors.lastName?.message || errors.lastName}
                placeholder="Enter your last name"
              />
            </div>

            {/* Email */}
            <Input
              label="Email Address *"
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Please enter a valid email address'
                }
              })}
              error={formErrors.email?.message || errors.email}
              placeholder="Enter your email address"
            />

            {/* Phone */}
            <Input
              label="Phone Number *"
              type="tel"
              {...register('phone', { 
                required: 'Phone number is required',
                pattern: {
                  value: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
                  message: 'Please enter a valid phone number'
                }
              })}
              error={formErrors.phone?.message || errors.phone}
              placeholder="(555) 123-4567"
            />

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Password *"
                  type="password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                    }
                  })}
                  error={formErrors.password?.message || errors.password}
                  placeholder="Create a password"
                />
                {password && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">
                      Password strength: {
                        password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) 
                          ? 'Strong' 
                          : password.length >= 6 
                            ? 'Medium' 
                            : 'Weak'
                      }
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
                            ? 'bg-green-500'
                            : password.length >= 6
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min((password.length / 8) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <Input
                label="Confirm Password *"
                type="password"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                error={formErrors.confirmPassword?.message || errors.confirmPassword}
                placeholder="Confirm your password"
              />
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Your information is secure</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    We use industry-standard encryption to protect your personal information and never share it with third parties.
                  </p>
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
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Continue
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
