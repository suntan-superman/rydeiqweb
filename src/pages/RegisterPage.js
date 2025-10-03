/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { registerUser, USER_TYPES, checkEmailVerification, loginUser } from '../services/authService';
import { getTermsForUserType, getTermsTitleForUserType } from '../services/termsService';
import { checkOnboardingStatus } from '../services/driverService';
import { checkRiderOnboardingStatus } from '../services/riderOnboardingService';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import PhoneInput from '../components/common/PhoneInput';
import { phoneValidationRules, emergencyPhoneValidationRules } from '../utils/phoneValidation';
// Debug components removed for clean interface

// Separate form component that gets recreated each time
const RegistrationForm = ({ userType, onSubmit, isLoading }) => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [termsTitle, setTermsTitle] = useState('');
  
  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acceptDriverTerms: false,
      city: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      emergencyContactEmail: ''
    },
    mode: 'onChange' // Enable real-time validation
  });

  const password = watch('password');
  const watchedValues = watch();

  // Check if all required fields are filled for rider registration
  const isFormValid = () => {
    if (userType === USER_TYPES.PASSENGER) {
      return (
        watchedValues.firstName?.trim() &&
        watchedValues.lastName?.trim() &&
        watchedValues.email?.trim() &&
        watchedValues.phone?.trim() &&
        watchedValues.password?.trim() &&
        watchedValues.confirmPassword?.trim() &&
        watchedValues.emergencyContactName?.trim() &&
        watchedValues.emergencyContactPhone?.trim() &&
        watchedValues.emergencyContactRelationship?.trim() &&
        watchedValues.acceptTerms &&
        !errors.firstName &&
        !errors.lastName &&
        !errors.email &&
        !errors.phone &&
        !errors.password &&
        !errors.confirmPassword &&
        !errors.emergencyContactName &&
        !errors.emergencyContactPhone &&
        !errors.emergencyContactRelationship
      );
    }
    // For other user types, use existing validation
    return true;
  };

  // Don't auto-reset form on userType change to prevent form clearing on errors
  useEffect(() => {
    console.log('Form component mounted for user type:', userType);
  }, [userType]);

  // Generate unique form ID
  const formId = `registration-form-${userType}-${Date.now()}`;

  // Debug function to log form state
  const logFormState = () => {
    const formData = watch();
    console.log('Current form data:', formData);
    console.log('Current errors:', errors);
  };

  // Show terms modal
  const handleShowTerms = () => {
    const content = getTermsForUserType(userType);
    const title = getTermsTitleForUserType(userType);
    setTermsContent(content);
    setTermsTitle(title);
    setShowTermsModal(true);
  };

  // Test form submission handler
  const testSubmit = (data) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', errors);
    onSubmit(data);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {userType === USER_TYPES.DRIVER && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-900">Driver Requirements</h4>
              <p className="text-sm text-green-700 mt-1">
                You'll need: Valid driver's license, vehicle registration, insurance, and clean background check.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FAKE FIELDS TO TRICK BROWSER AUTOFILL */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <input type="text" name="fake-username" autoComplete="username" />
        <input type="email" name="fake-email" autoComplete="email" />
        <input type="password" name="fake-password" autoComplete="current-password" />
        <input type="text" name="fake-firstname" autoComplete="given-name" />
        <input type="text" name="fake-lastname" autoComplete="family-name" />
        <input type="tel" name="fake-phone" autoComplete="tel" />
      </div>

      <form 
        id={formId} 
        onSubmit={handleSubmit(testSubmit)} 
        className="space-y-6" 
        autoComplete="off"
        data-form-type={userType}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              type="text"
              {...register('firstName', { required: 'First name is required' })}
              placeholder="John"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoComplete="nope"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              type="text"
              {...register('lastName', { required: 'Last name is required' })}
              placeholder="Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoComplete="nope"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            placeholder="john@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoComplete="nope"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Phone Number *
          </label>
          <PhoneInput
            {...register('phone', phoneValidationRules)}
            placeholder="(555) 123-4567"
            autoComplete="nope"
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Emergency Contact Information */}
        <div className="space-y-4">
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Contact</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide an emergency contact for safety purposes. This information will be used in case of emergencies during rides.
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
                    autoComplete="nope"
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
                    autoComplete="nope"
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
                    autoComplete="nope"
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
                    autoComplete="nope"
                  />
                  {errors.emergencyContactEmail && (
                    <p className="text-sm text-red-600">{errors.emergencyContactEmail.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {userType === USER_TYPES.DRIVER && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              City/Coverage Area *
            </label>
            <select
              {...register('city', { required: 'Please select your city' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoComplete="nope"
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

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <input
            type="password"
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain uppercase, lowercase, and number'
              }
            })}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoComplete="new-password"
            data-lpignore="true"
            data-form-type="other"
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Confirm Password *
          </label>
          <input
            type="password"
            {...register('confirmPassword', { 
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoComplete="new-password"
            data-lpignore="true"
            data-form-type="other"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            {...register('acceptTerms', { required: 'You must accept the terms and conditions to continue' })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
            autoComplete="nope"
          />
          <div className="ml-3 text-sm">
            <label className="text-gray-700">
              I agree to the{' '}
              <button
                type="button"
                onClick={handleShowTerms}
                className="text-primary-600 hover:text-primary-700 underline font-medium"
              >
                Terms of Use for {userType === USER_TYPES.DRIVER ? 'Drivers' : 'Riders'}
              </button>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
            </label>
            {errors.acceptTerms && (
              <p className="text-red-600 text-sm mt-1">{errors.acceptTerms.message}</p>
            )}
          </div>
        </div>

        {userType === USER_TYPES.DRIVER && (
          <div className="flex items-start">
            <input
              type="checkbox"
              {...register('acceptDriverTerms', { required: 'You must accept the driver terms and conditions' })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
              autoComplete="nope"
            />
            <div className="ml-3 text-sm">
              <label className="text-gray-700">
                I understand that background check and document verification are required, and I agree to the{' '}
                <button
                  type="button"
                  onClick={handleShowTerms}
                  className="text-primary-600 hover:text-primary-700 underline font-medium"
                >
                  Driver Terms of Use
                </button>
              </label>
              {errors.acceptDriverTerms && (
                <p className="text-red-600 text-sm mt-1">{errors.acceptDriverTerms.message}</p>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          size="large"
          disabled={isLoading || !isFormValid()}
          className="w-full"
        >
          {isLoading ? 'Creating Account...' : `Create ${
            userType === USER_TYPES.DRIVER ? 'Driver' :
            userType === USER_TYPES.ADMINISTRATOR ? 'Administrator' :
            userType === USER_TYPES.HEALTHCARE_PROVIDER ? 'Healthcare Provider' :
            'Rider'
          } Account`}
        </Button>

        {/* Debug buttons - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-2 mt-4">
            {/* <button
              type="button"
              onClick={() => {
                reset({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  password: '',
                  confirmPassword: '',
                  acceptTerms: false,
                  acceptDriverTerms: false,
                  city: ''
                });
                console.log('Manual form reset executed');
              }}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              🧹 Manual Clear Form (Debug)
            </button> */}
            
            {/* <button
              type="button"
              onClick={logFormState}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              🔍 Log Form State (Debug)
            </button> */}
            
            {/* <button
              type="button"
              onClick={() => {
                const formData = watch();
                console.log('Form data before submission:', formData);
                console.log('Form errors before submission:', errors);
              }}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              📝 Test Form Submission (Debug)
            </button> */}
          </div>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in here
          </Link>
        </p>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{termsTitle}</h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ 
                  __html: termsContent.replace(/\n/g, '<br>').replace(/# /g, '<h3 class="text-lg font-semibold text-gray-900 mb-2 mt-4">').replace(/## /g, '<h4 class="text-md font-semibold text-gray-900 mb-2 mt-3">').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }}
              />
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTermsModal(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setValue('acceptTerms', true);
                    setShowTermsModal(false);
                    toast.success('Terms accepted!');
                  }}
                >
                  Accept Terms
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RegisterPage = () => {
  const [userType, setUserType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Check if user is coming from email verification
  useEffect(() => {
    const checkEmailVerificationStatus = async () => {
      // If user is logged in and email is verified, redirect to appropriate dashboard
      if (user && user.emailVerified) {
        console.log('✅ User email is verified, checking onboarding status');
        
        try {
          // Check onboarding status before redirecting
          if (user.userType === 'driver') {
            const onboardingResult = await checkOnboardingStatus(user.uid);
            if (onboardingResult.success) {
              const { needsOnboarding } = onboardingResult.data;
              if (needsOnboarding) {
                console.log('🎯 Driver needs onboarding, redirecting to /driver-onboarding');
                navigate('/driver-onboarding');
              } else {
                console.log('✅ Driver onboarding complete, redirecting to /driver-dashboard');
                navigate('/driver-dashboard');
              }
            } else {
              // If can't check status, assume needs onboarding (safer default for new drivers)
              console.log('⚠️ Could not check driver onboarding status, redirecting to /driver-onboarding');
              navigate('/driver-onboarding');
            }
          } else if (user.userType === 'admin') {
            navigate('/admin-dashboard');
          } else if (user.userType === 'healthcare_provider') {
            navigate('/medical-portal');
          } else {
            // Check if rider has completed onboarding
            const riderOnboardingResult = await checkRiderOnboardingStatus(user.uid);
            if (riderOnboardingResult.success) {
              const { needsOnboarding } = riderOnboardingResult.data;
              if (needsOnboarding) {
                console.log('🎯 Rider needs onboarding, redirecting to /onboarding');
                navigate('/onboarding');
              } else {
                console.log('✅ Rider onboarding complete, redirecting to /dashboard');
                navigate('/dashboard');
              }
            } else {
              // Default to dashboard if can't check
              navigate('/dashboard');
            }
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          // Fallback to basic redirect with onboarding check
          if (user.userType === 'driver') {
            navigate('/driver-onboarding');
          } else if (user.userType === 'admin') {
            navigate('/admin-dashboard');
          } else if (user.userType === 'healthcare_provider') {
            navigate('/medical-portal');
          } else {
            navigate('/dashboard');
          }
        }
        return;
      }

      // If there's a verification parameter in the URL, redirect to verification success page
      if (searchParams.get('verified') === 'true' || searchParams.get('emailVerified') === 'true') {
        console.log('📧 Email verification detected, redirecting to success page');
        navigate('/email-verified');
        return;
      }
    };

    checkEmailVerificationStatus();
  }, [user, navigate, searchParams]);

  const handleUserTypeChange = (newUserType) => {
    setUserType(newUserType);
    console.log('User type changed to:', newUserType);
  };

  // Form handling when user type changes
  useEffect(() => {
    if (userType) {
      console.log('User type selected:', userType);
    }
  }, [userType]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      console.log('Submitting registration data:', data);
      
      const result = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone, // Add phone number to registration
        userType: userType,
        ...(userType === USER_TYPES.DRIVER && { city: data.city }),
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelationship: data.emergencyContactRelationship,
        emergencyContactEmail: data.emergencyContactEmail
      });
      
      console.log('Registration result:', result);
      
      if (result.success) {
        // Check if this is adding a new user type to existing account
        if (result.message && result.message.includes('Successfully added')) {
          toast.success(result.message);
          navigate('/login');
        } else {
          // New account creation - show appropriate message
          // DON'T navigate yet - let the email verification dialog show first
          if (userType === USER_TYPES.DRIVER) {
            toast.success('Account created successfully! Please verify your email to continue with driver onboarding.', {
              duration: 5000
            });
          } else if (userType === USER_TYPES.ADMINISTRATOR) {
            toast.success('Admin request submitted! Please verify your email to continue.', {
              duration: 5000
            });
          } else if (userType === USER_TYPES.HEALTHCARE_PROVIDER) {
            toast.success('Healthcare provider account created! Please verify your email to continue.', {
              duration: 5000
            });
          } else {
            toast.success('Account created successfully! Please verify your email to continue.', {
              duration: 5000
            });
          }
          // The GlobalEmailVerificationDialog will show automatically
          // After verification, the user will be redirected appropriately
        }
      } else {
        console.error('Registration failed:', result.error);
        
        // Handle specific error cases
        if (typeof result.error === 'string' && result.error.includes('not verified')) {
          // Account exists but is not verified - show helpful message
          toast.error('This account is not verified yet. Please check your email for the verification link.', {
            duration: 6000
          });
          // Try to log them in so the verification dialog can show
          try {
            const loginResult = await loginUser(data.email, data.password);
            if (loginResult.success) {
              setUser(loginResult.user);
              // The verification dialog should show automatically
            }
          } catch (loginError) {
            console.error('Could not auto-login for verification:', loginError);
          }
        } else if (result.error.code === 'auth/email-already-in-use') {
          toast.error(result.error.message, {
            duration: 6000,
            action: {
              label: 'Sign In Instead',
              onClick: () => navigate('/login')
            }
          });
        } else if (result.error.code === 'auth/user-type-exists') {
          toast.error(result.error.message);
        } else if (result.error.code === 'auth/wrong-password') {
          toast.error(result.error.message);
        } else if (result.error.code === 'auth/weak-password') {
          toast.error('Password is too weak. Please choose a stronger password.');
        } else if (result.error.code === 'auth/invalid-email') {
          toast.error('Invalid email address. Please enter a valid email.');
        } else {
          toast.error(result.error.message || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Join RydeAlong
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Choose how you want to experience the future of ride-sharing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Passenger Registration */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-primary-200 transition-all duration-300 cursor-pointer group"
                 onClick={() => handleUserTypeChange(USER_TYPES.PASSENGER)}>
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Passenger</h3>
                <p className="text-gray-600 mb-6">
                  Book rides with transparent pricing and driver choice. Save money and travel smart.
                </p>
                <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Transparent pricing
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Choose your driver
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Real-time tracking
                  </li>
                </ul>
                <Button size="large" className="w-full">
                  Join as Passenger
                </Button>
              </div>
            </div>

            {/* Driver Registration */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-green-200 transition-all duration-300 cursor-pointer group"
                 onClick={() => handleUserTypeChange(USER_TYPES.DRIVER)}>
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Driver</h3>
                <p className="text-gray-600 mb-6">
                  Set your own prices, keep more of what you earn, and work on your own schedule.
                </p>
                <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Set your own prices
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Keep more earnings
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Flexible schedule
                  </li>
                </ul>
                <Button size="large" className="w-full">
                  Join as Driver
                </Button>
              </div>
            </div>

            {/* Healthcare Provider Registration */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-green-200 transition-all duration-300 cursor-pointer group"
                 onClick={() => handleUserTypeChange(USER_TYPES.HEALTHCARE_PROVIDER)}>
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Healthcare Provider</h3>
                <p className="text-gray-600 mb-6">
                  HIPAA-compliant medical transportation for your patients and organization.
                </p>
                <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    HIPAA compliant
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Medical transport
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Enterprise billing
                  </li>
                </ul>
                <Button size="large" className="w-full">
                  Join as Healthcare Provider
                </Button>
              </div>
            </div>

            {/* Administrator Registration */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-purple-200 transition-all duration-300 cursor-pointer group"
                 onClick={() => handleUserTypeChange(USER_TYPES.ADMINISTRATOR)}>
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Administrator</h3>
                <p className="text-gray-600 mb-6">
                  Help manage the platform, review applications, and ensure quality service.
                </p>
                <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Review applications
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Platform management
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Requires approval
                  </li>
                </ul>
                <Button size="large" className="w-full">
                  Request Admin Access
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your {
              userType === USER_TYPES.DRIVER ? 'Driver' :
              userType === USER_TYPES.ADMINISTRATOR ? 'Administrator' :
              userType === USER_TYPES.HEALTHCARE_PROVIDER ? 'Healthcare Provider' :
              'Rider'
            } Account
          </h1>
          <p className="text-gray-600">
            {userType === USER_TYPES.DRIVER 
              ? 'Start earning with AnyRyde - set your own prices and keep more of what you earn'
              : userType === USER_TYPES.ADMINISTRATOR
              ? 'Request admin access to help manage the AnyRyde platform'
              : userType === USER_TYPES.HEALTHCARE_PROVIDER
              ? 'Set up HIPAA-compliant medical transportation for your organization'
              : 'Book your first ride with AnyRyde - transparent pricing and driver choice'
            }
          </p>
          <button
            onClick={() => handleUserTypeChange('')}
            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            ← Change account type
          </button>
        </div>

        <RegistrationForm userType={userType} onSubmit={onSubmit} isLoading={isLoading} />
        
      </div>

    </div>
  );
};

export default RegisterPage; 