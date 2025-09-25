import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { updateUserProfile } from '../../services/authService';
import toast from 'react-hot-toast';

const ProfilePictureUpload = ({ 
  user, 
  onUpdate, 
  required = false, 
  disabled = false,
  size = 'large' // 'small', 'medium', 'large'
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadProfilePicture(file);
  };

  const uploadProfilePicture = async (file) => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    setUploading(true);
    try {
      // Create storage reference
      const fileExtension = file.name.split('.').pop();
      const fileName = `profile.${fileExtension}`;
      const storageRef = ref(storage, `users/${user.uid}/profile/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update user profile
      const result = await updateUserProfile({
        profilePicture: downloadURL
      });

      if (result.success) {
        // Update user context
        if (onUpdate) {
          onUpdate({ profilePicture: downloadURL });
        }
        
        toast.success('Profile picture updated successfully!');
      } else {
        toast.error(result.error.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!user) return;

    setUploading(true);
    try {
      // Update user profile to remove picture
      const result = await updateUserProfile({
        profilePicture: null
      });

      if (result.success) {
        // Update user context
        if (onUpdate) {
          onUpdate({ profilePicture: null });
        }
        
        setPreview(null);
        toast.success('Profile picture removed');
      } else {
        toast.error(result.error.message || 'Failed to remove profile picture');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast.error('Failed to remove profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const currentPicture = preview || user?.profilePicture;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center`}>
          {currentPicture ? (
            <img
              src={currentPicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-2xl">
              {size === 'small' ? '👤' : size === 'medium' ? '👤' : '👤'}
            </div>
          )}
        </div>
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {currentPicture ? 'Change Photo' : 'Upload Photo'}
          </button>
          
          {currentPicture && !required && (
            <button
              onClick={handleRemovePicture}
              disabled={disabled || uploading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Remove
            </button>
          )}
        </div>

        {required && !currentPicture && (
          <p className="text-sm text-red-600 text-center">
            Profile picture is required
          </p>
        )}
        
        <p className="text-xs text-gray-500 text-center max-w-xs">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
