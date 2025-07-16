import React, { useState } from 'react';
import Button from '../../common/Button';

const TripHistory = ({ driverApplication }) => {
  const [filter, setFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('week');
  
  // Placeholder data - in the future this will come from the backend
  const trips = []; // Empty for now since driver hasn't started yet
  
  const filters = [
    { id: 'all', name: 'All Trips' },
    { id: 'completed', name: 'Completed' },
    { id: 'cancelled', name: 'Cancelled' }
  ];

  const timeframes = [
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'all', name: 'All Time' }
  ];

  const getTripStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'no-show':
        return '👻';
      default:
        return '🚗';
    }
  };

  const getTripStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'no-show':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };



  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Trip History</h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filters.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            
            {/* Time Filter */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeframes.map(tf => (
                <option key={tf.id} value={tf.id}>{tf.name}</option>
              ))}
            </select>
            
            <Button variant="outline" size="sm">
              Export Trips
            </Button>
          </div>
        </div>
      </div>

      {/* Trip List */}
      <div className="bg-white rounded-lg shadow">
        {trips.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trips Yet</h3>
            <p className="text-gray-600 mb-6">
              Once you go online and start accepting rides, your trip history will appear here.
            </p>
            <div className="max-w-md mx-auto">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">What you'll see here:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Trip details and earnings</li>
                  <li>• Pickup and dropoff locations</li>
                  <li>• Rider ratings and feedback</li>
                  <li>• Distance and duration</li>
                  <li>• Tips and total earnings</li>
                </ul>
              </div>
              <Button variant="primary" className="w-full">
                Go Online to Start Driving
              </Button>
            </div>
          </div>
        ) : (
          /* Trip List - This will be populated when trips exist */
          <div className="divide-y divide-gray-200">
            {trips.map((trip) => (
              <div key={trip.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">{getTripStatusIcon(trip.status)}</span>
                    <div>
                      <div className="font-medium text-gray-900">Trip #{trip.id}</div>
                      <div className="text-sm text-gray-600">{trip.date} at {trip.time}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">${trip.total}</div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTripStatusColor(trip.status)}`}>
                      {trip.status}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Pickup</div>
                    <div className="font-medium">{trip.pickup}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Dropoff</div>
                    <div className="font-medium">{trip.dropoff}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Distance & Time</div>
                    <div className="font-medium">{trip.distance} • {trip.duration}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Rider Rating</div>
                    <div className="flex items-center">
                      <span className="font-medium mr-1">{trip.rating}</span>
                      <span className="text-yellow-400">★</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex space-x-4 text-sm">
                    <span><strong>Fare:</strong> ${trip.fare}</span>
                    <span><strong>Tips:</strong> ${trip.tips}</span>
                    <span><strong>Total:</strong> ${trip.total}</span>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trip Summary Stats - Show even when empty for future reference */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">0</div>
          <div className="text-sm text-gray-600">Total Trips</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-green-600">$0.00</div>
          <div className="text-sm text-gray-600">Total Earnings</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">0.0</div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-yellow-600">0%</div>
          <div className="text-sm text-gray-600">Acceptance Rate</div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Performance Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Coming Soon</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Peak earning hours analysis</li>
              <li>• Route efficiency recommendations</li>
              <li>• Customer feedback summaries</li>
              <li>• Monthly performance reports</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Achievement Badges</h4>
            <div className="text-sm text-gray-600">
              Earn badges for great service, high ratings, and milestones. 
              Your first badge awaits when you complete your first trip!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripHistory; 