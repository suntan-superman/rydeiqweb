import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRiderOnboarding } from '../../../contexts/RiderOnboardingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadProfilePicture } from '../../../services/profilePictureService';
import Button from '../../common/Button';
import toast from 'react-hot-toast';

const RiderProfilePictureUpload = () => {
  const { riderProfile, updateStep, goToNextStep, goToPreviousStep, ONBOARDING_STEPS } = useRiderOnboarding();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState(riderProfile?.photoURL || user?.photoURL || '');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      const result = await uploadProfilePicture(user.uid, file, 'users');

      if (result.success) {
        setPhotoURL(result.photoURL);
        await updateStep(ONBOARDING_STEPS.PROFILE_PICTURE, {
          photoURL: result.photoURL
        });
        toast.success('Profile picture uploaded!');
      } else {
        toast.error(result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }, [user, updateStep, ONBOARDING_STEPS]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading
  });

  const handleContinue = async () => {
    if (!photoURL) {
      toast.error('Please upload a profile picture before continuing');
      return;
    }
    goToNextStep();
  };

  const handleSkip = () => {
    if (window.confirm('Are you sure you want to skip? A profile picture helps drivers identify you and improves safety.')) {
      goToNextStep();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Picture</h1>
          <p className="text-gray-600">
            Upload a clear photo of yourself. This helps drivers identify you at pickup.
          </p>
        </div>

        <div className="space-y-6">
          {/* Current Photo Preview */}
          {photoURL && (
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={photoURL}
                  alt="Profile"
                  className="w-48 h-48 rounded-full object-cover border-4 border-primary-100"
                />
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              ${photoURL ? 'bg-gray-50' : ''}
            `}
          >
            <input {...getInputProps()} />

            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-600">Uploading your photo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg text-gray-700 mb-2">
                  {isDragActive ? 'Drop your photo here' : photoURL ? 'Click or drag to replace photo' : 'Click or drag photo to upload'}
                </p>
                <p className="text-sm text-gray-500">
                  JPEG, PNG, or WebP (max 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Photo Guidelines
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-7">
              <li>• Use a clear, recent photo of yourself</li>
              <li>• Face should be clearly visible (no sunglasses)</li>
              <li>• Well-lit photo with neutral background</li>
              <li>• No group photos or heavily filtered images</li>
              <li>• This helps drivers identify you at pickup</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={uploading}
            >
              ← Back
            </Button>

            <div className="flex space-x-3">
              {!photoURL && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={uploading}
                >
                  Skip for Now
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                onClick={handleContinue}
                disabled={uploading || !photoURL}
              >
                Continue →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderProfilePictureUpload;

