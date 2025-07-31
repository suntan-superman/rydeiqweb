import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { safetyService } from '../../services/safetyService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const SafetyPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSafetyPreferences = useCallback(async () => {
    try {
      setLoading(true);
      await safetyService.initialize(user.uid);
      setPreferences(safetyService.safetyPreferences);
    } catch (error) {
      console.error('Failed to load safety preferences:', error);
      toast.error('Failed to load safety preferences');
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadSafetyPreferences();
    }
  }, [user?.uid, loadSafetyPreferences]);

  // Update preference
  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save preferences
  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const result = await safetyService.updateSafetyPreferences(user.uid, preferences);
      if (result.success) {
        toast.success('Safety preferences updated successfully');
      } else {
        toast.error('Failed to update safety preferences');
      }
    } catch (error) {
      console.error('Save preferences error:', error);
      toast.error('Failed to update safety preferences');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all safety preferences to default?')) {
      const defaultPreferences = safetyService.getDefaultSafetyPreferences();
      setPreferences(defaultPreferences);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 bg-gray-200 rounded w-4"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Safety Preferences</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure your safety settings and privacy options
        </p>
      </div>

      {/* Emergency Features */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Features</h3>
        
        <div className="space-y-4">
          <PreferenceToggle
            title="Panic Button"
            description="Enable emergency panic button during rides"
            enabled={preferences.panicButtonEnabled}
            onChange={(value) => handlePreferenceChange('panicButtonEnabled', value)}
            icon="🚨"
          />

          <PreferenceToggle
            title="Audio Recording"
            description="Allow automatic audio recording during safety incidents"
            enabled={preferences.enableAudioRecording}
            onChange={(value) => handlePreferenceChange('enableAudioRecording', value)}
            icon="🎤"
          />

          <PreferenceToggle
            title="Location Sharing"
            description="Share location with emergency contacts during incidents"
            enabled={preferences.enableLocationSharing}
            onChange={(value) => handlePreferenceChange('enableLocationSharing', value)}
            icon="📍"
          />

          <PreferenceToggle
            title="Auto Share Location"
            description="Automatically share location with emergency contacts for all rides"
            enabled={preferences.autoShareLocation}
            onChange={(value) => handlePreferenceChange('autoShareLocation', value)}
            icon="🔄"
            warning="This will share your location for every ride"
          />
        </div>
      </div>

      {/* Communication & Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Communication & Notifications</h3>
        
        <div className="space-y-4">
          <PreferenceToggle
            title="Emergency Contacts"
            description="Allow emergency contacts to be notified during safety incidents"
            enabled={preferences.enableEmergencyContacts}
            onChange={(value) => handlePreferenceChange('enableEmergencyContacts', value)}
            icon="📞"
          />

          <PreferenceToggle
            title="Safety Notifications"
            description="Receive safety alerts and recommendations"
            enabled={preferences.safetyNotifications}
            onChange={(value) => handlePreferenceChange('safetyNotifications', value)}
            icon="🔔"
          />

          <PreferenceToggle
            title="Incident Reporting"
            description="Enable reporting of safety incidents and issues"
            enabled={preferences.enableIncidentReporting}
            onChange={(value) => handlePreferenceChange('enableIncidentReporting', value)}
            icon="📝"
          />
        </div>
      </div>

      {/* Background Checks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Background Checks</h3>
        
        <div className="space-y-4">
          <PreferenceToggle
            title="Driver Background Checks"
            description="Only accept rides from drivers who have passed background checks"
            enabled={preferences.enableBackgroundChecks}
            onChange={(value) => handlePreferenceChange('enableBackgroundChecks', value)}
            icon="🔍"
          />
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Background checks help ensure driver safety and reliability. 
            Disabling this may reduce ride availability but could compromise safety.
          </p>
        </div>
      </div>

      {/* Privacy Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Privacy & Data Usage</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Audio recordings are only stored during safety incidents and are automatically deleted after 30 days</p>
          <p>• Location data is only shared with emergency contacts when explicitly triggered</p>
          <p>• All safety data is encrypted and stored securely</p>
          <p>• You can request deletion of your safety data at any time</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          onClick={handleResetDefaults}
          variant="outline"
          className="flex-1"
        >
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSavePreferences}
          disabled={saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};

// Preference Toggle Component
const PreferenceToggle = ({ 
  title, 
  description, 
  enabled, 
  onChange, 
  icon, 
  warning 
}) => {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-lg">{icon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
            {warning && (
              <p className="text-xs text-orange-600 mt-1">{warning}</p>
            )}
          </div>
          
          <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyPreferences; 