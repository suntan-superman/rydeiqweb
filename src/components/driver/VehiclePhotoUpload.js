import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../contexts/AuthContext';
import { 
  uploadVehiclePhoto, 
  deleteVehiclePhoto, 
  VEHICLE_IMAGE_TYPES,
  validateVehicleImage 
} from '../../services/vehicleImageService';
import toast from 'react-hot-toast';

const VehiclePhotoUpload = ({ currentPhotos = {}, onPhotosUpdate }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState({});
  const [photos, setPhotos] = useState(currentPhotos);

  const handleUpload = async (file, imageType) => {
    setUploading(prev => ({ ...prev, [imageType]: true }));

    try {
      // Validate first
      const validation = await validateVehicleImage(file);
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        setUploading(prev => ({ ...prev, [imageType]: false }));
        return;
      }

      const result = await uploadVehiclePhoto(user.uid, file, imageType);

      if (result.success) {
        const newPhotos = {
          ...photos,
          [imageType]: {
            url: result.url,
            fileName: result.fileName,
            imageType: result.imageType
          }
        };
        
        setPhotos(newPhotos);
        if (onPhotosUpdate) onPhotosUpdate(newPhotos);
        
        toast.success(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} photo uploaded successfully!`);
      } else {
        toast.error(result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(prev => ({ ...prev, [imageType]: false }));
    }
  };

  const handleDelete = async (imageType) => {
    if (!window.confirm(`Delete ${imageType} photo?`)) return;

    try {
      const result = await deleteVehiclePhoto(user.uid, imageType);

      if (result.success) {
        const newPhotos = { ...photos };
        delete newPhotos[imageType];
        
        setPhotos(newPhotos);
        if (onPhotosUpdate) onPhotosUpdate(newPhotos);
        
        toast.success('Photo deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete photo');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Vehicle Photos
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload clear photos of your vehicle. These photos will be shown to riders to help them identify your vehicle.
          <span className="text-red-600 ml-1">* At least one photo is required</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Front Photo */}
        <PhotoUploadCard
          title="Front View"
          description="3/4 front view of your vehicle (Recommended)"
          imageType={VEHICLE_IMAGE_TYPES.FRONT}
          currentPhoto={photos[VEHICLE_IMAGE_TYPES.FRONT]}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploading[VEHICLE_IMAGE_TYPES.FRONT]}
          required
        />

        {/* Side Photo */}
        <PhotoUploadCard
          title="Side View"
          description="Full side profile of your vehicle"
          imageType={VEHICLE_IMAGE_TYPES.SIDE}
          currentPhoto={photos[VEHICLE_IMAGE_TYPES.SIDE]}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploading[VEHICLE_IMAGE_TYPES.SIDE]}
        />

        {/* Back Photo */}
        <PhotoUploadCard
          title="Back View"
          description="Rear view showing license plate (optional)"
          imageType={VEHICLE_IMAGE_TYPES.BACK}
          currentPhoto={photos[VEHICLE_IMAGE_TYPES.BACK]}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploading[VEHICLE_IMAGE_TYPES.BACK]}
        />

        {/* Interior Photo */}
        <PhotoUploadCard
          title="Interior View"
          description="Clean interior view (optional)"
          imageType={VEHICLE_IMAGE_TYPES.INTERIOR}
          currentPhoto={photos[VEHICLE_IMAGE_TYPES.INTERIOR]}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploading[VEHICLE_IMAGE_TYPES.INTERIOR]}
        />
      </div>

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Photo Guidelines
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 ml-7">
          <li>• Take photos in good lighting conditions</li>
          <li>• Ensure vehicle is clean and clearly visible</li>
          <li>• Photos should be between 800x600 and 1920x1080 pixels</li>
          <li>• Maximum file size: 5MB per photo</li>
          <li>• Accepted formats: JPEG, PNG, WebP</li>
          <li>• At least one photo (front view) is required</li>
        </ul>
      </div>
    </div>
  );
};

const PhotoUploadCard = ({ 
  title, 
  description, 
  imageType, 
  currentPhoto, 
  onUpload, 
  onDelete, 
  uploading,
  required 
}) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0], imageType);
    }
  }, [imageType, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 flex items-center">
          {title}
          {required && <span className="ml-2 text-red-600 text-xs">*Required</span>}
        </h4>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>

      {currentPhoto?.url ? (
        <div className="space-y-3">
          <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={currentPhoto.url}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDelete(imageType)}
              className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <button
                disabled={uploading}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-600 mb-1">
                {isDragActive ? 'Drop photo here' : 'Click or drag photo'}
              </p>
              <p className="text-xs text-gray-500">
                JPEG, PNG, WebP (max 5MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VehiclePhotoUpload;

