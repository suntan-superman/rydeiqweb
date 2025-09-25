import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkRiderOnboardingStatus } from '../../services/riderOnboardingService';
import { checkOnboardingStatus } from '../../services/driverService';

const SmartRedirectTest = () => {
  const { user } = useAuth();
  const [riderStatus, setRiderStatus] = useState(null);
  const [driverStatus, setDriverStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkRiderStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await checkRiderOnboardingStatus(user.uid);
      setRiderStatus(result);
    } catch (error) {
      console.error('Error checking rider status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDriverStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await checkOnboardingStatus(user.uid);
      setDriverStatus(result);
    } catch (error) {
      console.error('Error checking driver status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllStatuses = async () => {
    await Promise.all([checkRiderStatus(), checkDriverStatus()]);
  };

  if (!user) {
    return <div className="p-4 text-red-600">Please log in to test the smart redirect system.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Smart Redirect System Test</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Current User Info</h3>
        <div className="bg-gray-50 p-3 rounded text-sm">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>User Type:</strong> {user.userType}</p>
          <p><strong>Active User Type:</strong> {user.activeUserType}</p>
          <p><strong>User Types:</strong> {user.userTypes?.join(', ') || 'None'}</p>
          <p><strong>Onboarding Completed:</strong> {user.onboardingCompleted ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Test Actions</h3>
        <div className="space-x-2">
          <button
            onClick={checkRiderStatus}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Check Rider Status
          </button>
          <button
            onClick={checkDriverStatus}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Check Driver Status
          </button>
          <button
            onClick={checkAllStatuses}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Check All Statuses
          </button>
        </div>
      </div>

      {loading && (
        <div className="mb-4 text-blue-600">Checking statuses...</div>
      )}

      {riderStatus && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Rider Onboarding Status</h3>
          <div className="bg-blue-50 p-3 rounded text-sm">
            <p><strong>Success:</strong> {riderStatus.success ? 'Yes' : 'No'}</p>
            {riderStatus.success && riderStatus.data && (
              <>
                <p><strong>Is Onboarded:</strong> {riderStatus.data.isOnboarded ? 'Yes' : 'No'}</p>
                <p><strong>Needs Onboarding:</strong> {riderStatus.data.needsOnboarding ? 'Yes' : 'No'}</p>
                <p><strong>Has Basic Profile:</strong> {riderStatus.data.hasBasicProfile ? 'Yes' : 'No'}</p>
                <p><strong>Has Preferences:</strong> {riderStatus.data.hasPreferences ? 'Yes' : 'No'}</p>
                <p><strong>Completion %:</strong> {riderStatus.data.completionPercentage}%</p>
              </>
            )}
            {!riderStatus.success && (
              <p><strong>Error:</strong> {riderStatus.error}</p>
            )}
          </div>
        </div>
      )}

      {driverStatus && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Driver Onboarding Status</h3>
          <div className="bg-green-50 p-3 rounded text-sm">
            <p><strong>Success:</strong> {driverStatus.success ? 'Yes' : 'No'}</p>
            {driverStatus.success && driverStatus.data && (
              <>
                <p><strong>Is Onboarded:</strong> {driverStatus.data.isOnboarded ? 'Yes' : 'No'}</p>
                <p><strong>Needs Onboarding:</strong> {driverStatus.data.needsOnboarding ? 'Yes' : 'No'}</p>
                <p><strong>Can Access Full Features:</strong> {driverStatus.data.canAccessFullFeatures ? 'Yes' : 'No'}</p>
              </>
            )}
            {!driverStatus.success && (
              <p><strong>Error:</strong> {driverStatus.error}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800">Expected Behavior</h4>
        <ul className="text-sm text-yellow-700 mt-1 space-y-1">
          <li>• Users with multiple roles should see user type selection modal</li>
          <li>• Users with incomplete onboarding should see continuation modal</li>
          <li>• Fully onboarded users should go directly to their dashboard</li>
          <li>• The system should handle errors gracefully with fallbacks</li>
        </ul>
      </div>
    </div>
  );
};

export default SmartRedirectTest;
