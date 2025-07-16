import React, { useState } from 'react';
import Button from '../common/Button';

const DriverBidsList = ({ bids, onSelectDriver, loading }) => {
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [sortBy, setSortBy] = useState('price'); // price, rating, eta

  // Sort bids based on selected criteria
  const sortedBids = [...bids].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.bidAmount - b.bidAmount;
      case 'rating':
        return (b.driverRating || 0) - (a.driverRating || 0);
      case 'eta':
        return a.estimatedArrival - b.estimatedArrival;
      default:
        return a.bidAmount - b.bidAmount;
    }
  });

  const handleSelectDriver = (driverId) => {
    setSelectedBidId(driverId);
    onSelectDriver(driverId);
  };

  const getBidBadge = (bid, index) => {
    if (index === 0 && sortBy === 'price') {
      return { text: 'Best Price', color: 'bg-green-100 text-green-800' };
    }
    if (index === 0 && sortBy === 'rating') {
      return { text: 'Top Rated', color: 'bg-blue-100 text-blue-800' };
    }
    if (index === 0 && sortBy === 'eta') {
      return { text: 'Fastest', color: 'bg-purple-100 text-purple-800' };
    }
    return null;
  };

  const getVehicleIcon = (vehicleType) => {
    const icons = {
      sedan: '🚗',
      suv: '🚙',
      hatchback: '🚗',
      van: '🚐',
      truck: '🚚',
      luxury: '🏎️',
      electric: '⚡',
      hybrid: '🌱'
    };
    return icons[vehicleType?.toLowerCase()] || '🚗';
  };

  const formatETA = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">⭐</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">⭐</span>);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">⭐</span>);
    }
    
    return <div className="flex items-center">{stars}</div>;
  };

  if (!bids || bids.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🕐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Waiting for Driver Bids
          </h3>
          <p className="text-gray-600">
            Drivers in your area will submit their bids shortly. 
            You'll be able to choose the best offer based on price, rating, and arrival time.
          </p>
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with sorting options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Driver Bids ({bids.length})
            </h3>
            <p className="text-sm text-gray-600">
              Choose your preferred driver based on price, rating, and arrival time
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="price">Best Price</option>
              <option value="rating">Highest Rating</option>
              <option value="eta">Fastest Arrival</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bids List */}
      <div className="space-y-4">
        {sortedBids.map((bid, index) => {
          const badge = getBidBadge(bid, index);
          const isLowest = index === 0 && sortBy === 'price';
          
          return (
            <div
              key={bid.driverId}
              className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                isLowest 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-6">
                {/* Header with badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* Driver Avatar */}
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-700">
                        {bid.driverInfo?.firstName?.[0]}{bid.driverInfo?.lastName?.[0]}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {bid.driverInfo?.firstName} {bid.driverInfo?.lastName}
                        </h4>
                        {badge && (
                          <span className={`px-2 py-1 text-xs rounded-full ${badge.color}`}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center space-x-2 mt-1">
                        {renderStarRating(bid.driverRating || 4.5)}
                        <span className="text-sm text-gray-600">
                          ({bid.driverRating?.toFixed(1) || '4.5'}) • {bid.totalRides || 150} rides
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${isLowest ? 'text-green-900' : 'text-gray-900'}`}>
                      ${bid.bidAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      ETA: {formatETA(bid.estimatedArrival)}
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getVehicleIcon(bid.vehicleInfo?.type)}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {bid.vehicleInfo?.year} {bid.vehicleInfo?.make} {bid.vehicleInfo?.model}
                        </div>
                        <div className="text-sm text-gray-600">
                          {bid.vehicleInfo?.color} • {bid.vehicleInfo?.licensePlate}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vehicle Features */}
                  <div className="flex items-center space-x-2">
                    {bid.vehicleInfo?.features?.includes('ac') && (
                      <span className="text-blue-600" title="Air Conditioning">❄️</span>
                    )}
                    {bid.vehicleInfo?.features?.includes('wifi') && (
                      <span className="text-blue-600" title="WiFi">📶</span>
                    )}
                    {bid.vehicleInfo?.features?.includes('charger') && (
                      <span className="text-blue-600" title="Phone Charger">🔌</span>
                    )}
                    {bid.vehicleInfo?.features?.includes('premium') && (
                      <span className="text-purple-600" title="Premium Vehicle">⭐</span>
                    )}
                  </div>
                </div>

                {/* Driver Message */}
                {bid.message && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Driver's note:</span> "{bid.message}"
                    </div>
                  </div>
                )}

                {/* Additional Services */}
                {bid.additionalServices && bid.additionalServices.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Included Services:</div>
                    <div className="flex flex-wrap gap-2">
                      {bid.additionalServices.map((service, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                  <Button
                    variant={isLowest ? "success" : "primary"}
                    onClick={() => handleSelectDriver(bid.driverId)}
                    loading={loading && selectedBidId === bid.driverId}
                    disabled={loading && selectedBidId !== bid.driverId}
                    className="px-6"
                  >
                    {isLowest ? '✓ Choose Best Price' : 'Select This Driver'}
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {bid.completionRate || 98}%
                      </div>
                      <div className="text-xs text-gray-600">Completion Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {bid.responseTime || 45}s
                      </div>
                      <div className="text-xs text-gray-600">Avg Response</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatETA(bid.estimatedArrival)}
                      </div>
                      <div className="text-xs text-gray-600">Arrival Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">💡</span>
            <span className="text-sm text-blue-700 font-medium">
              Price Range: ${Math.min(...bids.map(b => b.bidAmount)).toFixed(2)} - ${Math.max(...bids.map(b => b.bidAmount)).toFixed(2)}
            </span>
          </div>
          <div className="text-sm text-blue-600">
            Average: ${(bids.reduce((sum, bid) => sum + bid.bidAmount, 0) / bids.length).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Competitive Advantage Reminder */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-green-600 text-xl">🏆</span>
          <div>
            <h4 className="text-sm font-medium text-green-900">Why Choose RydeAlong?</h4>
            <p className="text-sm text-green-700 mt-1">
              Unlike other platforms, you see all driver bids and choose based on price, rating, and arrival time. 
              No surge pricing, no hidden fees - just transparent competition that saves you money!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverBidsList; 