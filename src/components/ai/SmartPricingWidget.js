import React, { useState, useEffect } from 'react';
import { aiPricingService } from '../../services/aiPricingService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const SmartPricingWidget = ({ 
  rideRequest, 
  onPriceUpdate, 
  onDemandUpdate,
  className = "" 
}) => {
  const [pricingData, setPricingData] = useState(null);
  const [demandData, setDemandData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [fraudRisk, setFraudRisk] = useState(null);

  // Load pricing and demand data when ride request changes
  useEffect(() => {
    if (rideRequest?.pickup?.coordinates && rideRequest?.destination?.coordinates) {
      loadPricingData();
      loadDemandData();
      checkFraudRisk();
    }
  }, [rideRequest]);

  // Load optimal pricing data
  const loadPricingData = async () => {
    try {
      setLoading(true);
      const pricing = await aiPricingService.calculateOptimalPrice(rideRequest);
      setPricingData(pricing);
      
      if (onPriceUpdate) {
        onPriceUpdate(pricing);
      }
    } catch (error) {
      console.error('Failed to load pricing data:', error);
      toast.error('Failed to calculate optimal pricing');
    } finally {
      setLoading(false);
    }
  };

  // Load demand prediction data
  const loadDemandData = async () => {
    try {
      const demand = await aiPricingService.predictDemand(rideRequest.pickup.coordinates);
      setDemandData(demand);
      
      if (onDemandUpdate) {
        onDemandUpdate(demand);
      }
    } catch (error) {
      console.error('Failed to load demand data:', error);
    }
  };

  // Check fraud risk
  const checkFraudRisk = async () => {
    try {
      const userData = {
        userId: 'current-user', // Would get from auth context
        rating: 4.5,
        rideCount: 25
      };
      
      const fraudResult = await aiPricingService.detectFraud(rideRequest, userData);
      setFraudRisk(fraudResult);
    } catch (error) {
      console.error('Failed to check fraud risk:', error);
    }
  };

  // Get demand level color
  const getDemandLevelColor = (demand) => {
    if (demand > 40) return 'text-red-600 bg-red-50';
    if (demand > 25) return 'text-orange-600 bg-orange-50';
    if (demand > 15) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  // Get demand level text
  const getDemandLevelText = (demand) => {
    if (demand > 40) return 'Very High';
    if (demand > 25) return 'High';
    if (demand > 15) return 'Medium';
    return 'Low';
  };

  // Get fraud risk color
  const getFraudRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-600">Calculating optimal pricing...</span>
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
            <span className="text-xl">🤖</span>
            <div>
              <h3 className="text-lg font-medium text-gray-900">AI Smart Pricing</h3>
              <p className="text-sm text-gray-600">Real-time market analysis and optimal pricing</p>
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
        {/* Optimal Price Display */}
        {pricingData && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Optimal Price</span>
              <span className="text-xs text-gray-500">
                Confidence: {Math.round(pricingData.confidence * 100)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              ${pricingData.price}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Base fare: ${pricingData.baseFare} + Dynamic adjustments
            </div>
          </div>
        )}

        {/* Demand Indicator */}
        {demandData && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Demand</span>
              <span className="text-xs text-gray-500">
                {demandData.demand} rides/hour
              </span>
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDemandLevelColor(demandData.demand)}`}>
              {getDemandLevelText(demandData.demand)} Demand
            </div>
          </div>
        )}

        {/* Fraud Risk Indicator */}
        {fraudRisk && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Security Check</span>
              <span className="text-xs text-gray-500">
                Risk: {fraudRisk.riskLevel}
              </span>
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFraudRiskColor(fraudRisk.riskLevel)}`}>
              {fraudRisk.riskLevel === 'high' ? '⚠️ High Risk' : 
               fraudRisk.riskLevel === 'medium' ? '⚠️ Medium Risk' : '✅ Low Risk'}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={loadPricingData}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            🔄 Refresh Pricing
          </Button>
          <Button
            onClick={loadDemandData}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            📊 Update Demand
          </Button>
        </div>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* Pricing Breakdown */}
          {pricingData && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Pricing Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Fare:</span>
                  <span className="font-medium">${pricingData.baseFare}</span>
                </div>
                {pricingData.multipliers && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Demand Multiplier:</span>
                      <span className="font-medium">x{pricingData.multipliers.demand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Multiplier:</span>
                      <span className="font-medium">x{pricingData.multipliers.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weather Multiplier:</span>
                      <span className="font-medium">x{pricingData.multipliers.weather}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event Multiplier:</span>
                      <span className="font-medium">x{pricingData.multipliers.event}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-1 border-t border-gray-200">
                  <span className="text-gray-900 font-medium">Commission:</span>
                  <span className="font-medium">{Math.round(pricingData.commission * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Demand Factors */}
          {demandData && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Demand Factors</h4>
              <div className="space-y-1 text-sm">
                {demandData.factors && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Demand:</span>
                      <span className="font-medium">{demandData.factors.baseDemand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hourly Pattern:</span>
                      <span className="font-medium">x{demandData.factors.hourlyMultiplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily Pattern:</span>
                      <span className="font-medium">x{demandData.factors.dailyMultiplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location Factor:</span>
                      <span className="font-medium">x{demandData.factors.locationMultiplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weather Impact:</span>
                      <span className="font-medium">x{demandData.factors.weatherMultiplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event Impact:</span>
                      <span className="font-medium">x{demandData.factors.eventMultiplier}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Market Insights */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Market Insights</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">💡</span>
                <span className="text-gray-700">
                  {demandData?.demand > 30 
                    ? 'High demand area - consider premium pricing'
                    : demandData?.demand > 15
                    ? 'Moderate demand - standard pricing optimal'
                    : 'Low demand area - competitive pricing recommended'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">💰</span>
                <span className="text-gray-700">
                  {pricingData?.demandSupplyRatio > 1.5
                    ? 'Supply constrained - pricing power high'
                    : 'Good supply - competitive pricing needed'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">🎯</span>
                <span className="text-gray-700">
                  {fraudRisk?.riskLevel === 'high'
                    ? 'High fraud risk detected - additional verification recommended'
                    : fraudRisk?.riskLevel === 'medium'
                    ? 'Medium fraud risk - standard verification'
                    : 'Low fraud risk - proceed normally'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">AI Recommendations</h4>
            <div className="space-y-2 text-sm">
              {pricingData && (
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 mt-0.5">✅</span>
                  <span className="text-gray-700">
                    Optimal price calculated based on {Math.round(pricingData.confidence * 100)}% confidence
                  </span>
                </div>
              )}
              {demandData && (
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">📊</span>
                  <span className="text-gray-700">
                    Demand prediction: {demandData.demand} rides/hour with {Math.round(demandData.confidence * 100)}% accuracy
                  </span>
                </div>
              )}
              {fraudRisk && (
                <div className="flex items-start space-x-2">
                  <span className="text-orange-600 mt-0.5">🛡️</span>
                  <span className="text-gray-700">
                    Security scan completed - {fraudRisk.riskLevel} risk level detected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartPricingWidget; 