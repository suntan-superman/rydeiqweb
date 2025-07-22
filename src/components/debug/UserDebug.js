import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isAdmin, isSuperAdmin, USER_ROLES } from '../../services/authService';

const UserDebug = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return <div>No user logged in</div>;
  }

  const adminCheck = isAdmin(user);
  const superAdminCheck = isSuperAdmin(user);

  return (
    <div className="bg-gray-100 p-6 rounded-lg max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">User Debug Information</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">User Object:</h3>
          <pre className="bg-white p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded">
            <h4 className="font-semibold">Role Information:</h4>
            <p><strong>Role:</strong> {user.role || 'undefined'}</p>
            <p><strong>Is Admin:</strong> {adminCheck ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Is Super Admin:</strong> {superAdminCheck ? '✅ Yes' : '❌ No'}</p>
          </div>

          <div className="bg-white p-4 rounded">
            <h4 className="font-semibold">Expected Values:</h4>
            <p><strong>USER_ROLES.ADMIN:</strong> {USER_ROLES.ADMIN}</p>
            <p><strong>USER_ROLES.SUPER_ADMIN:</strong> {USER_ROLES.SUPER_ADMIN}</p>
            <p><strong>Your Role:</strong> {user.role}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded">
          <h4 className="font-semibold">Admin Access Test:</h4>
          <p><strong>Can Access Admin Dashboard:</strong> {adminCheck ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Can Access Onboarding Management:</strong> {user.email === 'sroy@worksidesoftware.com' && superAdminCheck ? '✅ Yes' : '❌ No'}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h4 className="font-semibold text-blue-800">Next Steps:</h4>
          <ul className="text-blue-700 text-sm space-y-1 mt-2">
            <li>• If role is undefined, use the admin setup page at /admin-setup</li>
            <li>• If role is set but admin check fails, check the role value matches exactly</li>
            <li>• If everything looks correct, try refreshing the page</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserDebug; 