import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  promoteToSuperAdmin, 
  fixUserRole, 
  deleteUserCompletely,
  deleteCurrentUser,
  getRoleDisplayName, 
  USER_ROLES 
} from '../../services/authService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const SuperUserHelper = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fixRoleEmail, setFixRoleEmail] = useState('');
  const [newRole, setNewRole] = useState(USER_ROLES.DRIVER);
  const [fixLoading, setFixLoading] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteCurrentLoading, setDeleteCurrentLoading] = useState(false);

  const handlePromoteToSuperAdmin = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const result = await promoteToSuperAdmin(email);
      
      if (result.success) {
        toast.success(`User ${email} promoted to Super Admin successfully!`);
        setEmail('');
      } else {
        toast.error(result.error.message || 'Failed to promote user');
      }
    } catch (error) {
      toast.error('Error promoting user to Super Admin');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFixUserRole = async () => {
    if (!fixRoleEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setFixLoading(true);
    try {
      const result = await fixUserRole(fixRoleEmail, newRole);
      
      if (result.success) {
        toast.success(`User ${fixRoleEmail} role updated from ${result.previousRole} to ${result.newRole} successfully!`);
        setFixRoleEmail('');
      } else {
        toast.error(result.error.message || 'Failed to fix user role');
      }
    } catch (error) {
      toast.error('Error fixing user role');
      console.error('Error:', error);
    } finally {
      setFixLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user ${deleteEmail}? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(true);
    try {
      const result = await deleteUserCompletely(deleteEmail, user);
      
      if (result.success) {
        toast.success(`User ${deleteEmail} deleted successfully! ${result.message}`);
        setDeleteEmail('');
      } else {
        toast.error(result.error.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
      console.error('Error:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCurrentUser = async () => {
    if (!window.confirm(`Are you sure you want to delete your own account (${user?.email})? This action cannot be undone and you will be logged out.`)) {
      return;
    }

    setDeleteCurrentLoading(true);
    try {
      const result = await deleteCurrentUser();
      
      if (result.success) {
        toast.success('Your account has been deleted successfully!');
        // The user will be automatically logged out after deletion
      } else {
        toast.error(result.error.message || 'Failed to delete your account');
      }
    } catch (error) {
      toast.error('Error deleting your account');
      console.error('Error:', error);
    } finally {
      setDeleteCurrentLoading(false);
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg max-w-sm z-50 max-h-96 overflow-y-auto">
      <div className="text-sm font-semibold text-yellow-800 mb-3">
        🔧 Development Helper
      </div>
      
      <div className="text-xs text-yellow-700 mb-3">
        Auto-promotion: {user?.email === 'sroy@worksidesoftware.com' ? 'ENABLED' : 'DISABLED'}
      </div>

      {/* Promote to Super Admin */}
      <div className="mb-4">
        <div className="text-xs font-medium text-yellow-800 mb-2">Promote to Super Admin:</div>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-yellow-300 rounded mb-2"
        />
        <Button
          onClick={handlePromoteToSuperAdmin}
          loading={loading}
          size="small"
          className="w-full text-xs"
        >
          Promote to Super Admin
        </Button>
      </div>

      {/* Fix User Role */}
      <div className="mb-4">
        <div className="text-xs font-medium text-yellow-800 mb-2">Fix User Role:</div>
        <input
          type="email"
          placeholder="Enter email"
          value={fixRoleEmail}
          onChange={(e) => setFixRoleEmail(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-yellow-300 rounded mb-2"
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-yellow-300 rounded mb-2"
        >
          <option value={USER_ROLES.CUSTOMER}>Customer</option>
          <option value={USER_ROLES.DRIVER}>Driver</option>
          <option value={USER_ROLES.ADMIN}>Admin</option>
          <option value={USER_ROLES.SUPER_ADMIN}>Super Admin</option>
        </select>
        <Button
          onClick={handleFixUserRole}
          loading={fixLoading}
          size="small"
          className="w-full text-xs"
        >
          Fix User Role
        </Button>
      </div>

      {/* Delete User */}
      <div className="mb-4">
        <div className="text-xs font-medium text-yellow-800 mb-2">Delete User (Admin Only):</div>
        <input
          type="email"
          placeholder="Enter email to delete"
          value={deleteEmail}
          onChange={(e) => setDeleteEmail(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-yellow-300 rounded mb-2"
        />
        <Button
          onClick={handleDeleteUser}
          loading={deleteLoading}
          size="small"
          className="w-full text-xs bg-red-500 hover:bg-red-600"
        >
          Delete User
        </Button>
      </div>

      {/* Delete Current User */}
      <div className="mb-4">
        <div className="text-xs font-medium text-yellow-800 mb-2">Delete Current User:</div>
        <Button
          onClick={handleDeleteCurrentUser}
          loading={deleteCurrentLoading}
          size="small"
          className="w-full text-xs bg-red-600 hover:bg-red-700"
        >
          Delete My Account
        </Button>
      </div>

      {/* Current User Info */}
      <div className="text-xs text-yellow-700">
        <div>Current User: {user?.email}</div>
        <div>Role: {getRoleDisplayName(user?.role)}</div>
      </div>
    </div>
  );
};

export default SuperUserHelper; 