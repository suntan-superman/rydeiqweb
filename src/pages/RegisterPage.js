/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { registerUser, USER_TYPES } from '../services/authService';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

// Separate form component that gets recreated each time
const RegistrationForm = ({ userType, onSubmit, isLoading }) => {
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
      city: ''
    },
    mode: 'onChange' // Enable real-time validation
  });

  const password = watch('password');

  // Simplified form clearing - only use React Hook Form reset
  useEffect(() => {
    console.log('Form component mounted for user type:', userType);
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset form to empty state
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

    console.log('Form reset completed for user type:', userType);
  }, [userType, reset]);

  // Generate unique form ID
  const formId = `registration-form-${userType}-${Date.now()}`;

  // Debug function to log form state
  const logFormState = () => {
    const formData = watch();
    console.log('Current form data:', formData);
    console.log('Current errors:', errors);
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
          <input
            type="tel"
            {...register('phone', { required: 'Phone number is required' })}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoComplete="nope"
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
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
            {...register('acceptTerms', { required: 'You must accept the terms' })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
            autoComplete="nope"
          />
          <div className="ml-3 text-sm">
            <label className="text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                Terms of Service
              </Link>{' '}
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
              {...register('acceptDriverTerms', { required: 'You must accept the driver terms' })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
              autoComplete="nope"
            />
            <div className="ml-3 text-sm">
              <label className="text-gray-700">
                I agree to the{' '}
                <Link to="/driver-terms" className="text-primary-600 hover:text-primary-700">
                  Driver Agreement
                </Link>{' '}
                and understand that background check and document verification are required
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
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Creating Account...' : `Create ${userType === USER_TYPES.DRIVER ? 'Driver' : 'Rider'} Account`}
        </Button>

        {/* Debug buttons - remove in production */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="space-y-2 mt-4">
            <button
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
            </button>
            
            <button
              type="button"
              onClick={logFormState}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              🔍 Log Form State (Debug)
            </button>
            
            <button
              type="button"
              onClick={() => {
                const formData = watch();
                console.log('Form data before submission:', formData);
                console.log('Form errors before submission:', errors);
              }}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              📝 Test Form Submission (Debug)
            </button>
          </div>
        )} */}
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const [userType, setUserType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleUserTypeChange = (newUserType) => {
    setUserType(newUserType);
    // Force complete component recreation
    setFormKey(prev => prev + 1);
    console.log('User type changed to:', newUserType, 'Form key:', formKey + 1);
  };

  // Clear form when user type changes
  useEffect(() => {
    if (userType) {
      console.log('Form should be cleared for user type:', userType);
      // Force a small delay to ensure the new form component is mounted
      setTimeout(() => {
        console.log('Form cleared and recreated for:', userType);
      }, 100);
    }
  }, [userType, formKey]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      console.log('Submitting registration data:', data);
      
      const result = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: userType,
        ...(userType === USER_TYPES.DRIVER && { city: data.city })
      });
      
      console.log('Registration result:', result);
      
      if (result.success) {
        // Don't automatically log in the user - let them verify email first
        // setUser(result.user); // Commented out to prevent auto-login
        
        if (userType === USER_TYPES.DRIVER) {
          toast.success('Account created successfully! Please check your email to verify your account, then sign in to complete your driver onboarding.');
          navigate('/login');
        } else if (userType === USER_TYPES.ADMINISTRATOR) {
          toast.success('Admin request submitted! Please check your email to verify your account, then sign in. Your request will be reviewed by a super administrator.');
          navigate('/login');
        } else {
          toast.success('Account created successfully! Please check your email to verify your account, then sign in to start booking rides.');
          navigate('/login');
        }
      } else {
        console.error('Registration failed:', result.error);
        
        // Handle specific error cases
        if (result.error.code === 'auth/email-already-in-use') {
          toast.error('An account with this email already exists. Please try signing in instead.');
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            Create Your {userType === USER_TYPES.DRIVER ? 'Driver' : 'Rider'} Account
          </h1>
          <p className="text-gray-600">
            {userType === USER_TYPES.DRIVER 
              ? 'Start earning with AnyRyde - set your own prices and keep more of what you earn'
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

        <RegistrationForm key={`${userType}-${formKey}-${Date.now()}`} userType={userType} onSubmit={onSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default RegisterPage; 