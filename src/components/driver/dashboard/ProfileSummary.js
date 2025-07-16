import React, { useState } from 'react';
import Button from '../../common/Button';

const ProfileSummary = ({ driverApplication, onEditComplete }) => {
  const [activeSection, setActiveSection] = useState('personal');
  
  const personalInfo = driverApplication?.personalInfo || {};
  const vehicleInfo = driverApplication?.vehicleInfo || {};
  const backgroundCheck = driverApplication?.backgroundCheck || {};
  const payoutInfo = driverApplication?.payoutInfo || {};
  const availability = driverApplication?.availability || {};
  
  const sections = [
    { id: 'personal', name: 'Personal Info', icon: '👤' },
    { id: 'vehicle', name: 'Vehicle', icon: '🚗' },
    { id: 'background', name: 'Background', icon: '🔒' },
    { id: 'payout', name: 'Payout', icon: '💳' },
    { id: 'availability', name: 'Availability', icon: '📅' }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const formatAddress = (info) => {
    if (!info.address || !info.city || !info.state) return 'Not provided';
    return `${info.address}, ${info.city}, ${info.state} ${info.zipCode}`;
  };

  const getEnabledDays = (schedule) => {
    if (!schedule) return 'Not set';
    const days = Object.entries(schedule)
      .filter(([_, dayInfo]) => dayInfo.enabled)
      .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1));
    return days.length > 0 ? days.join(', ') : 'No days selected';
  };

  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600">Full Name</label>
          <div className="text-gray-900">{personalInfo.firstName} {personalInfo.lastName}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
          <div className="text-gray-900">{formatDate(personalInfo.dateOfBirth)}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Phone Number</label>
          <div className="text-gray-900">{personalInfo.phoneNumber || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Email</label>
          <div className="text-gray-900">{personalInfo.email || 'Not provided'}</div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600">Address</label>
          <div className="text-gray-900">{formatAddress(personalInfo)}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Coverage Area</label>
          <div className="text-gray-900">{personalInfo.coverageArea || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Emergency Contact</label>
          <div className="text-gray-900">
            {personalInfo.emergencyContactName ? 
              `${personalInfo.emergencyContactName} - ${personalInfo.emergencyContactPhone}` : 
              'Not provided'
            }
          </div>
        </div>
      </div>
    </div>
  );

  const renderVehicleInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600">Vehicle</label>
          <div className="text-gray-900">
            {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">License Plate</label>
          <div className="text-gray-900">{vehicleInfo.licensePlate || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Color</label>
          <div className="text-gray-900">{vehicleInfo.color || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Type</label>
          <div className="text-gray-900 capitalize">{vehicleInfo.vehicleType || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Seats</label>
          <div className="text-gray-900">{vehicleInfo.numberOfSeats || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Condition</label>
          <div className="text-gray-900 capitalize">{vehicleInfo.condition || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Insurance Company</label>
          <div className="text-gray-900">{vehicleInfo.insuranceCompany || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Insurance Expiration</label>
          <div className="text-gray-900">{formatDate(vehicleInfo.insuranceExpiration)}</div>
        </div>
      </div>

      {vehicleInfo.features && vehicleInfo.features.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Features</label>
          <div className="flex flex-wrap gap-2">
            {vehicleInfo.features.map((feature, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderBackgroundCheck = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600">SSN</label>
          <div className="text-gray-900">
            {backgroundCheck.ssn ? `***-**-${backgroundCheck.ssn.slice(-4)}` : 'Not provided'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Background Check Status</label>
          <div className="text-gray-900">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              Pending Verification
            </span>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600">Current Address</label>
          <div className="text-gray-900">
            {backgroundCheck.currentAddress ? 
              `${backgroundCheck.currentAddress.street}, ${backgroundCheck.currentAddress.city}, ${backgroundCheck.currentAddress.state} ${backgroundCheck.currentAddress.zipCode}` :
              'Not provided'
            }
          </div>
        </div>
        {backgroundCheck.hasPreviousAddress && backgroundCheck.previousAddress && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600">Previous Address</label>
            <div className="text-gray-900">
              {`${backgroundCheck.previousAddress.street}, ${backgroundCheck.previousAddress.city}, ${backgroundCheck.previousAddress.state} ${backgroundCheck.previousAddress.zipCode}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPayoutInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600">Account Holder</label>
          <div className="text-gray-900">{payoutInfo.accountHolderName || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Bank</label>
          <div className="text-gray-900">{payoutInfo.bankName || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Account Number</label>
          <div className="text-gray-900">
            {payoutInfo.accountNumber ? `****${payoutInfo.accountNumber.slice(-4)}` : 'Not provided'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Account Type</label>
          <div className="text-gray-900 capitalize">{payoutInfo.accountType || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Payout Frequency</label>
          <div className="text-gray-900 capitalize">{payoutInfo.payoutFrequency || 'Not provided'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Minimum Payout</label>
          <div className="text-gray-900">${payoutInfo.minimumPayoutAmount || '0'}</div>
        </div>
      </div>
    </div>
  );

  const renderAvailability = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600">Available Days</label>
          <div className="text-gray-900">{getEnabledDays(availability.weeklySchedule)}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Service Area</label>
          <div className="text-gray-900">{availability.primaryServiceArea || 'Not set'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Service Radius</label>
          <div className="text-gray-900">{availability.serviceRadius ? `${availability.serviceRadius} miles` : 'Not set'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Max Trip Duration</label>
          <div className="text-gray-900">{availability.maxTripDuration ? `${availability.maxTripDuration} minutes` : 'Not set'}</div>
        </div>
      </div>

      {availability.preferredRideTypes && availability.preferredRideTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Preferred Ride Types</label>
          <div className="flex flex-wrap gap-2">
            {availability.preferredRideTypes.map((type, index) => (
              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm capitalize">
                {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'personal':
        return renderPersonalInfo();
      case 'vehicle':
        return renderVehicleInfo();
      case 'background':
        return renderBackgroundCheck();
      case 'payout':
        return renderPayoutInfo();
      case 'availability':
        return renderAvailability();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.name}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="border-t border-gray-200 pt-6">
          {renderSectionContent()}
        </div>

        {/* Edit Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={() => window.location.href = '/driver-onboarding'}
          >
            Edit Profile Information
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummary; 