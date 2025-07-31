import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { safetyService } from '../../services/safetyService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const SafetyWidget = ({ rideId, rideData, onEmergencyTriggered }) => {
  const { user } = useAuth();
  const [safetyScore, setSafetyScore] = useState(95);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [safetyRecommendations, setSafetyRecommendations] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Load safety data
  const loadSafetyData = useCallback(async () => {
    try {
      // Load safety analytics
      const analytics = await safetyService.getSafetyAnalytics(rideId);
      if (analytics.success) {
        setSafetyScore(analytics.safetyScore);
      }

      // Load emergency contacts
      setEmergencyContacts(safetyService.emergencyContacts);

      // Get safety recommendations
      const recommendations = safetyService.getSafetyRecommendations(rideData);
      setSafetyRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to load safety data:', error);
    }
  }, [rideId, rideData]);

  // Initialize safety service
  useEffect(() => {
    const initializeSafety = async () => {
      if (user?.uid) {
        await safetyService.initialize(user.uid);
        await loadSafetyData();
      }
    };

    initializeSafety();
  }, [user?.uid, loadSafetyData]);

  // Handle panic button
  const handlePanicButton = async () => {
    try {
      // Get current location
      const location = await getCurrentLocation();
      
      const result = await safetyService.triggerPanicButton(
        rideId,
        user.uid,
        location,
        'emergency'
      );

      if (result.success) {
        toast.success('Emergency alert sent! Help is on the way.');
        setShowEmergencyModal(true);
        
        // Notify parent component
        if (onEmergencyTriggered) {
          onEmergencyTriggered(result.emergencyId);
        }
      } else {
        toast.error('Failed to send emergency alert');
      }
    } catch (error) {
      console.error('Panic button error:', error);
      toast.error('Failed to send emergency alert');
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  // Handle audio recording
  const handleAudioRecording = async () => {
    try {
      if (isRecording) {
        const result = await safetyService.stopAudioRecording(rideId);
        if (result.success) {
          setIsRecording(false);
          toast.success('Audio recording stopped');
        }
      } else {
        const result = await safetyService.startAudioRecording(rideId, 'safety');
        if (result.success) {
          setIsRecording(true);
          toast.success('Audio recording started');
        } else {
          toast.error('Failed to start audio recording');
        }
      }
    } catch (error) {
      console.error('Audio recording error:', error);
      toast.error('Audio recording failed');
    }
  };

  // Handle incident report
  const handleIncidentReport = async (incidentData) => {
    try {
      const result = await safetyService.reportIncident(rideId, user.uid, incidentData);
      if (result.success) {
        toast.success('Incident reported successfully');
        setShowIncidentModal(false);
        await loadSafetyData(); // Refresh safety data
      } else {
        toast.error('Failed to report incident');
      }
    } catch (error) {
      console.error('Incident report error:', error);
      toast.error('Failed to report incident');
    }
  };

  // Get safety score color
  const getSafetyScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get safety score background
  const getSafetyScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-4">
      {/* Safety Widget */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Safety</h3>
          <div className={`px-2 py-1 rounded-full text-sm font-medium ${getSafetyScoreBg(safetyScore)} ${getSafetyScoreColor(safetyScore)}`}>
            {safetyScore}/100
          </div>
        </div>

        {/* Emergency Panic Button */}
        <div className="mb-4">
          <Button
            onClick={handlePanicButton}
            variant="danger"
            className="w-full py-3 text-lg font-medium"
          >
            🚨 Emergency Panic Button
          </Button>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Press in case of emergency - immediately notifies contacts and support
          </p>
        </div>

        {/* Safety Controls */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleAudioRecording}
            className={`p-3 rounded-lg border-2 transition-colors ${
              isRecording 
                ? 'border-red-500 bg-red-50 text-red-700' 
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            <div className="text-center">
              <div className="text-xl mb-1">
                {isRecording ? '🔴' : '🎤'}
              </div>
              <div className="text-sm font-medium">
                {isRecording ? 'Recording' : 'Record Audio'}
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowIncidentModal(true)}
            className="p-3 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="text-center">
              <div className="text-xl mb-1">📝</div>
              <div className="text-sm font-medium">Report Issue</div>
            </div>
          </button>
        </div>

        {/* Safety Recommendations */}
        {safetyRecommendations.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Safety Tips</h4>
            <div className="space-y-2">
              {safetyRecommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-xs ${
                    rec.type === 'warning' ? 'bg-red-50 text-red-700' :
                    rec.type === 'info' ? 'bg-blue-50 text-blue-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  {rec.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Contacts */}
        {emergencyContacts.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Emergency Contacts</h4>
            <div className="space-y-1">
              {emergencyContacts.slice(0, 2).map((contact) => (
                <div key={contact.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{contact.name}</span>
                  <span className="text-gray-500">{contact.phone}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">🚨</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Emergency Alert Sent</h3>
              <p className="text-gray-600 mb-4">
                Your emergency contacts and our support team have been notified. 
                Help is on the way.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  • Emergency contacts notified
                </p>
                <p className="text-sm text-gray-500">
                  • Support team alerted
                </p>
                <p className="text-sm text-gray-500">
                  • Location shared
                </p>
                {isRecording && (
                  <p className="text-sm text-gray-500">
                    • Audio recording active
                  </p>
                )}
              </div>
              <Button
                onClick={() => setShowEmergencyModal(false)}
                className="mt-4"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Report Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Safety Incident</h3>
            <IncidentReportForm
              onSubmit={handleIncidentReport}
              onCancel={() => setShowIncidentModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Incident Report Form Component
const IncidentReportForm = ({ onSubmit, onCancel }) => {
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!incidentType || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSubmit({
      type: incidentType,
      description,
      severity,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Incident Type *
        </label>
        <select
          value={incidentType}
          onChange={(e) => setIncidentType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select incident type</option>
          <option value="harassment">Harassment</option>
          <option value="unsafe_driving">Unsafe Driving</option>
          <option value="vehicle_issue">Vehicle Issue</option>
          <option value="route_deviation">Route Deviation</option>
          <option value="payment_issue">Payment Issue</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe what happened..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Severity
        </label>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
        >
          Report Incident
        </Button>
      </div>
    </form>
  );
};

export default SafetyWidget; 