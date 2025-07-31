import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import driverToolsService from '../../services/driverToolsService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const DriverToolsDashboard = () => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');

  // Refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    try {
      const data = await driverToolsService.getDriverToolsDashboard(user.uid, timeRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }, [user.uid, timeRange]);

  // Initialize driver tools service
  const initializeDriverTools = useCallback(async () => {
    try {
      setLoading(true);
      const result = await driverToolsService.initialize();
      
      if (result.success) {
        setIsInitialized(true);
        await refreshDashboard();
        toast.success('Driver Tools Dashboard initialized successfully');
      } else {
        toast.error('Failed to initialize Driver Tools Dashboard');
      }
    } catch (error) {
      console.error('Failed to initialize driver tools:', error);
      toast.error('Failed to initialize Driver Tools Dashboard');
    } finally {
      setLoading(false);
    }
  }, [refreshDashboard]);

  // Initialize driver tools service
  useEffect(() => {
    initializeDriverTools();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      refreshDashboard();
    }, 5 * 60 * 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [initializeDriverTools, refreshDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'earnings', name: 'Earnings Optimization', icon: '💰' },
    { id: 'coaching', name: 'Performance Coaching', icon: '🎯' },
    { id: 'maintenance', name: 'Vehicle Maintenance', icon: '🔧' },
    { id: 'fuel', name: 'Fuel Optimization', icon: '⛽' },
    { id: 'taxes', name: 'Tax Preparation', icon: '📋' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'gamification', name: 'Achievements', icon: '🏆' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab dashboardData={dashboardData} />;
      case 'earnings':
        return <EarningsTab dashboardData={dashboardData} />;
      case 'coaching':
        return <CoachingTab dashboardData={dashboardData} />;
      case 'maintenance':
        return <MaintenanceTab dashboardData={dashboardData} />;
      case 'fuel':
        return <FuelTab dashboardData={dashboardData} />;
      case 'taxes':
        return <TaxesTab dashboardData={dashboardData} />;
      case 'analytics':
        return <AnalyticsTab dashboardData={dashboardData} />;
      case 'gamification':
        return <GamificationTab dashboardData={dashboardData} />;
      default:
        return <OverviewTab dashboardData={dashboardData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Tools Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Optimize your earnings, improve performance, and grow your business
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isInitialized ? 'Tools Active' : 'Tools Inactive'}
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

// Overview Tab
const OverviewTab = ({ dashboardData }) => {
  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-600">Loading driver tools...</p>
      </div>
    );
  }

  const { profile, performance, recommendations } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Driver Overview</h2>
      
      {/* Profile Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">👤</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Rating</p>
              <p className="text-2xl font-bold text-blue-900">{profile.rating || 0}/5.0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-green-900">Total Rides</p>
              <p className="text-2xl font-bold text-green-900">{profile.totalRides || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Avg Earnings</p>
              <p className="text-2xl font-bold text-purple-900">${performance.overview?.averageEarningsPerRide || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Completion Rate</p>
              <p className="text-2xl font-bold text-orange-900">{performance.overview?.completionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      {performance?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Performance Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed Rides:</span>
                <span className="font-medium text-green-600">{performance.overview.completedRides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cancelled Rides:</span>
                <span className="font-medium text-red-600">{performance.overview.cancelledRides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Earnings:</span>
                <span className="font-medium">${performance.overview.totalEarnings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Rating:</span>
                <span className="font-medium">{performance.overview.averageRating}/5.0</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Today's Recommendations</h3>
            <div className="space-y-2">
              {recommendations?.daily?.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="text-blue-500 mt-1">•</div>
                  <span className="text-sm text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Earnings Tab
const EarningsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { earnings } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Earnings Optimization</h2>
      
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-blue-900">This Week</p>
              <p className="text-2xl font-bold text-blue-900">${earnings.projections?.nextWeek || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-green-900">This Month</p>
              <p className="text-2xl font-bold text-green-900">${earnings.projections?.nextMonth || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Confidence</p>
              <p className="text-2xl font-bold text-purple-900">{earnings.projections?.confidence || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Recommendations */}
      {earnings?.recommendations && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Optimization Strategies</h3>
            <div className="space-y-3">
              {earnings.strategies?.map((strategy, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{strategy.strategy}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {strategy.potential}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {strategy.effort}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Optimal Times</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Peak Hours:</span>
                <div className="text-sm text-gray-600 mt-1">
                  {earnings.optimalTimes?.peakHours?.join(', ')}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Best Days:</span>
                <div className="text-sm text-gray-600 mt-1">
                  {earnings.optimalTimes?.bestDays?.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Coaching Tab
const CoachingTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { coaching } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Performance Coaching</h2>
      
      {/* Coaching Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Performance Insights</h3>
          <div className="space-y-3">
            {coaching.insights?.map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                insight.type === 'positive' ? 'bg-green-50 border border-green-200' :
                insight.type === 'improvement' ? 'bg-blue-50 border border-blue-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className="text-sm text-gray-700">{insight.insight}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Personalized Tips</h3>
          <div className="space-y-2">
            {coaching.tips?.map((tip, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="text-blue-500 mt-1">💡</div>
                <div>
                  <span className="text-sm font-medium text-gray-700">{tip.tip}</span>
                  <span className="text-xs text-gray-500 ml-2">({tip.category})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Improvement Plan */}
      {coaching.improvementPlan && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Improvement Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Short Term</h4>
              <ul className="space-y-1">
                {coaching.improvementPlan.shortTerm?.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600">• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Medium Term</h4>
              <ul className="space-y-1">
                {coaching.improvementPlan.mediumTerm?.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600">• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Long Term</h4>
              <ul className="space-y-1">
                {coaching.improvementPlan.longTerm?.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600">• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Maintenance Tab
const MaintenanceTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { maintenance } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Vehicle Maintenance</h2>
      
      {/* Vehicle Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Vehicle</p>
              <p className="text-lg font-bold text-blue-900">{maintenance.make} {maintenance.model}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📏</div>
            <div>
              <p className="text-sm font-medium text-green-900">Mileage</p>
              <p className="text-2xl font-bold text-green-900">{maintenance.mileage?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🔧</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Last Service</p>
              <p className="text-lg font-bold text-purple-900">
                {maintenance.lastService ? new Date(maintenance.lastService).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">⚠️</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Alerts</p>
              <p className="text-2xl font-bold text-orange-900">{maintenance.alerts?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Alerts */}
      {maintenance.alerts && maintenance.alerts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Maintenance Alerts</h3>
          <div className="space-y-3">
            {maintenance.alerts.map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                alert.priority === 'high' ? 'bg-red-50 border-red-200' :
                alert.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-700">{alert.message}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                    alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Recommendations */}
      {maintenance.recommendations && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Service Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {maintenance.recommendations.map((service, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900">{service.service}</h4>
                <p className="text-sm text-gray-600">Cost: ${service.cost}</p>
                <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                  service.urgency === 'high' ? 'bg-red-100 text-red-800' :
                  service.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {service.urgency} priority
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Fuel Tab
const FuelTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { fuel } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Fuel Optimization</h2>
      
      {/* Fuel Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">⛽</div>
            <div>
              <p className="text-sm font-medium text-blue-900">MPG</p>
              <p className="text-2xl font-bold text-blue-900">{fuel.efficiency?.mpg || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-green-900">Cost/Mile</p>
              <p className="text-2xl font-bold text-green-900">${fuel.efficiency?.costPerMile || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Efficiency</p>
              <p className="text-2xl font-bold text-purple-900">{fuel.efficiency?.efficiency || 'Good'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">💵</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Monthly Savings</p>
              <p className="text-2xl font-bold text-orange-900">${fuel.savings?.monthly || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fuel Prices */}
      {fuel.prices && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Current Fuel Prices</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Regular:</span>
                <span className="font-medium">${fuel.prices.regular}/gallon</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Premium:</span>
                <span className="font-medium">${fuel.prices.premium}/gallon</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Diesel:</span>
                <span className="font-medium">${fuel.prices.diesel}/gallon</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Trend:</span>
                <span className="font-medium capitalize">{fuel.prices.trend}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Optimization Tips</h3>
            <div className="space-y-2">
              {fuel.recommendations?.map((rec, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{rec.recommendation}</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Save ${rec.savings}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Taxes Tab
const TaxesTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { taxes } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Tax Preparation</h2>
      
      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Gross Earnings</p>
              <p className="text-2xl font-bold text-blue-900">${taxes.summary?.grossEarnings || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-green-900">Net Earnings</p>
              <p className="text-2xl font-bold text-green-900">${taxes.summary?.netEarnings || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">📋</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Estimated Tax</p>
              <p className="text-2xl font-bold text-purple-900">${taxes.summary?.estimatedTax || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">💼</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Self-Employment Tax</p>
              <p className="text-2xl font-bold text-orange-900">${taxes.summary?.selfEmploymentTax || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Expense Tracking</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fuel:</span>
              <span className="font-medium">${taxes.expenses?.fuel || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Maintenance:</span>
              <span className="font-medium">${taxes.expenses?.maintenance || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Insurance:</span>
              <span className="font-medium">${taxes.expenses?.insurance || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Phone:</span>
              <span className="font-medium">${taxes.expenses?.phone || 0}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>Total Deductions:</span>
                <span>${taxes.deductions?.total || 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Quarterly Payments</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount per Quarter:</span>
              <span className="font-medium">${taxes.estimatedTax?.quarterly || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Estimated Tax:</span>
              <span className="font-medium">${taxes.estimatedTax?.total || 0}</span>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Due Dates:</h4>
              <div className="space-y-1">
                {taxes.estimatedTax?.dueDates?.map((date, index) => (
                  <div key={index} className="text-sm text-gray-600">• {date}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Tab
const AnalyticsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { analytics } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Driver Analytics</h2>
      
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Earnings Trend</p>
              <p className="text-2xl font-bold text-blue-900">{analytics.trends?.earnings?.change || '+0%'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-green-900">Rides Trend</p>
              <p className="text-2xl font-bold text-green-900">{analytics.trends?.rides?.change || '+0%'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">⭐</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Rating Trend</p>
              <p className="text-2xl font-bold text-purple-900">{analytics.trends?.rating?.change || '+0%'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Insights */}
      {analytics.insights && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Analytics Insights</h3>
          <div className="space-y-2">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="text-blue-500 mt-1">📊</div>
                <span className="text-sm text-gray-700">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Gamification Tab
const GamificationTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { gamification } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Achievements & Rewards</h2>
      
      {/* Points and Level */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">🏆</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Total Points</p>
              <p className="text-2xl font-bold text-blue-900">{gamification.points?.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">⭐</div>
            <div>
              <p className="text-sm font-medium text-green-900">Level</p>
              <p className="text-2xl font-bold text-green-900">{gamification.points?.level || 1}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Progress</p>
              <p className="text-2xl font-bold text-purple-900">{gamification.points?.progress || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {gamification.achievements && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Achievements</h3>
            <div className="space-y-3">
              {gamification.achievements.map((achievement, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  achievement.earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{achievement.name}</span>
                    {achievement.earned ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Earned {achievement.date}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {achievement.progress}% Complete
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Current Challenges</h3>
            <div className="space-y-3">
              {gamification.challenges?.map((challenge, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{challenge.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {challenge.reward} pts
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${challenge.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {challenge.progress}% complete
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverToolsDashboard; 