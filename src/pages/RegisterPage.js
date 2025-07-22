/* eslint-disable */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { registerUser, USER_TYPES } from '../services/authService';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const RegisterPage = () => {
  const [userType, setUserType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: userType
      });
      
      if (result.success) {
        setUser(result.user);
        
        if (userType === USER_TYPES.DRIVER) {
          toast.success('Welcome to RydeAlong! Complete your driver onboarding to start earning.');
          navigate('/driver-onboarding');
        } else if (userType === USER_TYPES.ADMINISTRATOR) {
          toast.success('Admin request submitted! Your request will be reviewed by a super administrator.');
          navigate('/dashboard');
        } else {
          toast.success('Welcome to RydeAlong! You can now start booking rides!');
          navigate('/dashboard');
        }
      } else {
        toast.error(result.error.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
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
                 onClick={() => setUserType(USER_TYPES.PASSENGER)}>
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
                 onClick={() => setUserType(USER_TYPES.DRIVER)}>
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
                 onClick={() => setUserType(USER_TYPES.ADMINISTRATOR)}>
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
            onClick={() => setUserType('')}
            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            ← Change account type
          </button>
        </div>

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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                {...register('firstName', { required: 'First name is required' })}
                error={errors.firstName?.message}
                placeholder="John"
              />
              <Input
                label="Last Name"
                {...register('lastName', { required: 'Last name is required' })}
                error={errors.lastName?.message}
                placeholder="Doe"
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email?.message}
              placeholder="john@example.com"
            />

            <Input
              label="Phone Number"
              type="tel"
              {...register('phone', { required: 'Phone number is required' })}
              error={errors.phone?.message}
              placeholder="+1 (555) 123-4567"
            />

            {userType === USER_TYPES.DRIVER && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <option value="seattle">Seattle, WA</option>
                  <option value="portland">Portland, OR</option>
                  <option value="austin">Austin, TX</option>
                  <option value="miami">Miami, FL</option>
                  <option value="other">Other (Coming Soon)</option>
                </select>
                {errors.city && (
                  <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>
            )}

            <Input
              label="Password"
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
              error={errors.password?.message}
              placeholder="••••••••"
            />

            <Input
              label="Confirm Password"
              type="password"
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              error={errors.confirmPassword?.message}
              placeholder="••••••••"
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                {...register('acceptTerms', { required: 'You must accept the terms' })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
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
      </div>
    </div>
  );
};

export default RegisterPage; 