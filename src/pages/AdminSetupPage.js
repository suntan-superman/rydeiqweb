import React, { useState } from 'react';
import { promoteToSuperAdmin } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const AdminSetupPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePromoteToAdmin = async () => {
    if (!user?.email) {
      toast.error('No user email found');
      return;
    }

    setLoading(true);
    try {
      const result = await promoteToSuperAdmin(user.email);
      
      if (result.success) {
        toast.success('Successfully promoted to Super Admin! Please refresh the page.');
        // Force page refresh to update user context
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.error.message || 'Failed to promote to admin');
      }
    } catch (error) {
      toast.error('Error promoting to admin');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Setup
          </h1>
          <p className="text-gray-600">
            Promote your account to Super Admin to access admin features
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Current User Information
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Email:</span> {user?.email || 'Not available'}
              </div>
              <div>
                <span className="font-medium">Current Role:</span> {user?.role || 'Not set'}
              </div>
              <div>
                <span className="font-medium">User ID:</span> {user?.uid || 'Not available'}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Notice
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This will promote your account to Super Admin role, giving you access to all admin features including onboarding management.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handlePromoteToAdmin}
            loading={loading}
            className="w-full"
            variant="primary"
          >
            {loading ? 'Promoting...' : 'Promote to Super Admin'}
          </Button>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              After promotion, you'll be redirected to the admin dashboard
            </p>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupPage; 