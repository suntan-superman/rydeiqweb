import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SafetyPreferences from '../components/safety/SafetyPreferences';
import EmergencyContacts from '../components/safety/EmergencyContacts';

const SafetySettingsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('preferences');

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  const tabs = [
    {
      id: 'preferences',
      name: 'Safety Preferences',
      icon: '⚙️',
      description: 'Configure your safety settings and privacy options'
    },
    {
      id: 'contacts',
      name: 'Emergency Contacts',
      icon: '📞',
      description: 'Manage your emergency contacts for safety alerts'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preferences':
        return <SafetyPreferences />;
      case 'contacts':
        return <EmergencyContacts />;
      default:
        return <SafetyPreferences />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Safety Settings</h1>
                <p className="text-sm text-gray-600">Manage your safety and security preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Safety Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Safety Tips</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">During Rides:</h4>
              <ul className="space-y-1">
                <li>• Always verify driver and vehicle details</li>
                <li>• Share your trip with trusted contacts</li>
                <li>• Use the panic button if you feel unsafe</li>
                <li>• Keep emergency contacts updated</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">General Safety:</h4>
              <ul className="space-y-1">
                <li>• Enable location sharing for safety</li>
                <li>• Report any safety incidents immediately</li>
                <li>• Use audio recording for evidence if needed</li>
                <li>• Trust your instincts - if something feels wrong, act</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency Information */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900 mb-3">Emergency Information</h3>
          <div className="text-sm text-red-800 space-y-2">
            <p>
              <strong>In case of emergency:</strong> Use the panic button in the ride tracking page 
              or call emergency services directly at 911.
            </p>
            <p>
              <strong>Support:</strong> Our 24/7 safety team is available to assist you with any 
              safety concerns or incidents.
            </p>
            <p>
              <strong>Privacy:</strong> All safety data is encrypted and stored securely. 
              You can request deletion of your safety data at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetySettingsPage; 