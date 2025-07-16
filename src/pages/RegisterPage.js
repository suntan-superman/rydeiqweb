/* eslint-disable */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const RegisterPage = () => {
  const [userType, setUserType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const userData = {
        ...data,
        userType,
        role: userType === 'driver' ? 'driver' : 'rider'
      };
      
      await registerUser(data.email, data.password, userData);
      
      toast.success(`Welcome to RydeAlong! ${userType === 'driver' ? 'Complete your driver onboarding to start earning.' : 'You can now start booking rides!'}`);
      
      if (userType === 'driver') {
        navigate('/driver-onboarding');
      } else {
        navigate('/dashboard');
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Rider Registration */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-primary-200 transition-all duration-300 cursor-pointer group"
                 onClick={() => setUserType('rider')}>
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">I'm a Rider</h2>
                <p className="text-gray-600 mb-6">
                  Book rides, compare prices, and choose your preferred driver
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">No surge pricing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Choose your driver</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Transparent pricing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Save money vs competitors</span>
                  </div>
                </div>

                <Button size="large" className="w-full mt-6">
                  Continue as Rider
                </Button>
              </div>
            </div>

            {/* Driver Registration */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-primary-200 transition-all duration-300 cursor-pointer group"
                 onClick={() => setUserType('driver')}>
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12a3 3 0 006 0m0 0a3 3 0 106 0M9 12H4.5a2.5 2.5 0 000 5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">I'm a Driver</h2>
                <p className="text-gray-600 mb-6">
                  Set your own prices, earn more, and work when you want
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Keep 80-90% of earnings</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Set your own prices</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Flexible scheduling</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Fast payouts available</span>
                  </div>
                </div>

                <Button size="large" className="w-full mt-6 bg-green-600 hover:bg-green-700">
                  Continue as Driver
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
            Create Your {userType === 'driver' ? 'Driver' : 'Rider'} Account
          </h1>
          <p className="text-gray-600">
            {userType === 'driver' 
              ? 'Start earning with RydeAlong - set your own prices and keep more of what you earn'
              : 'Book your first ride with RydeAlong - transparent pricing and driver choice'
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
          {userType === 'driver' && (
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

            {userType === 'driver' && (
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

            {userType === 'driver' && (
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
              {isLoading ? 'Creating Account...' : `Create ${userType === 'driver' ? 'Driver' : 'Rider'} Account`}
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