import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginUser, getAuthErrorMessage, getRedirectPath } from '../../services/authService';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  // Handle browser autofill
  useEffect(() => {
    const handleAutofill = () => {
      // Check for autofilled values and update form
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      
      if (emailInput && emailInput.value) {
        setValue('email', emailInput.value, { shouldValidate: true });
      }
      
      if (passwordInput && passwordInput.value) {
        setValue('password', passwordInput.value, { shouldValidate: true });
      }
    };

    // Listen for autofill events
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');

    if (emailInput) {
      emailInput.addEventListener('animationstart', handleAutofill);
      emailInput.addEventListener('change', handleAutofill);
    }

    if (passwordInput) {
      passwordInput.addEventListener('animationstart', handleAutofill);
      passwordInput.addEventListener('change', handleAutofill);
    }

    // Also check on mount in case autofill happened before component mounted
    setTimeout(handleAutofill, 100);

    return () => {
      if (emailInput) {
        emailInput.removeEventListener('animationstart', handleAutofill);
        emailInput.removeEventListener('change', handleAutofill);
      }
      if (passwordInput) {
        passwordInput.removeEventListener('animationstart', handleAutofill);
        passwordInput.removeEventListener('change', handleAutofill);
      }
    };
  }, [setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      console.log('LoginForm: Starting login process for:', data.email);
      const result = await loginUser(data.email, data.password);
      
      console.log('LoginForm: Login result:', result);
      
      if (result.success) {
        // Set the user state manually to ensure immediate redirection
        console.log('LoginForm: Login successful, user data:', result.user);
        console.log('LoginForm: User role:', result.user.role);
        console.log('LoginForm: Email verified:', result.user.emailVerified);
        setUser(result.user);
        toast.success('Welcome back!');
        
        // Get the appropriate redirect path based on user role
        const redirectPath = getRedirectPath(result.user);
        console.log('LoginForm: Redirecting to:', redirectPath);
        console.log('LoginForm: About to navigate to:', redirectPath);
        navigate(redirectPath);
      } else {
        console.log('LoginForm: Login failed:', result.error);
        const errorMessage = getAuthErrorMessage(result.error.code);
        setError('root', { message: errorMessage });
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('LoginForm: Unexpected error:', error);
      setError('root', { message: 'An unexpected error occurred' });
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="card-header">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Sign in to AnyRyde
          </h2>
          <p className="text-sm text-gray-600 text-center mt-2">
            Welcome back! Please sign in to your account.
          </p>
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                type="email"
                label="Email address"
                placeholder="Enter your email"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
                error={errors.email?.message}
              />
            </div>

            <div>
              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                error={errors.password?.message}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {errors.root && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {errors.root.message}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full inline-flex justify-center"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full inline-flex justify-center"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="ml-2">Facebook</span>
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 