import React, { useState } from 'react';
import { 
  BuildingOfficeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

const MedicalPortalOnboarding = ({ user }) => {
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    facilityType: '',
    taxId: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    primaryContact: {
      name: '',
      title: '',
      phone: '',
      email: ''
    },
    certifications: [],
    nemtServices: {
      wheelchairAccessible: false,
      stretcherTransport: false,
      oxygenSupport: false,
      ambulatoryAssistance: false
    },
    complianceAgreements: {
      hipaa: false,
      ferpa: false,
      ada: false,
      stateRegulations: false
    }
  });

  const facilityTypes = [
    'Hospital',
    'Clinic',
    'Dialysis Center',
    'Rehabilitation Center',
    'Mental Health Facility',
    'Assisted Living',
    'Home Health Agency',
    'Insurance Provider',
    'Social Services',
    'Other'
  ];

  const certificationOptions = [
    'HIPAA Compliance Officer',
    'Medicare/Medicaid Provider',
    'Joint Commission Accredited',
    'CARF Accredited',
    'State Licensed',
    'NEMT Certified'
  ];

  const handleInputChange = (field, value, nested = null) => {
    if (nested) {
      setFormData(prev => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCertificationChange = (cert, checked) => {
    setFormData(prev => ({
      ...prev,
      certifications: checked
        ? [...prev.certifications, cert]
        : prev.certifications.filter(c => c !== cert)
    }));
  };

  const handleComplianceChange = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      complianceAgreements: {
        ...prev.complianceAgreements,
        [field]: checked
      }
    }));
  };



  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.organizationName && formData.facilityType;
      case 2:
        return formData.primaryContact.name && formData.primaryContact.phone && formData.primaryContact.email;
      case 3:
        return formData.taxId && formData.billingAddress.street && formData.billingAddress.city;
      case 4:
        return Object.values(formData.complianceAgreements).every(val => val === true);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const submitOnboarding = async () => {
    setLoading(true);
    try {
      const updatedHealthcareProvider = {
        ...user.healthcareProvider,
        ...formData,
        verificationStatus: 'pending_review',
        onboardingCompletedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', user.uid), {
        healthcareProvider: updatedHealthcareProvider
      });

      await refreshUser();
      setSubmissionSuccess(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Organization', icon: BuildingOfficeIcon },
    { id: 2, name: 'Contact Info', icon: DocumentTextIcon },
    { id: 3, name: 'Billing', icon: CreditCardIcon },
    { id: 4, name: 'Compliance', icon: ShieldCheckIcon },
    { id: 5, name: 'Complete', icon: CheckCircleIcon }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Organization Information</h3>
              <p className="text-sm text-gray-600">Tell us about your healthcare organization.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Name</label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Facility Type</label>
              <select
                value={formData.facilityType}
                onChange={(e) => handleInputChange('facilityType', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select facility type</option>
                {facilityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Certifications</label>
              <div className="mt-2 space-y-2">
                {certificationOptions.map(cert => (
                  <label key={cert} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.certifications.includes(cert)}
                      onChange={(e) => handleCertificationChange(cert, e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{cert}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Primary Contact Information</h3>
              <p className="text-sm text-gray-600">Who should we contact for account matters?</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                <input
                  type="text"
                  value={formData.primaryContact.name}
                  onChange={(e) => handleInputChange('name', e.target.value, 'primaryContact')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.primaryContact.title}
                  onChange={(e) => handleInputChange('title', e.target.value, 'primaryContact')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={formData.primaryContact.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value, 'primaryContact')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.primaryContact.email}
                  onChange={(e) => handleInputChange('email', e.target.value, 'primaryContact')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Billing Information</h3>
              <p className="text-sm text-gray-600">Set up billing and payment details.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tax ID / EIN</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="XX-XXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Billing Address</label>
              <div className="mt-2 space-y-4">
                <input
                  type="text"
                  value={formData.billingAddress.street}
                  onChange={(e) => handleInputChange('street', e.target.value, 'billingAddress')}
                  placeholder="Street Address"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <input
                    type="text"
                    value={formData.billingAddress.city}
                    onChange={(e) => handleInputChange('city', e.target.value, 'billingAddress')}
                    placeholder="City"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                  <input
                    type="text"
                    value={formData.billingAddress.state}
                    onChange={(e) => handleInputChange('state', e.target.value, 'billingAddress')}
                    placeholder="State"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                  <input
                    type="text"
                    value={formData.billingAddress.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value, 'billingAddress')}
                    placeholder="ZIP Code"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Compliance Agreements</h3>
              <p className="text-sm text-gray-600">Review and accept required compliance standards.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.complianceAgreements.hipaa}
                  onChange={(e) => handleComplianceChange('hipaa', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">HIPAA Compliance</div>
                  <div className="text-sm text-gray-500">
                    I confirm that our organization complies with HIPAA regulations and will handle patient data securely.
                  </div>
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.complianceAgreements.ada}
                  onChange={(e) => handleComplianceChange('ada', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">ADA Compliance</div>
                  <div className="text-sm text-gray-500">
                    We commit to providing accessible transportation services in compliance with ADA requirements.
                  </div>
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.complianceAgreements.stateRegulations}
                  onChange={(e) => handleComplianceChange('stateRegulations', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">State Regulations</div>
                  <div className="text-sm text-gray-500">
                    We agree to comply with all applicable state and local transportation regulations.
                  </div>
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.complianceAgreements.ferpa}
                  onChange={(e) => handleComplianceChange('ferpa', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">FERPA Compliance (if applicable)</div>
                  <div className="text-sm text-gray-500">
                    For educational institutions, we comply with FERPA student privacy requirements.
                  </div>
                </div>
              </label>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Onboarding Complete!</h3>
              <p className="text-sm text-gray-600">
                Your application has been submitted for review. You'll receive an email notification 
                once your account is verified and activated.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="text-sm text-yellow-800">
                <p><strong>Next Steps:</strong></p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Our compliance team will review your application</li>
                  <li>You may be contacted for additional verification</li>
                  <li>Approval typically takes 1-2 business days</li>
                  <li>You'll receive full portal access once approved</li>
                </ul>
              </div>
            </div>

            <button
              onClick={submitOnboarding}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Show success page after submission
  if (submissionSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8 text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600 mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Application Submitted Successfully!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for submitting your healthcare provider application. Your information has been received and is now under review.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">What happens next?</h3>
              <div className="text-left space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</div>
                  <p className="text-blue-800">Our compliance team will review your application and verify your organization details</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</div>
                  <p className="text-blue-800">You may receive a call or email for additional verification if needed</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</div>
                  <p className="text-blue-800">Once approved, you'll receive full access to the Medical Services Portal</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">4</div>
                  <p className="text-blue-800">Approval typically takes 1-2 business days</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">Important Information</h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Keep your contact information up to date for verification calls</li>
                      <li>Ensure your organization's HIPAA compliance documentation is current</li>
                      <li>You'll receive an email confirmation once your application is approved</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                <strong>Application ID:</strong> HP-{user.uid.slice(-8).toUpperCase()}
              </p>
              <p className="text-gray-600">
                <strong>Submitted:</strong> {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
              
              <div className="flex justify-center space-x-4 pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-sm font-medium"
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md text-sm font-medium"
                >
                  Print Confirmation
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need help? Contact our support team at{' '}
                <a href="mailto:healthcare-support@anyryde.com" className="text-green-600 hover:text-green-700">
                  healthcare-support@anyryde.com
                </a>
                {' '}or call{' '}
                <a href="tel:+1-800-555-RIDE" className="text-green-600 hover:text-green-700">
                  (800) 555-RIDE
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Progress Steps */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center justify-between">
          {steps.map((step, stepIdx) => {
            const Icon = step.icon;
            return (
              <li key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 border-2 rounded-full ${
                    currentStep >= step.id
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
                {stepIdx < steps.length - 1 && (
                  <div className={`ml-4 w-16 h-0.5 ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Form Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 4 ? 'Review' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalPortalOnboarding;
