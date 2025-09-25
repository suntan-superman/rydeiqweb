import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DriverEarningsWidget = ({ driverId }) => {
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0
  });
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadEarnings();
    loadRideHistory();
  }, [driverId, timeRange]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      // In production, this would fetch from the earnings service
      const mockEarnings = {
        today: 125.50,
        thisWeek: 847.25,
        thisMonth: 3240.75,
        total: 15680.50
      };
      setEarnings(mockEarnings);
    } catch (error) {
      console.error('Error loading earnings:', error);
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const loadRideHistory = async () => {
    try {
      // In production, this would fetch from the ride service
      const mockRides = [
        {
          id: 'ride1',
          date: '2024-01-15',
          time: '14:30',
          pickup: 'Downtown',
          dropoff: 'Airport',
          fare: 45.50,
          tip: 8.00,
          total: 53.50,
          status: 'completed'
        },
        {
          id: 'ride2',
          date: '2024-01-15',
          time: '16:45',
          pickup: 'Airport',
          dropoff: 'Uptown',
          fare: 38.75,
          tip: 5.00,
          total: 43.75,
          status: 'completed'
        },
        {
          id: 'ride3',
          date: '2024-01-14',
          time: '09:15',
          pickup: 'Suburbs',
          dropoff: 'Downtown',
          fare: 28.25,
          tip: 3.00,
          total: 31.25,
          status: 'completed'
        }
      ];
      setRideHistory(mockRides);
    } catch (error) {
      console.error('Error loading ride history:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // const getEarningsChange = (current, previous) => {
  //   if (previous === 0) return { change: 0, isPositive: true };
  //   const change = ((current - previous) / previous) * 100;
  //   return { change: Math.abs(change), isPositive: change >= 0 };
  // };

  const calculateWeeklyAverage = () => {
    return earnings.thisWeek / 7;
  };

  const calculateHourlyRate = () => {
    // Mock calculation - in production, this would use actual hours worked
    const hoursWorked = 8; // hours per day
    return earnings.today / hoursWorked;
  };

  const getTopEarningRide = () => {
    return rideHistory.reduce((max, ride) => 
      ride.total > max.total ? ride : max, 
      { total: 0 }
    );
  };

  const getTotalRides = () => {
    return rideHistory.length;
  };

  const getAverageFare = () => {
    if (rideHistory.length === 0) return 0;
    const totalFare = rideHistory.reduce((sum, ride) => sum + ride.fare, 0);
    return totalFare / rideHistory.length;
  };

  const getTotalTips = () => {
    return rideHistory.reduce((sum, ride) => sum + (ride.tip || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading earnings...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Earnings</h2>
            <p className="text-gray-600">Track your earnings and performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1d">Today</option>
              <option value="7d">This Week</option>
              <option value="30d">This Month</option>
              <option value="90d">Last 3 Months</option>
            </select>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              title="Toggle Details"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.today)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.thisWeek)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.thisMonth)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.total)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Rides</span>
                <span className="text-sm font-medium text-gray-900">{getTotalRides()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Fare</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(getAverageFare())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Tips</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(getTotalTips())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hourly Rate</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(calculateHourlyRate())}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Daily Average</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(calculateWeeklyAverage())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Best Day</span>
                <span className="text-sm font-medium text-gray-900">Monday</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Peak Hours</span>
                <span className="text-sm font-medium text-gray-900">7-9 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Efficiency</span>
                <span className="text-sm font-medium text-green-600">92%</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Highest Fare</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(getTopEarningRide().total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Best Tip</span>
                <span className="text-sm font-medium text-gray-900">$15.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rating</span>
                <span className="text-sm font-medium text-gray-900">4.8 ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium text-green-600">98%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Rides */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Rides</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View All
          </button>
        </div>

        {rideHistory.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No rides found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rideHistory.map((ride) => (
                  <tr key={ride.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ride.date}</div>
                      <div className="text-sm text-gray-500">{ride.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ride.pickup}</div>
                      <div className="text-sm text-gray-500">→ {ride.dropoff}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(ride.fare)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(ride.tip)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(ride.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {ride.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-4">
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span>Export Data</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          <ChartBarIcon className="h-4 w-4" />
          <span>View Analytics</span>
        </button>
      </div>
    </div>
  );
};

export default DriverEarningsWidget;
