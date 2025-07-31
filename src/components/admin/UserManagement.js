import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  promoteToSuperAdmin, 
  fixUserRole, 
  deleteUserCompletely,
  getRoleDisplayName, 
  USER_ROLES 
} from '../../services/authService';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form states
  const [promoteEmail, setPromoteEmail] = useState('');
  const [fixRoleEmail, setFixRoleEmail] = useState('');
  const [newRole, setNewRole] = useState(USER_ROLES.DRIVER);
  const [deleteEmail, setDeleteEmail] = useState('');

  // Check if current user is super admin
  const isSuperAdmin = user?.role === USER_ROLES.SUPER_ADMIN;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Implement getUsers function in authService
      // const result = await getUsers();
      // if (result.success) {
      //   setUsers(result.data);
      // }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handlePromoteToSuperAdmin = async () => {
    if (!promoteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!window.confirm(`Are you sure you want to promote ${promoteEmail} to Super Admin?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await promoteToSuperAdmin(promoteEmail);
      
      if (result.success) {
        toast.success(`User ${promoteEmail} promoted to Super Admin successfully!`);
        setPromoteEmail('');
        loadUsers(); // Refresh user list
      } else {
        toast.error(result.error.message || 'Failed to promote user');
      }
    } catch (error) {
      toast.error('Error promoting user to Super Admin');
      console.error('Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFixUserRole = async () => {
    if (!fixRoleEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!window.confirm(`Are you sure you want to change ${fixRoleEmail}'s role to ${getRoleDisplayName(newRole)}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await fixUserRole(fixRoleEmail, newRole);
      
      if (result.success) {
        toast.success(`User ${fixRoleEmail} role updated from ${result.previousRole} to ${result.newRole} successfully!`);
        setFixRoleEmail('');
        loadUsers(); // Refresh user list
      } else {
        toast.error(result.error.message || 'Failed to fix user role');
      }
    } catch (error) {
      toast.error('Error fixing user role');
      console.error('Error:', error);
    } finally {
      setActionLoading(false);
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

    setActionLoading(true);
    try {
      const result = await deleteUserCompletely(deleteEmail, user);
      
      if (result.success) {
        toast.success(`User ${deleteEmail} deleted successfully! ${result.message}`);
        setDeleteEmail('');
        loadUsers(); // Refresh user list
      } else {
        toast.error(result.error.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
      console.error('Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800">Access Restricted</h3>
              <p className="text-red-700 mt-1">
                Only Super Administrators can access user management. 
                Contact the system administrator for access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading user management..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">
            Manage user roles and permissions (Super Admin Only)
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline">
          🔄 Refresh
        </Button>
      </div>

      {/* Promote to Super Admin */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Promote to Super Admin</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              type="email"
              placeholder="Enter email address to promote"
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={handlePromoteToSuperAdmin}
            loading={actionLoading}
            variant="primary"
            className="w-full"
          >
            Promote to Super Admin
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          This will give the user full administrative access to the system.
        </p>
      </div>

      {/* Fix User Role */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change User Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={fixRoleEmail}
              onChange={(e) => setFixRoleEmail(e.target.value)}
            />
          </div>
          <div>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={USER_ROLES.CUSTOMER}>Customer</option>
              <option value={USER_ROLES.DRIVER}>Driver</option>
              <option value={USER_ROLES.ADMIN}>Admin</option>
              <option value={USER_ROLES.SUPER_ADMIN}>Super Admin</option>
            </select>
          </div>
          <Button
            onClick={handleFixUserRole}
            loading={actionLoading}
            variant="primary"
            className="w-full"
          >
            Update Role
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Change a user's role in the system. Use with caution.
        </p>
      </div>

      {/* Delete User */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              type="email"
              placeholder="Enter email address to delete"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={handleDeleteUser}
            loading={actionLoading}
            variant="danger"
            className="w-full"
          >
            Delete User
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h5 className="text-sm font-medium text-red-800">⚠️ Warning</h5>
              <p className="text-sm text-red-700 mt-1">
                This action will permanently delete the user account and all associated data. 
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User List (Future Enhancement) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User List</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">User list functionality coming soon...</p>
          <p className="text-sm text-gray-400 mt-2">
            This will show all users with their current roles and allow bulk management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 