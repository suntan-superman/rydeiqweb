import React, { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../../services/analyticsService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const AnalyticsDashboard = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');

  // Refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    try {
      const data = await analyticsService.getAnalyticsDashboard(timeRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }, [timeRange]);

  // Initialize analytics service
  const initializeAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const result = await analyticsService.initialize();
      
      if (result.success) {
        setIsInitialized(true);
        await refreshDashboard();
        toast.success('Analytics Dashboard initialized successfully');
      } else {
        toast.error('Failed to initialize Analytics Dashboard');
      }
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      toast.error('Failed to initialize Analytics Dashboard');
    } finally {
      setLoading(false);
    }
  }, [refreshDashboard]);

  // Initialize analytics service
  useEffect(() => {
    initializeAnalytics();
    
    // Set up auto-refresh every 2 minutes
    const interval = setInterval(() => {
      refreshDashboard();
    }, 2 * 60 * 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [initializeAnalytics, refreshDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Platform Overview', icon: '📊' },
    { id: 'drivers', name: 'Driver Analytics', icon: '👥' },
    { id: 'riders', name: 'Rider Analytics', icon: '👤' },
    { id: 'revenue', name: 'Revenue Analytics', icon: '💰' },
    { id: 'safety', name: 'Safety Analytics', icon: '🛡️' },
    { id: 'market', name: 'Market Analytics', icon: '📈' },
    { id: 'predictions', name: 'Predictive Analytics', icon: '🔮' },
    { id: 'performance', name: 'Performance Analytics', icon: '⚡' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <PlatformOverviewTab dashboardData={dashboardData} />;
      case 'drivers':
        return <DriverAnalyticsTab dashboardData={dashboardData} />;
      case 'riders':
        return <RiderAnalyticsTab dashboardData={dashboardData} />;
      case 'revenue':
        return <RevenueAnalyticsTab dashboardData={dashboardData} />;
      case 'safety':
        return <SafetyAnalyticsTab dashboardData={dashboardData} />;
      case 'market':
        return <MarketAnalyticsTab dashboardData={dashboardData} />;
      case 'predictions':
        return <PredictiveAnalyticsTab dashboardData={dashboardData} />;
      case 'performance':
        return <PerformanceAnalyticsTab dashboardData={dashboardData} />;
      default:
        return <PlatformOverviewTab dashboardData={dashboardData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive business intelligence and real-time platform analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isInitialized ? 'Analytics Active' : 'Analytics Inactive'}
                </span>
              </div>
              <Button
                onClick={refreshDashboard}
                variant="outline"
                size="sm"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Platform Overview Tab
const PlatformOverviewTab = ({ dashboardData }) => {
  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-600">Loading platform analytics...</p>
      </div>
    );
  }

  const { realTime, platform } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Platform Overview</h2>
      
      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Active Rides</p>
              <p className="text-2xl font-bold text-blue-900">{realTime?.platform?.activeRides || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">👥</div>
            <div>
              <p className="text-sm font-medium text-green-900">Total Drivers</p>
              <p className="text-2xl font-bold text-green-900">{realTime?.platform?.totalDrivers || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">👤</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Total Riders</p>
              <p className="text-2xl font-bold text-purple-900">{realTime?.platform?.totalRiders || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">⚡</div>
            <div>
              <p className="text-sm font-medium text-orange-900">System Health</p>
              <p className="text-2xl font-bold text-orange-900">{realTime?.platform?.systemHealth || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      {platform?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Ride Performance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Rides:</span>
                <span className="font-medium">{platform.overview.totalRides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">{platform.overview.completedRides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completion Rate:</span>
                <span className="font-medium">{platform.overview.completionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Duration:</span>
                <span className="font-medium">{platform.overview.averageDuration} min</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Platform Health</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Health Score:</span>
                <span className="font-medium">{platform.overview.healthScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Response Time:</span>
                <span className="font-medium">{realTime?.platform?.responseTime || 0}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Rides:</span>
                <span className="font-medium">{platform.overview.activeRides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cancelled:</span>
                <span className="font-medium text-red-600">{platform.overview.cancelledRides}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Driver Analytics Tab
const DriverAnalyticsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { realTime, drivers } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Driver Analytics</h2>
      
      {/* Driver Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">👥</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Online Drivers</p>
              <p className="text-2xl font-bold text-blue-900">{realTime?.drivers?.onlineDrivers || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">⭐</div>
            <div>
              <p className="text-sm font-medium text-green-900">Avg Rating</p>
              <p className="text-2xl font-bold text-green-900">{realTime?.drivers?.averageRating || 0}/5.0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Avg Earnings</p>
              <p className="text-2xl font-bold text-purple-900">${realTime?.drivers?.averageEarnings || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">⏱️</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Response Time</p>
              <p className="text-2xl font-bold text-orange-900">{realTime?.drivers?.responseTime || 0}s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Performance */}
      {drivers?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Driver Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Drivers:</span>
                <span className="font-medium">{drivers.overview.totalDrivers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Drivers:</span>
                <span className="font-medium text-green-600">{drivers.overview.activeDrivers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Drivers:</span>
                <span className="font-medium text-blue-600">{drivers.overview.newDrivers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Rating:</span>
                <span className="font-medium">{drivers.overview.averageRating}/5.0</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Earnings Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Earnings:</span>
                <span className="font-medium">${drivers.overview.totalEarnings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Earnings:</span>
                <span className="font-medium">${drivers.overview.averageEarnings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Earnings per Hour:</span>
                <span className="font-medium">${Math.round(drivers.overview.averageEarnings / 8)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Rider Analytics Tab
const RiderAnalyticsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { realTime, riders } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Rider Analytics</h2>
      
      {/* Rider Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">👤</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Active Riders</p>
              <p className="text-2xl font-bold text-blue-900">{realTime?.riders?.activeRiders || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">⭐</div>
            <div>
              <p className="text-sm font-medium text-green-900">Avg Rating</p>
              <p className="text-2xl font-bold text-green-900">{realTime?.riders?.averageRating || 0}/5.0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">😊</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Satisfaction</p>
              <p className="text-2xl font-bold text-purple-900">{realTime?.riders?.satisfactionScore || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🔄</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Retention Rate</p>
              <p className="text-2xl font-bold text-orange-900">{realTime?.riders?.retentionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rider Behavior */}
      {riders?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Rider Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Riders:</span>
                <span className="font-medium">{riders.overview.totalRiders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Riders:</span>
                <span className="font-medium text-green-600">{riders.overview.activeRiders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Riders:</span>
                <span className="font-medium text-blue-600">{riders.overview.newRiders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Rating:</span>
                <span className="font-medium">{riders.overview.averageRating}/5.0</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Behavior Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Rides/Rider:</span>
                <span className="font-medium">{riders.overview.averageRidesPerRider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Retention Rate:</span>
                <span className="font-medium">{riders.overview.retentionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Satisfaction:</span>
                <span className="font-medium">{realTime?.riders?.satisfactionScore || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Revenue Analytics Tab
const RevenueAnalyticsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { realTime, revenue } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Revenue Analytics</h2>
      
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Hourly Revenue</p>
              <p className="text-2xl font-bold text-blue-900">${realTime?.revenue?.hourlyRevenue || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-green-900">Daily Revenue</p>
              <p className="text-2xl font-bold text-green-900">${realTime?.revenue?.dailyRevenue || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Commission Rate</p>
              <p className="text-2xl font-bold text-purple-900">{realTime?.revenue?.commissionRate || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🚀</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Growth Rate</p>
              <p className="text-2xl font-bold text-orange-900">+{realTime?.revenue?.growthRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      {revenue?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Revenue Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Revenue:</span>
                <span className="font-medium">${revenue.overview.totalRevenue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Platform Revenue:</span>
                <span className="font-medium text-green-600">${revenue.overview.platformRevenue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Driver Revenue:</span>
                <span className="font-medium text-blue-600">${revenue.overview.driverRevenue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Fare:</span>
                <span className="font-medium">${revenue.overview.averageFare}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Performance Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Rides:</span>
                <span className="font-medium">{revenue.overview.totalRides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue per Ride:</span>
                <span className="font-medium">${revenue.overview.revenuePerRide}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Growth Rate:</span>
                <span className="font-medium text-green-600">+{realTime?.revenue?.growthRate || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Safety Analytics Tab
const SafetyAnalyticsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { realTime, safety } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Safety Analytics</h2>
      
      {/* Safety Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">🛡️</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Safety Score</p>
              <p className="text-2xl font-bold text-blue-900">{realTime?.safety?.safetyScore || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-green-900">Incident Rate</p>
              <p className="text-2xl font-bold text-green-900">{realTime?.safety?.incidentRate || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">⏱️</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Response Time</p>
              <p className="text-2xl font-bold text-purple-900">{realTime?.safety?.responseTime || 0}s</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">⚠️</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Risk Level</p>
              <p className="text-2xl font-bold text-orange-900 capitalize">{realTime?.safety?.riskLevel || 'low'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Overview */}
      {safety?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Safety Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Incidents:</span>
                <span className="font-medium text-red-600">{safety.overview.totalIncidents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Rides:</span>
                <span className="font-medium">{safety.overview.totalRides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Safety Rate:</span>
                <span className="font-medium text-green-600">{safety.overview.safetyRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Safety Score:</span>
                <span className="font-medium">{safety.overview.averageSafetyScore}/100</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Risk Assessment</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Risk Level:</span>
                <span className="font-medium capitalize">{safety.overview.riskLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Response Time:</span>
                <span className="font-medium">{realTime?.safety?.responseTime || 0}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Safety Score:</span>
                <span className="font-medium">{realTime?.safety?.safetyScore || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Market Analytics Tab
const MarketAnalyticsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { realTime, market } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Market Analytics</h2>
      
      {/* Market Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Demand Level</p>
              <p className="text-2xl font-bold text-blue-900 capitalize">{realTime?.market?.demandLevel || 'medium'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-green-900">Supply Level</p>
              <p className="text-2xl font-bold text-green-900 capitalize">{realTime?.market?.supplyLevel || 'medium'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">⚡</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Market Efficiency</p>
              <p className="text-2xl font-bold text-purple-900">{realTime?.market?.marketEfficiency || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🏆</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Competitive Index</p>
              <p className="text-2xl font-bold text-orange-900">{realTime?.market?.competitiveIndex || 0}/100</p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      {market?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Market Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Demand:</span>
                <span className="font-medium">{market.overview.totalDemand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Supply:</span>
                <span className="font-medium">{market.overview.totalSupply}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Demand/Supply Ratio:</span>
                <span className="font-medium">{market.overview.demandSupplyRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Market Efficiency:</span>
                <span className="font-medium">{market.overview.marketEfficiency}%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Growth & Competition</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Growth Rate:</span>
                <span className="font-medium text-green-600">+{market.overview.growthRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Competitive Index:</span>
                <span className="font-medium">{realTime?.market?.competitiveIndex || 0}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Market Efficiency:</span>
                <span className="font-medium">{realTime?.market?.marketEfficiency || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Predictive Analytics Tab
const PredictiveAnalyticsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Predictive Analytics</h2>
      
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-blue-600 text-2xl mr-3">🔮</div>
          <div>
            <h3 className="text-lg font-medium text-blue-900">AI-Powered Predictions</h3>
            <p className="text-sm text-blue-700">Machine learning insights for business optimization</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Demand Forecast</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Next Hour:</span>
                <span className="font-medium text-green-600">+15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next 4 Hours:</span>
                <span className="font-medium text-blue-600">+8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next 24 Hours:</span>
                <span className="font-medium text-purple-600">+3%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Revenue Projections</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Today:</span>
                <span className="font-medium text-green-600">$12,450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Week:</span>
                <span className="font-medium text-blue-600">$87,230</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Month:</span>
                <span className="font-medium text-purple-600">$342,180</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Analytics Tab
const PerformanceAnalyticsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { realTime } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Performance Analytics</h2>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">⚡</div>
            <div>
              <p className="text-sm font-medium text-blue-900">System Uptime</p>
              <p className="text-2xl font-bold text-blue-900">99.9%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">⏱️</div>
            <div>
              <p className="text-sm font-medium text-green-900">Response Time</p>
              <p className="text-2xl font-bold text-green-900">{realTime?.platform?.responseTime || 0}s</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Error Rate</p>
              <p className="text-2xl font-bold text-purple-900">0.1%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🚀</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Throughput</p>
              <p className="text-2xl font-bold text-orange-900">1,500 req/s</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">API Response Time:</span>
              <span className="font-medium">1.2s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Database Queries:</span>
              <span className="font-medium">45ms avg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cache Hit Rate:</span>
              <span className="font-medium">92%</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Memory Usage:</span>
              <span className="font-medium">68%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">CPU Usage:</span>
              <span className="font-medium">45%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Network Latency:</span>
              <span className="font-medium">85ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 