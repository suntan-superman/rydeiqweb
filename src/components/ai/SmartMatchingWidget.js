import React, { useState, useEffect } from 'react';
import { aiPricingService } from '../../services/aiPricingService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const SmartMatchingWidget = ({ 
  rideRequest, 
  availableDrivers, 
  onMatchSelected,
  className = "" 
}) => {
  const [matchingResults, setMatchingResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Perform smart matching when ride request or drivers change
  useEffect(() => {
    if (rideRequest && availableDrivers && availableDrivers.length > 0) {
      performSmartMatching();
    }
  }, [rideRequest, availableDrivers]);

  // Perform AI-powered smart matching
  const performSmartMatching = async () => {
    try {
      setLoading(true);
      const results = await aiPricingService.smartMatching(rideRequest, availableDrivers);
      
      if (results.success) {
        setMatchingResults(results);
        // Auto-select the best match
        if (results.matches && results.matches.length > 0) {
          setSelectedMatch(results.matches[0]);
        }
      } else {
        toast.error('Failed to perform smart matching');
      }
    } catch (error) {
      console.error('Failed to perform smart matching:', error);
      toast.error('Failed to perform smart matching');
    } finally {
      setLoading(false);
    }
  };

  // Handle match selection
  const handleMatchSelection = (match) => {
    setSelectedMatch(match);
    if (onMatchSelected) {
      onMatchSelected(match);
    }
  };

  // Get match score color
  const getMatchScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-blue-600 bg-blue-50';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Get match quality text
  const getMatchQualityText = (score) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-600">Finding optimal driver match...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎯</span>
            <div>
              <h3 className="text-lg font-medium text-gray-900">AI Smart Matching</h3>
              <p className="text-sm text-gray-600">Optimal driver-rider pairing using AI</p>
            </div>
          </div>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            size="sm"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Best Match Display */}
        {selectedMatch && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Recommended Driver</span>
              <span className="text-xs text-gray-500">
                Confidence: {Math.round(matchingResults?.confidence * 100)}%
              </span>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedMatch.driver.name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedMatch.driver.name || 'Driver'}</p>
                    <p className="text-sm text-gray-600">{selectedMatch.driver.vehicleType || 'Standard'} • {selectedMatch.driver.rating || 4.5}⭐</p>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(selectedMatch.score)}`}>
                  {getMatchQualityText(selectedMatch.score)} Match
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span>{Math.round(selectedMatch.driver.distance || 2.5)} km</span>
                </div>
                <div className="flex justify-between">
                  <span>ETA:</span>
                  <span>{Math.round(selectedMatch.driver.eta || 5)} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Match Score:</span>
                  <span className="font-medium">{Math.round(selectedMatch.score * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alternative Matches */}
        {matchingResults?.matches && matchingResults.matches.length > 1 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Alternative Options</h4>
            <div className="space-y-2">
              {matchingResults.matches.slice(1, 3).map((match, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedMatch === match 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMatchSelection(match)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {match.driver.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{match.driver.name || 'Driver'}</p>
                        <p className="text-xs text-gray-600">{match.driver.vehicleType || 'Standard'} • {match.driver.rating || 4.5}⭐</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(match.score)}`}>
                        {Math.round(match.score * 100)}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{Math.round(match.driver.distance || 3)} km</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={performSmartMatching}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            🔄 Refresh Matching
          </Button>
          {selectedMatch && (
            <Button
              onClick={() => handleMatchSelection(selectedMatch)}
              size="sm"
              className="flex-1"
            >
              ✅ Select Driver
            </Button>
          )}
        </div>
      </div>

      {/* Detailed Information */}
      {showDetails && matchingResults && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* Matching Criteria */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Matching Criteria</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Distance Weight:</span>
                <span className="font-medium">30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rating Weight:</span>
                <span className="font-medium">25%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Availability Weight:</span>
                <span className="font-medium">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle Type Weight:</span>
                <span className="font-medium">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Preferences Weight:</span>
                <span className="font-medium">10%</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Matching Performance</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate:</span>
                <span className="font-medium text-green-600">{Math.round(matchingResults.performance?.successRate * 100 || 85)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Rating:</span>
                <span className="font-medium">{matchingResults.performance?.averageRating || 4.7}/5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Response Time:</span>
                <span className="font-medium">{matchingResults.performance?.responseTime || 2.3} min</span>
              </div>
            </div>
          </div>

          {/* Driver Analysis */}
          {selectedMatch && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Driver Analysis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">
                    Distance: {Math.round(selectedMatch.driver.distance || 2.5)} km (optimal range)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">⭐</span>
                  <span className="text-gray-700">
                    Rating: {selectedMatch.driver.rating || 4.5}/5.0 (above average)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600">🚗</span>
                  <span className="text-gray-700">
                    Vehicle: {selectedMatch.driver.vehicleType || 'Standard'} (matches request)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600">⏱️</span>
                  <span className="text-gray-700">
                    ETA: {Math.round(selectedMatch.driver.eta || 5)} minutes (excellent)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">AI Matching Insights</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">🎯</span>
                <span className="text-gray-700">
                  {selectedMatch?.score >= 0.8 
                    ? 'Excellent match found with high compatibility score'
                    : selectedMatch?.score >= 0.6
                    ? 'Good match found with solid compatibility'
                    : 'Fair match found - consider alternatives'
                  }
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 mt-0.5">📊</span>
                <span className="text-gray-700">
                  Matching algorithm analyzed {availableDrivers?.length || 0} available drivers
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-purple-600 mt-0.5">⚡</span>
                <span className="text-gray-700">
                  Response time optimized for best user experience
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartMatchingWidget; 