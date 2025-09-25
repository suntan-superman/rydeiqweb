import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { USER_TYPES } from '../../services/authService';
import AddUserTypeModal from '../auth/AddUserTypeModal';
import Button from '../common/Button';

const AddProfileCard = () => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(null);

  if (!user || !user.userTypes || user.userTypes.length >= 4) {
    return null;
  }

  // Only show driver option for riders (not admin or healthcare)
  const availableTypes = Object.values(USER_TYPES).filter(type => 
    !user.userTypes.includes(type) && 
    type === USER_TYPES.DRIVER
  );
  
  if (availableTypes.length === 0) {
    return null;
  }

  const getUserTypeInfo = (userType) => {
    switch (userType) {
      case USER_TYPES.DRIVER:
        return {
          label: 'Driver',
          icon: '🚗',
          description: 'Earn money by driving passengers',
          color: 'green'
        };
      case USER_TYPES.PASSENGER:
        return {
          label: 'Rider',
          icon: '👤',
          description: 'Book rides and save money',
          color: 'blue'
        };
      case USER_TYPES.ADMINISTRATOR:
        return {
          label: 'Administrator',
          icon: '⚙️',
          description: 'Manage the platform',
          color: 'purple'
        };
      case USER_TYPES.HEALTHCARE_PROVIDER:
        return {
          label: 'Healthcare Provider',
          icon: '🏥',
          description: 'HIPAA-compliant medical transport',
          color: 'red'
        };
      default:
        return {
          label: userType,
          icon: '👤',
          description: 'Additional profile',
          color: 'gray'
        };
    }
  };

  const handleAddProfile = (userType) => {
    setSelectedUserType(userType);
    setShowAddModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Add More Profiles
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            You can have multiple profiles with the same account. Add another profile to access different features.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableTypes.map((userType) => {
              const info = getUserTypeInfo(userType);
              return (
                <div
                  key={userType}
                  className={`border-2 border-${info.color}-200 rounded-lg p-4 hover:border-${info.color}-300 transition-colors cursor-pointer`}
                  onClick={() => handleAddProfile(userType)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{info.icon}</div>
                    <h4 className="font-medium text-gray-900 mb-1">{info.label}</h4>
                    <p className="text-xs text-gray-600 mb-3">{info.description}</p>
                    <Button
                      size="small"
                      className={`bg-${info.color}-600 hover:bg-${info.color}-700`}
                    >
                      Add Profile
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
    </>
  );
};

export default AddProfileCard;
