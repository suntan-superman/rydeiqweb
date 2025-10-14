import React, { useState, useEffect } from 'react';
import driverReliabilityService from '../../services/driverReliabilityService';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const ReliabilityConfigPanel = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const result = await driverReliabilityService.getReliabilityConfig();
      if (result.success) {
        setConfig(result.data);
      } else {
        toast.error('Failed to load configuration');
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error loading configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await driverReliabilityService.updateReliabilityConfig(config);
      
      if (result.success) {
        toast.success('Configuration saved successfully');
        setHasChanges(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      setHasChanges(true);
      return newConfig;
    });
  };

  const addExemptCode = () => {
    const code = prompt('Enter new exempt cancellation code:');
    if (code && code.trim()) {
      updateConfig('EXEMPT_CANCEL_CODES', [...config.EXEMPT_CANCEL_CODES, code.trim().toUpperCase()]);
    }
  };

  const removeExemptCode = (code) => {
    updateConfig(
      'EXEMPT_CANCEL_CODES',
      config.EXEMPT_CANCEL_CODES.filter(c => c !== code)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12 text-gray-500">
        Failed to load configuration
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Reliability System Configuration</h3>
          <p className="text-sm text-gray-500 mt-1">Manage reliability scoring and anti-gaming settings</p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            loading={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Save Changes
          </Button>
        )}
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-yellow-700">
              You have unsaved changes. Click "Save Changes" to apply them.
            </p>
          </div>
        </div>
      )}

      {/* Score Calculation Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Score Calculation</h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score Window (Days)
              </label>
              <input
                type="number"
                value={config.SCORE_WINDOW_DAYS}
                onChange={(e) => updateConfig('SCORE_WINDOW_DAYS', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Number of days to include in score calculation</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Awarded Rides
              </label>
              <input
                type="number"
                value={config.SCORE_MIN_AWARDED}
                onChange={(e) => updateConfig('SCORE_MIN_AWARDED', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum rides needed to calculate score</p>
            </div>
          </div>

          {/* Score Weights */}
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Score Component Weights</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Acceptance Rate (AR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.SCORE_WEIGHTS.AR}
                  onChange={(e) => updateConfig('SCORE_WEIGHTS.AR', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Cancellation Rate (CR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.SCORE_WEIGHTS.CR}
                  onChange={(e) => updateConfig('SCORE_WEIGHTS.CR', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  On-Time Arrival (OTA)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.SCORE_WEIGHTS.OTA}
                  onChange={(e) => updateConfig('SCORE_WEIGHTS.OTA', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Bid Honoring (BH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.SCORE_WEIGHTS.BH}
                  onChange={(e) => updateConfig('SCORE_WEIGHTS.BH', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Weights should sum to 1.0. Current total: {Object.values(config.SCORE_WEIGHTS).reduce((a, b) => a + b, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Anti-Gaming Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Anti-Gaming Controls</h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancel Cooldown (Seconds)
              </label>
              <input
                type="number"
                value={config.CANCEL_GLOBAL_COOLDOWN_SEC}
                onChange={(e) => updateConfig('CANCEL_GLOBAL_COOLDOWN_SEC', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Cooldown after canceling an awarded ride</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                On-Time Threshold (Minutes)
              </label>
              <input
                type="number"
                value={config.ON_TIME_THRESHOLD_MIN}
                onChange={(e) => updateConfig('ON_TIME_THRESHOLD_MIN', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum minutes late to count as on-time</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bid Edit Limit Per Ride
              </label>
              <input
                type="number"
                value={config.BID_EDIT_LIMIT_PER_RIDE}
                onChange={(e) => updateConfig('BID_EDIT_LIMIT_PER_RIDE', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Max bid changes allowed per ride</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bid Edit Window (Seconds)
              </label>
              <input
                type="number"
                value={config.BID_EDIT_LIMIT_WINDOW_SEC}
                onChange={(e) => updateConfig('BID_EDIT_LIMIT_WINDOW_SEC', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Time window for counting bid changes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exempt Cancellation Codes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Exempt Cancellation Codes</h4>
          <button
            onClick={addExemptCode}
            className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            + Add Code
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">
          Cancellations with these codes won't trigger cooldowns or affect reliability scores
        </p>
        
        <div className="flex flex-wrap gap-2">
          {config.EXEMPT_CANCEL_CODES.map((code) => (
            <div
              key={code}
              className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
            >
              <span className="font-medium text-gray-700">{code}</span>
              <button
                onClick={() => removeExemptCode(code)}
                className="text-gray-400 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            loading={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Save Configuration
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReliabilityConfigPanel;


