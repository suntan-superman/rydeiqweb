import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';
import { 
  uploadDriverDocument, 
  deleteDriverDocument, 
  DOCUMENT_TYPES,
  ONBOARDING_STEPS 
} from '../../services/driverService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const VideoEquipmentVerificationForm = () => {
  const { 
    driverApplication, 
    updateStep, 
    goToNextStep, 
    goToPreviousStep,
    saving 
  } = useDriverOnboarding();
  
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState({});
  const [videoCapability, setVideoCapability] = useState({
    hasEquipment: false,
    equipmentType: '',
    equipmentModel: '',
    privacyNoticeAcknowledged: false
  });

  // Initialize documents and video capability from driver application
  useEffect(() => {
    if (driverApplication?.documents) {
      setDocuments(driverApplication.documents);
    }
    if (driverApplication?.videoRecordingCapability) {
      setVideoCapability(driverApplication.videoRecordingCapability);
    }
  }, [driverApplication]);

  // Recommended equipment types
  const equipmentTypes = [
    {
      value: 'vantrue_n2_pro',
      label: 'Vantrue N2 Pro',
      description: 'Dual-channel dashcam with night vision',
      icon: '📹',
      recommended: true
    },
    {
      value: 'viofo_a129_duo_ir',
      label: 'VIOFO A129 Duo IR',
      description: '4K front + IR rear camera',
      icon: '📷',
      recommended: true
    },
    {
      value: 'garmin_tandem',
      label: 'Garmin Dash Cam Tandem',
      description: 'Front and interior recording',
      icon: '🎥',
      recommended: true
    },
    {
      value: 'other',
      label: 'Other Compatible Equipment',
      description: 'Specify your equipment model',
      icon: '📱',
      recommended: false
    }
  ];

  // Video verification document types
  const videoDocumentTypes = [
    {
      key: DOCUMENT_TYPES.DASHCAM_PHOTO,
      title: "Dashcam Installation Photo",
      description: "Upload a clear photo showing your dashcam installed in your vehicle",
      required: true,
      icon: "📸"
    },
    {
      key: DOCUMENT_TYPES.VIDEO_CERTIFICATION,
      title: "Video Recording Certification",
      description: "Upload your completed video recording training certificate",
      required: true,
      icon: "🎓"
    },
    {
      key: DOCUMENT_TYPES.PRIVACY_NOTICE_ACKNOWLEDGMENT,
      title: "Privacy Notice Acknowledgment",
      description: "Upload your signed privacy notice acknowledgment form",
      required: true,
      icon: "📋"
    }
  ];

  const handleFileUpload = async (file, documentType) => {
    if (!file || !driverApplication?.userId) {
      toast.error('Driver application not found. Please refresh the page.');
      return;
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setUploading(true);
    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

    try {
      const result = await uploadDriverDocument(driverApplication.userId, documentType, file);
      
      if (result.success) {
        setDocuments(prev => ({
          ...prev,
          [documentType]: {
            url: result.url,
            fileName: file.name,
            uploadedAt: new Date(),
            verified: false
          }
        }));
        
        setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));
        toast.success(`${getDocumentTitle(documentType)} uploaded successfully!`);
        
        // Clear progress after delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[documentType];
            return newProgress;
          });
        }, 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${getDocumentTitle(documentType)}: ${error.message}`);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[documentType];
        return newProgress;
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentType) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const result = await deleteDriverDocument(driverApplication.userId, documentType);
      
      if (result.success) {
        setDocuments(prev => {
          const newDocuments = { ...prev };
          delete newDocuments[documentType];
          return newDocuments;
        });
        
        toast.success(`${getDocumentTitle(documentType)} deleted successfully!`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete document: ${error.message}`);
    }
  };

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        message: 'Please upload a valid image (JPEG, PNG, WebP) or PDF file'
      };
    }
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        message: 'File size must be less than 10MB'
      };
    }
    
    return { isValid: true };
  };

  const getDocumentTitle = (documentType) => {
    const doc = videoDocumentTypes.find(d => d.key === documentType);
    return doc ? doc.title : documentType;
  };

  const handleVideoCapabilityChange = (field, value) => {
    setVideoCapability(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = async () => {
    // Check if all required documents are uploaded
    const requiredDocs = videoDocumentTypes.filter(doc => doc.required);
    const missingDocs = requiredDocs.filter(doc => !documents[doc.key]);
    
    if (missingDocs.length > 0) {
      const missingTitles = missingDocs.map(doc => doc.title).join(', ');
      toast.error(`Please upload the following required documents: ${missingTitles}`);
      return;
    }

    // Validate video capability data
    if (!videoCapability.hasEquipment) {
      toast.error('Please confirm that you have video recording equipment installed');
      return;
    }

    if (!videoCapability.equipmentType) {
      toast.error('Please select your equipment type');
      return;
    }

    if (videoCapability.equipmentType === 'other' && !videoCapability.equipmentModel) {
      toast.error('Please specify your equipment model');
      return;
    }

    if (!videoCapability.privacyNoticeAcknowledged) {
      toast.error('Please acknowledge the privacy notice');
      return;
    }

    // Prepare video capability data
    const videoCapabilityData = {
      ...videoCapability,
      certificationStatus: 'completed', // Assume they completed training
      certificationCompletedAt: new Date(),
      certificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      equipmentPhotos: {
        [DOCUMENT_TYPES.DASHCAM_PHOTO]: documents[DOCUMENT_TYPES.DASHCAM_PHOTO]
      },
      certificationDocument: documents[DOCUMENT_TYPES.VIDEO_CERTIFICATION],
      privacyNoticeDocument: documents[DOCUMENT_TYPES.PRIVACY_NOTICE_ACKNOWLEDGMENT],
      isVideoCapable: true // Will be set to true after admin verification
    };

    // Update step progress
    const result = await updateStep(ONBOARDING_STEPS.VIDEO_EQUIPMENT_VERIFICATION, {
      documents,
      videoRecordingCapability: videoCapabilityData
    });
    
    if (result.success) {
      goToNextStep();
    }
  };

  const getCompletionStats = () => {
    const requiredDocs = videoDocumentTypes.filter(doc => doc.required);
    const uploadedRequired = requiredDocs.filter(doc => documents[doc.key]).length;
    
    return {
      required: `${uploadedRequired}/${requiredDocs.length}`,
      isComplete: uploadedRequired === requiredDocs.length && 
                  videoCapability.hasEquipment && 
                  videoCapability.equipmentType && 
                  videoCapability.privacyNoticeAcknowledged
    };
  };

  const stats = getCompletionStats();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Recording Equipment Verification</h1>
          <p className="text-gray-600">
            Verify your video recording equipment and complete the required certification process.
          </p>
          
          {/* Progress Stats */}
          <div className="mt-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${stats.isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-gray-600">
                Required Documents: <span className="font-semibold">{stats.required}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${videoCapability.hasEquipment ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">
                Equipment: <span className="font-semibold">{videoCapability.hasEquipment ? 'Confirmed' : 'Pending'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Equipment Information Section */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📹 Equipment Information</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="hasEquipment"
                checked={videoCapability.hasEquipment}
                onChange={(e) => handleVideoCapabilityChange('hasEquipment', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasEquipment" className="text-sm font-medium text-gray-700">
                I have video recording equipment installed in my vehicle
              </label>
            </div>

            {videoCapability.hasEquipment && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {equipmentTypes.map((type) => (
                      <label
                        key={type.value}
                        className={`relative flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                          videoCapability.equipmentType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="equipmentType"
                          value={type.value}
                          checked={videoCapability.equipmentType === type.value}
                          onChange={(e) => handleVideoCapabilityChange('equipmentType', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{type.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{type.label}</span>
                              {type.recommended && (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {videoCapability.equipmentType === 'other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equipment Model *
                    </label>
                    <input
                      type="text"
                      value={videoCapability.equipmentModel || ''}
                      onChange={(e) => handleVideoCapabilityChange('equipmentModel', e.target.value)}
                      placeholder="Enter your equipment model"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="privacyNotice"
                    checked={videoCapability.privacyNoticeAcknowledged}
                    onChange={(e) => handleVideoCapabilityChange('privacyNoticeAcknowledged', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="privacyNotice" className="text-sm font-medium text-gray-700">
                      Privacy Notice Acknowledgment *
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      I acknowledge that I understand the privacy implications of video recording and will comply with all applicable laws and regulations regarding recording passengers.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Documents Section */}
        {videoCapability.hasEquipment && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
            {videoDocumentTypes.map((docType) => (
              <DocumentUploadCard
                key={docType.key}
                documentType={docType}
                document={documents[docType.key]}
                onUpload={(file) => handleFileUpload(file, docType.key)}
                onDelete={() => handleDeleteDocument(docType.key)}
                uploadProgress={uploadProgress[docType.key]}
                isUploading={uploading && uploadProgress[docType.key] !== undefined}
              />
            ))}
          </div>
        )}

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">📋 Important Requirements</h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>• Video recording equipment must be properly installed and functional</li>
            <li>• All recordings must comply with local privacy laws and regulations</li>
            <li>• You must complete video recording training before being approved</li>
            <li>• Equipment will be verified by our admin team before approval</li>
            <li>• Certification is valid for 1 year and must be renewed annually</li>
          </ul>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between pt-8 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={uploading}
          >
            ← Previous Step
          </Button>
          
          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={!stats.isComplete || uploading}
            loading={saving}
          >
            {stats.isComplete ? 'Continue to Next Step' : 'Complete Video Verification'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Individual document upload card component (reused from DocumentUploadForm)
const DocumentUploadCard = ({ 
  documentType, 
  document, 
  onUpload, 
  onDelete, 
  uploadProgress, 
  isUploading 
}) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const getStatusColor = () => {
    if (document?.verified) return 'text-green-600 bg-green-50';
    if (document && !document.verified) return 'text-yellow-600 bg-yellow-50';
    if (documentType.required) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusText = () => {
    if (document?.verified) return '✅ Verified';
    if (document && !document.verified) return '⏳ Pending Review';
    if (documentType.required) return '❌ Required';
    return '○ Optional';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{documentType.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{documentType.title}</h3>
            <p className="text-sm text-gray-600">{documentType.description}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {document ? (
        // Document uploaded state
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-900">{document.fileName}</p>
                <p className="text-sm text-green-600">
                  Uploaded {new Date(document.uploadedAt?.seconds * 1000 || document.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.open(document.url, '_blank')}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                View
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Upload area
        <div>
          {isUploading ? (
            // Upload progress
            <div className="p-8 text-center">
              <LoadingSpinner size="large" />
              <p className="mt-4 text-gray-600">Uploading document...</p>
              {uploadProgress !== undefined && (
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{uploadProgress}% complete</p>
                </div>
              )}
            </div>
          ) : (
            // Drop zone
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                </p>
                <p className="text-sm text-gray-400">or click to browse</p>
                <p className="text-xs text-gray-400 mt-2">
                  JPEG, PNG, WebP or PDF • Max 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoEquipmentVerificationForm;
