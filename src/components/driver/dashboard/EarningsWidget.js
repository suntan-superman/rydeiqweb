import React, { useState } from 'react';
import Button from '../../common/Button';

const EarningsWidget = ({ driverApplication }) => {
  const [timeframe, setTimeframe] = useState('week');
  
  // Placeholder data - in the future this will come from the backend
  const earningsData = {
    today: { gross: 0, trips: 0, hours: 0 },
    week: { gross: 0, trips: 0, hours: 0 },
    month: { gross: 0, trips: 0, hours: 0 }
  };

  const payoutInfo = driverApplication?.payoutInfo || {};
  
  const timeframes = [
    { id: 'today', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' }
  ];

  const currentData = earningsData[timeframe];

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Earnings Overview</h3>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeframe === tf.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tf.name}
              </button>
            ))}
          </div>
        </div>

        {/* Earnings Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">${currentData.gross.toFixed(2)}</div>
            <div className="text-sm text-green-700">Gross Earnings</div>
          </div>
          
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{currentData.trips}</div>
            <div className="text-sm text-blue-700">Completed Trips</div>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{currentData.hours.toFixed(1)}</div>
            <div className="text-sm text-purple-700">Hours Online</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl font-semibold text-gray-900">$0.00</div>
            <div className="text-xs text-gray-600">Avg per Trip</div>
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">$0.00</div>
            <div className="text-xs text-gray-600">Avg per Hour</div>
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">0%</div>
            <div className="text-xs text-gray-600">Acceptance Rate</div>
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">5.0</div>
            <div className="text-xs text-gray-600">Rating</div>
          </div>
        </div>
      </div>

      {/* Payout Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Bank Account</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bank:</span>
                <span className="font-medium">{payoutInfo.bankName || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account:</span>
                <span className="font-medium">
                  {payoutInfo.accountNumber ? `****${payoutInfo.accountNumber.slice(-4)}` : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frequency:</span>
                <span className="font-medium capitalize">{payoutInfo.payoutFrequency || 'Not set'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Next Payout</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-green-600">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">Next Monday</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium">Direct Deposit</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1">
            View Payout History
          </Button>
          <Button variant="outline" className="flex-1">
            Update Bank Info
          </Button>
          <Button variant="secondary" className="flex-1">
            Request Instant Payout
          </Button>
        </div>
      </div>

      {/* Earnings Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Trend</h3>
        
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <div className="font-medium">Earnings Chart</div>
            <div className="text-sm">Chart will show your earnings over time</div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <strong>Coming Soon:</strong> Detailed earnings charts, trend analysis, and earning projections 
          will be available once you start driving.
        </div>
      </div>

      {/* Tips for Higher Earnings */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Tips to Maximize Earnings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">Drive during peak hours (7-9 AM, 5-7 PM)</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">Accept rides near airports and events</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">Maintain a high rating for more requests</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">Keep your vehicle clean and well-maintained</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">Enable surge pricing notifications</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">Drive in high-demand areas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsWidget; 