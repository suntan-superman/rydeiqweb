import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile } from '../../services/authService';
import Button from '../common/Button';
import Input from '../common/Input';
import PhoneInput from '../common/PhoneInput';
import ProfilePictureUpload from '../common/ProfilePictureUpload';
import toast from 'react-hot-toast';

const RiderProfileCard = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast.error('First name and last name are required');
        return;
      }

      // Validate phone number format
      const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        toast.error('Please enter a valid phone number');
        return;
      }

      // Update user profile
      const result = await updateUserProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`
      });

      if (result.success) {
        // Update user context with new data
        setUser(prev => ({
          ...prev,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`
        }));
        
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(result.error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
  };

  const handleProfilePictureUpdate = (updates) => {
    setUser(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
        <Button
          size="small"
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Profile Picture</h3>
          <ProfilePictureUpload
            user={user}
            onUpdate={handleProfilePictureUpdate}
            required={true}
            disabled={!isEditing}
            size="large"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <Input
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={!isEditing}
              placeholder="Enter first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <Input
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={!isEditing}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            value={user?.email || ''}
            disabled={true}
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <PhoneInput
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            disabled={!isEditing}
            placeholder="(555) 123-4567"
          />
          {isEditing && (
            <p className="text-xs text-gray-500 mt-1">
              Phone number is used for ride notifications and driver contact
            </p>
          )}
        </div>

        {isEditing && (
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSaveProfile}
              loading={loading}
              disabled={loading}
              size="small"
            >
              Save Changes
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="small"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderProfileCard;
