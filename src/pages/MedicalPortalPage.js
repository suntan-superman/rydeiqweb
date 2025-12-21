import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../services/authService';
import MedicalPortalDashboard from '../components/medical/MedicalPortalDashboard';
import MedicalPortalOnboarding from '../components/medical/MedicalPortalOnboarding';

const MedicalPortalPage = () => {
  const { user } = useAuth();

  // Check if user is healthcare provider or super admin
  const isHealthcareProvider = user?.role === USER_ROLES.HEALTHCARE_PROVIDER;
  const isSuperAdmin = user?.role === USER_ROLES.SUPER_ADMIN;
  
  if (!isHealthcareProvider && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This portal is restricted to verified healthcare providers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if healthcare provider needs to complete onboarding
  // Super admins can always access the dashboard
  const isOnboardingComplete = isSuperAdmin || user?.healthcareProvider?.verificationStatus === 'verified';

  return (
    <div className="min-h-screen bg-gray-50">
      {isOnboardingComplete ? (
        <MedicalPortalDashboard user={user} />
      ) : (
        <MedicalPortalOnboarding user={user} />
      )}
    </div>
  );
};

export default MedicalPortalPage;
