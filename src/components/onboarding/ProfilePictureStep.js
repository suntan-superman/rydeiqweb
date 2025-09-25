import React, { useState, useRef } from 'react';
import { useOnboarding, ONBOARDING_STEPS } from '../../contexts/OnboardingContext';
import Button from '../common/Button';
import OnboardingProgress from './OnboardingProgress';
import toast from 'react-hot-toast';

const ProfilePictureStep = () => {
  const { 
    formData, 
    updateFormData, 
    nextStep, 
    previousStep, 
    validateStep,
    errors
  } = useOnboarding();

  const [selectedImage, setSelectedImage] = useState(formData.profilePicture);
  const [isUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      setSelectedImage(imageUrl);
      updateFormData({ profilePicture: imageUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleImageSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageSelect(files[0]);
    }
  };

  const handleCameraClick = () => {
    // In a real mobile app, this would open the camera
    // For web, we'll simulate camera access
    toast.info('Camera access would be available on mobile devices');
    fileInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    updateFormData({ profilePicture: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = () => {
    const isValid = validateStep(ONBOARDING_STEPS.PROFILE_PICTURE);
    
    if (!isValid) {
      toast.error('Please upload a profile picture to continue');
      return;
    }

    nextStep();
  };

  const handleBack = () => {
    previousStep();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingProgress />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Add a Profile Picture
            </h1>
            <p className="text-gray-600">
              A profile picture is <strong>REQUIRED</strong> and helps drivers identify you and builds trust in the community
            </p>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ Profile picture is MANDATORY - You cannot proceed without uploading one
              </p>
            </div>
          </div>

          {/* Profile Picture Upload Area */}
          <div className="mb-8">
            {selectedImage ? (
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={selectedImage}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Great! Your profile picture is ready.
                </p>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload your profile picture
                </h3>
                <p className="text-gray-500 mb-4">
                  Drag and drop an image here, or click to select
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCameraClick}
                    className="flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Take Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGalleryClick}
                    className="flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Choose from Gallery
                  </Button>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Error message */}
            {errors.profilePicture && (
              <p className="text-red-600 text-sm mt-2 text-center">
                {errors.profilePicture}
              </p>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h4 className="text-sm font-medium text-yellow-800">Photo Guidelines</h4>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Use a clear, recent photo of yourself</li>
                <li>• Face should be clearly visible</li>
                <li>• No sunglasses or face coverings</li>
                <li>• File size must be less than 5MB</li>
                <li>• Supported formats: JPG, PNG, GIF</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isUploading}
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
            </Button>
            
            <Button
              type="button"
              variant="primary"
              onClick={handleContinue}
              disabled={!selectedImage || isUploading}
              className="min-w-[140px]"
            >
              Continue <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureStep;
