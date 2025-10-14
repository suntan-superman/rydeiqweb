import React, { useState, useEffect } from 'react';
import driverReliabilityService from '../../services/driverReliabilityService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const DriverReliabilityPanel = ({ driverId, onClose }) => {
  const [reliabilityData, setReliabilityData] = useState(null);
  const [cancelEvents, setCancelEvents] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustmentScore, setAdjustmentScore] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);

  useEffect(() => {
    loadDriverData();
  }, [driverId]);

  const loadDriverData = async () => {
    try {
      setLoading(true);

      // Load reliability score
      const scoreResult = await driverReliabilityService.getDriverReliabilityScore(driverId);
      if (scoreResult.success) {
        setReliabilityData(scoreResult.data);
        setAdjustmentScore(scoreResult.data.score.toString());
      }

      // Load cancellation events
      const eventsResult = await driverReliabilityService.getDriverCancelEvents(driverId, 10);
      if (eventsResult.success) {
        setCancelEvents(eventsResult.data);
      }

      // Load metrics
      const metricsResult = await driverReliabilityService.getDriverMetrics(driverId, 30);
      if (metricsResult.success) {
        setMetrics(metricsResult.data);
      }

    } catch (error) {
      console.error('Error loading driver reliability data:', error);
      toast.error('Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustScore = async () => {
    try {
      const newScore = parseFloat(adjustmentScore);
      if (isNaN(newScore) || newScore < 0 || newScore > 100) {
        toast.error('Please enter a valid score between 0 and 100');
        return;
      }

      const result = await driverReliabilityService.adjustDriverScore(
        driverId,
        newScore,
        adjustmentReason
      );

      if (result.success) {
        toast.success('Score adjusted successfully');
        setShowAdjustmentForm(false);
        loadDriverData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error adjusting score:', error);
      toast.error('Failed to adjust score');
    }
  };

  const handleUpdateExemption = async (eventId, isExempt) => {
    try {
      const result = await driverReliabilityService.updateCancellationExemption(
        eventId,
        isExempt,
        `Admin ${isExempt ? 'approved' : 'rejected'} exemption`
      );

      if (result.success) {
        toast.success(result.message);
        loadDriverData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error updating exemption:', error);
      toast.error('Failed to update exemption');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!reliabilityData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reliability data found for this driver</p>
        <button
          onClick={onClose}
          className="mt-4 text-green-600 hover:text-green-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Driver Reliability Details</h3>
          <p className="text-sm text-gray-500 mt-1">Driver ID: {driverId}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Score Overview */}
      <div className={`rounded-lg p-6 border-2 ${getScoreColor(reliabilityData.score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-75">Reliability Score</div>
            <div className="text-4xl font-bold mt-2">{reliabilityData.score}</div>
            <div className="text-sm mt-1">{getScoreLabel(reliabilityData.score)}</div>
          </div>
          <button
            onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Adjust Score
          </button>
        </div>

        {reliabilityData.manual_adjustment && (
          <div className="mt-4 pt-4 border-t border-current opacity-50">
            <p className="text-xs">
              Manually adjusted on {new Date(reliabilityData.adjusted_at?.seconds * 1000).toLocaleDateString()}
            </p>
            {reliabilityData.adjustment_reason && (
              <p className="text-xs mt-1">Reason: {reliabilityData.adjustment_reason}</p>
            )}
          </div>
        )}
      </div>

      {/* Adjustment Form */}
      {showAdjustmentForm && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Adjust Reliability Score</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={adjustmentScore}
                onChange={(e) => setAdjustmentScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Adjustment
              </label>
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Explain why you're adjusting this score..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdjustScore}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save Adjustment
              </button>
              <button
                onClick={() => setShowAdjustmentForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-xs text-gray-500">Acceptance Rate</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {((reliabilityData.acceptance_rate || 0) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-xs text-gray-500">Cancellation Rate</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {((reliabilityData.cancellation_rate || 0) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-xs text-gray-500">On-Time Arrival</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {((reliabilityData.ontime_arrival || 0) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-xs text-gray-500">Bid Honoring</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {((reliabilityData.bid_honoring || 0) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Recent Cancellation Events */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900">Recent Cancellation Events</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {cancelEvents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No cancellation events</div>
          ) : (
            cancelEvents.map((event) => (
              <div key={event.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {event.reason_code}
                      </span>
                      {event.validated && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                          Validated
                        </span>
                      )}
                      {!event.provisional && event.validated && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Exempt
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Ride ID: {event.ride_id} • {new Date(event.ts?.seconds * 1000).toLocaleString()}
                    </div>
                    {event.metadata?.reason && (
                      <div className="text-sm text-gray-600 mt-1">{event.metadata.reason}</div>
                    )}
                  </div>
                  
                  {!event.validated && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleUpdateExemption(event.id, true)}
                        className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Approve Exemption
                      </button>
                      <button
                        onClick={() => handleUpdateExemption(event.id, false)}
                        className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Last 30 Days Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Total Rides</div>
            <div className="text-lg font-semibold text-gray-900">
              {reliabilityData.total_rides || 0}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Awarded</div>
            <div className="text-lg font-semibold text-gray-900">
              {metrics.reduce((sum, m) => sum + (m.awarded || 0), 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Accepted</div>
            <div className="text-lg font-semibold text-gray-900">
              {metrics.reduce((sum, m) => sum + (m.accepted || 0), 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Cancelled</div>
            <div className="text-lg font-semibold text-gray-900">
              {metrics.reduce((sum, m) => sum + (m.cancels || 0), 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverReliabilityPanel;


