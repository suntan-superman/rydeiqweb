import React, { useState, useEffect } from 'react';
import driverReliabilityService from '../../services/driverReliabilityService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const ReliabilityDashboard = () => {
  const [stats, setStats] = useState(null);
  const [flaggedDrivers, setFlaggedDrivers] = useState([]);
  const [topDrivers, setTopDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview'); // overview, flagged, top

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load system statistics
      const statsResult = await driverReliabilityService.getSystemStatistics();
      if (statsResult.success) {
        setStats(statsResult.data);
      }

      // Load flagged drivers (low scores)
      const flaggedResult = await driverReliabilityService.getFlaggedDrivers();
      if (flaggedResult.success) {
        setFlaggedDrivers(flaggedResult.data);
      }

      // Load top drivers
      const topResult = await driverReliabilityService.getAllDriverReliabilityScores({
        limitCount: 20,
        sortBy: 'score'
      });
      if (topResult.success) {
        setTopDrivers(topResult.data);
      }

    } catch (error) {
      console.error('Error loading reliability dashboard:', error);
      toast.error('Failed to load reliability data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Driver Reliability Dashboard</h2>
        <p className="text-gray-600 mt-1">Monitor and manage driver reliability scores</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Drivers</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDrivers}</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Average Score</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {stats.averageScore.toFixed(1)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-200 bg-green-50">
            <div className="text-sm font-medium text-green-700">Excellent</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.excellent}</div>
            <div className="text-xs text-green-600 mt-1">90-100</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200 bg-blue-50">
            <div className="text-sm font-medium text-blue-700">Good</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.good}</div>
            <div className="text-xs text-blue-600 mt-1">75-89</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200 bg-red-50">
            <div className="text-sm font-medium text-red-700">Needs Attention</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{stats.fair + stats.low}</div>
            <div className="text-xs text-red-600 mt-1">Below 75</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`${
              selectedTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('flagged')}
            className={`${
              selectedTab === 'flagged'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Flagged Drivers ({flaggedDrivers.length})
          </button>
          <button
            onClick={() => setSelectedTab('top')}
            className={`${
              selectedTab === 'top'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Top Performers
          </button>
        </nav>
      </div>

      {/* Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Excellent (90-100)</span>
                  <span className="font-medium text-green-600">{stats?.excellent || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${((stats?.excellent || 0) / (stats?.totalDrivers || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Good (75-89)</span>
                  <span className="font-medium text-blue-600">{stats?.good || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${((stats?.good || 0) / (stats?.totalDrivers || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Fair (60-74)</span>
                  <span className="font-medium text-yellow-600">{stats?.fair || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${((stats?.fair || 0) / (stats?.totalDrivers || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Low (&lt;60)</span>
                  <span className="font-medium text-red-600">{stats?.low || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${((stats?.low || 0) / (stats?.totalDrivers || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedTab('flagged')}
                className="w-full text-left px-4 py-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Review Flagged Drivers</div>
                    <div className="text-sm text-gray-500">{flaggedDrivers.length} drivers need attention</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={loadData}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Refresh Data</div>
                    <div className="text-sm text-gray-500">Update all reliability metrics</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flagged Drivers Tab */}
      {selectedTab === 'flagged' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Drivers Requiring Attention</h3>
            
            {flaggedDrivers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2">No flagged drivers</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accept Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cancel Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {flaggedDrivers.map((driver) => (
                      <tr key={driver.driverId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {driver.driverId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(driver.score)}`}>
                            {driver.score} - {getScoreLabel(driver.score)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((driver.acceptance_rate || 0) * 100).toFixed(0)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((driver.cancellation_rate || 0) * 100).toFixed(0)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              // Navigate to driver detail view
                              toast.info('Driver detail view - coming soon');
                            }}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Performers Tab */}
      {selectedTab === 'top' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Drivers</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Rides
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      On-Time %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topDrivers.map((driver, index) => (
                    <tr key={driver.driverId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {driver.driverId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(driver.score)}`}>
                          {driver.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {driver.total_rides || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {((driver.ontime_arrival || 0) * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReliabilityDashboard;


