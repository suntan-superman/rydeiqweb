import React from 'react';
import Button from '../../common/Button';

const DocumentStatus = ({ driverApplication }) => {
  const documents = driverApplication?.documents || {};
  
  const documentTypes = [
    {
      key: 'drivers_license_front',
      name: "Driver's License (Front)",
      required: true
    },
    {
      key: 'drivers_license_back', 
      name: "Driver's License (Back)",
      required: true
    },
    {
      key: 'vehicle_registration',
      name: 'Vehicle Registration',
      required: true
    },
    {
      key: 'insurance_proof',
      name: 'Insurance Proof',
      required: true
    },
    {
      key: 'profile_photo',
      name: 'Profile Photo',
      required: false
    }
  ];

  const getDocumentStatus = (docKey) => {
    const doc = documents[docKey];
    if (!doc) return 'missing';
    if (doc.verified === true) return 'verified';
    if (doc.verified === false) return 'rejected';
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return '✅';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '❌';
      case 'missing':
        return '📄';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'missing':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Under Review';
      case 'rejected':
        return 'Needs Attention';
      case 'missing':
        return 'Upload Required';
      default:
        return 'Unknown';
    }
  };

  const allRequiredUploaded = documentTypes
    .filter(doc => doc.required)
    .every(doc => documents[doc.key]);

  const allRequiredVerified = documentTypes
    .filter(doc => doc.required)
    .every(doc => documents[doc.key]?.verified === true);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Document Status</h3>
        {!allRequiredUploaded && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/driver-onboarding'}
          >
            Upload Documents
          </Button>
        )}
      </div>

      {/* Overall Status */}
      <div className="mb-6 p-4 rounded-lg border-2 border-dashed">
        {allRequiredVerified ? (
          <div className="flex items-center text-green-600">
            <span className="text-2xl mr-3">🎉</span>
            <div>
              <div className="font-semibold">All Documents Verified!</div>
              <div className="text-sm text-green-600">You're ready to start driving</div>
            </div>
          </div>
        ) : allRequiredUploaded ? (
          <div className="flex items-center text-yellow-600">
            <span className="text-2xl mr-3">⏳</span>
            <div>
              <div className="font-semibold">Documents Under Review</div>
              <div className="text-sm text-yellow-600">We're reviewing your documents. This usually takes 24-48 hours.</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center text-red-600">
            <span className="text-2xl mr-3">📋</span>
            <div>
              <div className="font-semibold">Complete Your Document Upload</div>
              <div className="text-sm text-red-600">Upload all required documents to start the verification process.</div>
            </div>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {documentTypes.map((docType) => {
          const status = getDocumentStatus(docType.key);
          const doc = documents[docType.key];
          
          return (
            <div 
              key={docType.key} 
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center">
                <span className="text-xl mr-3">{getStatusIcon(status)}</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {docType.name}
                    {docType.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  {doc?.uploadedAt && (
                    <div className="text-xs text-gray-500">
                      Uploaded {new Date(doc.uploadedAt.seconds * 1000).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {getStatusText(status)}
                </span>
                
                {(status === 'missing' || status === 'rejected') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/driver-onboarding'}
                  >
                    {status === 'missing' ? 'Upload' : 'Re-upload'}
                  </Button>
                )}
                
                {doc?.downloadURL && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.downloadURL, '_blank')}
                  >
                    View
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Need help?</strong> Make sure your documents are clear, well-lit, and show all required information. 
          If a document is rejected, check the feedback and re-upload a corrected version.
        </div>
      </div>
    </div>
  );
};

export default DocumentStatus; 