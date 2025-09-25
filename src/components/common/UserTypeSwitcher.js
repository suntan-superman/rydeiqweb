import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { switchUserType, USER_TYPES } from '../../services/authService';
import AddUserTypeModal from '../auth/AddUserTypeModal';
import toast from 'react-hot-toast';

const UserTypeSwitcher = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(null);

  if (!user || !user.userTypes || user.userTypes.length <= 1) {
    return null;
  }

  // Only show switcher if user has multiple relevant profiles (not admin/healthcare for riders)
  const relevantUserTypes = user.userTypes.filter(type => 
    type === 'passenger' || type === 'driver'
  );
  
  if (relevantUserTypes.length <= 1) {
    return null;
  }

  const handleUserTypeSwitch = async (newUserType) => {
    if (newUserType === user.activeUserType) return;

    setLoading(true);
    try {
      const result = await switchUserType(user, newUserType);
      
      if (result.success) {
        setUser(result.data);
        toast.success(result.message);
        
        // Redirect to appropriate dashboard
        setTimeout(() => {
          if (newUserType === USER_TYPES.DRIVER) {
            window.location.href = '/driver-dashboard';
          } else if (newUserType === USER_TYPES.ADMINISTRATOR) {
            window.location.href = '/admin-dashboard';
          } else if (newUserType === USER_TYPES.HEALTHCARE_PROVIDER) {
            window.location.href = '/medical-portal';
          } else {
            window.location.href = '/dashboard';
          }
        }, 1000);
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      toast.error('Failed to switch user type');
      console.error('User type switch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeLabel = (userType) => {
    switch (userType) {
      case USER_TYPES.DRIVER:
        return 'Driver';
      case USER_TYPES.ADMINISTRATOR:
        return 'Admin';
      case USER_TYPES.HEALTHCARE_PROVIDER:
        return 'Healthcare';
      case USER_TYPES.PASSENGER:
        return 'Rider';
      default:
        return userType;
    }
  };

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case USER_TYPES.DRIVER:
        return '🚗';
      case USER_TYPES.ADMINISTRATOR:
        return '⚙️';
      case USER_TYPES.HEALTHCARE_PROVIDER:
        return '🏥';
      case USER_TYPES.PASSENGER:
        return '👤';
      default:
        return '👤';
    }
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Switch Profile</h3>
          <span className="text-xs text-gray-500">
            {user.userTypes.length} profile{user.userTypes.length > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="space-y-2">
          {relevantUserTypes.map((userType) => (
            <button
              key={userType}
              onClick={() => handleUserTypeSwitch(userType)}
              disabled={loading || userType === user.activeUserType}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                userType === user.activeUserType
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'hover:bg-gray-50 text-gray-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-lg">{getUserTypeIcon(userType)}</span>
              <span className="flex-1 text-left">{getUserTypeLabel(userType)}</span>
              {userType === user.activeUserType && (
                <span className="text-primary-600 text-xs font-medium">Active</span>
              )}
            </button>
          ))}
        </div>
        
        {!user.userTypes.includes(USER_TYPES.DRIVER) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              Want to start driving?
            </p>
            <button
              onClick={() => {
                setSelectedUserType(USER_TYPES.DRIVER);
                setShowAddModal(true);
              }}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Add Driver Profile →
            </button>
          </div>
        )}
      </div>
      
      {/* Add User Type Modal */}
      <AddUserTypeModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedUserType(null);
        }}
        userType={selectedUserType}
      />
    </div>
  );
};

export default UserTypeSwitcher;
