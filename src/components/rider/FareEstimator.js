import React, { useState, useEffect } from 'react';
import { useRide } from '../../contexts/RideContext';
import Button from '../common/Button';

const FareEstimator = ({ onRideTypeChange }) => {
  const {
    pickupLocation,
    destinationLocation,
    rideType,
    setRideType,
    estimatedFare,
    updateEstimatedFare,
    RIDE_TYPES
  } = useRide();

  const [fareBreakdown, setFareBreakdown] = useState(null);
  const [competitorFares, setCompetitorFares] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ride type configurations
  const rideTypeConfigs = {
    [RIDE_TYPES.STANDARD]: {
      name: 'Standard',
      description: 'Affordable rides with reliable drivers',
      icon: '🚗',
      features: ['Standard vehicle', 'Professional driver', 'Up to 4 passengers'],
      multiplier: 1.0
    },
    [RIDE_TYPES.PREMIUM]: {
      name: 'Premium',
      description: 'Luxury vehicles and top-rated drivers',
      icon: '🚙',
      features: ['Luxury vehicle', 'Top-rated driver', 'Premium experience'],
      multiplier: 1.5
    },
    [RIDE_TYPES.WHEELCHAIR]: {
      name: 'Wheelchair Accessible',
      description: 'Vehicles equipped for wheelchair access',
      icon: '♿',
      features: ['Wheelchair accessible', 'Trained driver', 'Extra assistance'],
      multiplier: 1.2
    },
    [RIDE_TYPES.PET_FRIENDLY]: {
      name: 'Pet Friendly',
      description: 'Drivers who welcome your furry friends',
      icon: '🐕',
      features: ['Pet-friendly driver', 'Pet seat covers', 'Extra space'],
      multiplier: 1.1
    }
  };

  // Calculate fare breakdown
  useEffect(() => {
    if (pickupLocation && destinationLocation && estimatedFare > 0) {
      calculateFareBreakdown();
      calculateCompetitorFares();
    }
  }, [pickupLocation, destinationLocation, estimatedFare, rideType]);

  const calculateFareBreakdown = () => {
    const config = rideTypeConfigs[rideType];
    const baseFare = estimatedFare / config.multiplier;
    
    const breakdown = {
      baseFare: baseFare * 0.7,
      perMileRate: baseFare * 0.2,
      timeRate: baseFare * 0.1,
      serviceType: baseFare * (config.multiplier - 1),
      total: estimatedFare
    };

    setFareBreakdown(breakdown);
  };

  const calculateCompetitorFares = () => {
    // Simulate competitor pricing (in production, you'd call their APIs or use estimates)
    const basePrice = estimatedFare;
    
    const competitors = {
      uber: {
        name: 'Uber',
        price: basePrice * (1.2 + Math.random() * 0.3), // 20-50% higher
        surgeMultiplier: Math.random() > 0.7 ? 1.5 + Math.random() : 1.0
      },
      lyft: {
        name: 'Lyft',
        price: basePrice * (1.15 + Math.random() * 0.25), // 15-40% higher
        surgeMultiplier: Math.random() > 0.7 ? 1.3 + Math.random() * 0.5 : 1.0
      }
    };

    // Apply surge pricing
    Object.keys(competitors).forEach(key => {
      competitors[key].originalPrice = competitors[key].price;
      competitors[key].price *= competitors[key].surgeMultiplier;
    });

    setCompetitorFares(competitors);
  };

  const handleRideTypeSelection = (newRideType) => {
    setRideType(newRideType);
    if (onRideTypeChange) {
      onRideTypeChange(newRideType);
    }
  };

  const calculateSavings = () => {
    if (!competitorFares) return 0;
    
    const avgCompetitorPrice = (competitorFares.uber.price + competitorFares.lyft.price) / 2;
    return Math.max(0, avgCompetitorPrice - estimatedFare);
  };

  const getSavingsPercentage = () => {
    if (!competitorFares) return 0;
    
    const avgCompetitorPrice = (competitorFares.uber.price + competitorFares.lyft.price) / 2;
    return avgCompetitorPrice > 0 ? ((avgCompetitorPrice - estimatedFare) / avgCompetitorPrice * 100) : 0;
  };

  if (!pickupLocation || !destinationLocation) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">💰</div>
          <p>Select pickup and destination to see fare estimates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ride Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Ride</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(rideTypeConfigs).map(([type, config]) => {
            const isSelected = rideType === type;
            const fareForType = estimatedFare * (config.multiplier / rideTypeConfigs[rideType].multiplier);
            
            return (
              <div
                key={type}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleRideTypeSelection(type)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {config.name}
                        </h4>
                        <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                          {config.description}
                        </p>
                      </div>
                    </div>
                    
                    <ul className="text-xs space-y-1">
                      {config.features.map((feature, index) => (
                        <li key={index} className={`flex items-center ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                          <span className="mr-1">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      ${fareForType.toFixed(2)}
                    </div>
                    {type !== RIDE_TYPES.STANDARD && (
                      <div className="text-xs text-gray-500">
                        {((config.multiplier - 1) * 100).toFixed(0)}% more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fare Breakdown */}
      {fareBreakdown && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fare Breakdown</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Base fare</span>
              <span className="font-medium">${fareBreakdown.baseFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Distance rate</span>
              <span className="font-medium">${fareBreakdown.perMileRate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Time rate</span>
              <span className="font-medium">${fareBreakdown.timeRate.toFixed(2)}</span>
            </div>
            {fareBreakdown.serviceType > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{rideTypeConfigs[rideType].name} service</span>
                <span className="font-medium">${fareBreakdown.serviceType.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">${fareBreakdown.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center text-green-700">
              <span className="mr-2">💡</span>
              <span className="text-sm font-medium">
                Transparent pricing - no surge fees or hidden charges!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Competitor Comparison */}
      {competitorFares && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Price Comparison</h3>
          
          <div className="space-y-4">
            {/* RydeAlong Fare */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <div>
                  <div className="font-medium text-green-900">RydeAlong</div>
                  <div className="text-sm text-green-700">No surge pricing</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-900">${estimatedFare.toFixed(2)}</div>
                <div className="text-sm text-green-600">Best Price 🏆</div>
              </div>
            </div>

            {/* Competitor Fares */}
            {Object.entries(competitorFares).map(([key, competitor]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{competitor.name[0]}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{competitor.name}</div>
                    {competitor.surgeMultiplier > 1.0 && (
                      <div className="text-sm text-red-600">
                        {competitor.surgeMultiplier.toFixed(1)}x surge pricing
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">${competitor.price.toFixed(2)}</div>
                  {competitor.surgeMultiplier > 1.0 && (
                    <div className="text-xs text-gray-500 line-through">
                      ${competitor.originalPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Savings Summary */}
            {calculateSavings() > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    Save ${calculateSavings().toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-700">
                    That's {getSavingsPercentage().toFixed(0)}% less than competitors
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Features */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Why Choose RydeAlong?</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600">💰</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">No Surge Pricing</h4>
              <p className="text-sm text-gray-600">Fair prices even during peak hours</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">🎯</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Driver Choice</h4>
              <p className="text-sm text-gray-600">Drivers compete for your ride</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600">🛡️</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Transparent Pricing</h4>
              <p className="text-sm text-gray-600">See exactly what you're paying for</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600">⭐</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Local Drivers</h4>
              <p className="text-sm text-gray-600">Support independent drivers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FareEstimator; 