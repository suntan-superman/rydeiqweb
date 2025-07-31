import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sustainabilityService } from '../../services/sustainabilityService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const SustainabilityDashboard = () => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');

  // Refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    try {
      const data = await sustainabilityService.getSustainabilityDashboard(user.uid, timeRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }, [user.uid, timeRange]);

  // Initialize sustainability service
  const initializeSustainability = useCallback(async () => {
    try {
      setLoading(true);
      const result = await sustainabilityService.initialize();
      
      if (result.success) {
        setIsInitialized(true);
        await refreshDashboard();
        toast.success('Sustainability Dashboard initialized successfully');
      } else {
        toast.error('Failed to initialize Sustainability Dashboard');
      }
    } catch (error) {
      console.error('Failed to initialize sustainability:', error);
      toast.error('Failed to initialize Sustainability Dashboard');
    } finally {
      setLoading(false);
    }
  }, [refreshDashboard]);

  // Initialize sustainability service
  useEffect(() => {
    initializeSustainability();
    
    // Set up auto-refresh every 15 minutes
    const interval = setInterval(() => {
      refreshDashboard();
    }, 15 * 60 * 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [initializeSustainability, refreshDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '🌱' },
    { id: 'carbon', name: 'Carbon Footprint', icon: '🌍' },
    { id: 'initiatives', name: 'Green Initiatives', icon: '🌿' },
    { id: 'drivers', name: 'Eco Drivers', icon: '🚗' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'offsets', name: 'Carbon Offsets', icon: '🌳' },
    { id: 'impact', name: 'Environmental Impact', icon: '♻️' },
    { id: 'rewards', name: 'Green Rewards', icon: '🏆' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab dashboardData={dashboardData} />;
      case 'carbon':
        return <CarbonTab dashboardData={dashboardData} />;
      case 'initiatives':
        return <InitiativesTab dashboardData={dashboardData} />;
      case 'drivers':
        return <DriversTab dashboardData={dashboardData} />;
      case 'analytics':
        return <AnalyticsTab dashboardData={dashboardData} />;
      case 'offsets':
        return <OffsetsTab dashboardData={dashboardData} />;
      case 'impact':
        return <ImpactTab dashboardData={dashboardData} />;
      case 'rewards':
        return <RewardsTab dashboardData={dashboardData} />;
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
              <h1 className="text-3xl font-bold text-gray-900">Sustainability Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Track your environmental impact and contribute to a greener future
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isInitialized ? 'Sustainability Active' : 'Sustainability Inactive'}
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
              className="rounded-md border-gray-300 text-sm focus:ring-green-500 focus:border-green-500"
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
                    ? 'border-green-500 text-green-600'
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
        <div className="text-4xl mb-4">🌱</div>
        <p className="text-gray-600">Loading sustainability data...</p>
      </div>
    );
  }

  const { carbonFootprint, analytics, goals } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Sustainability Overview</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🌍</div>
            <div>
              <p className="text-sm font-medium text-green-900">Carbon Footprint</p>
              <p className="text-2xl font-bold text-green-900">{carbonFootprint.total || 0} kg CO2</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Carbon Saved</p>
              <p className="text-2xl font-bold text-blue-900">{carbonFootprint.savings?.total || 0} kg CO2</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Green Score</p>
              <p className="text-2xl font-bold text-purple-900">{analytics.overview?.greenScore || 0}/100</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🌿</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Eco Rides</p>
              <p className="text-2xl font-bold text-orange-900">{analytics.overview?.ecoRides || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainability Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Goals Progress</h3>
          <div className="space-y-3">
            {goals.personal && Object.entries(goals.personal).map(([key, goal]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {goal.current}/{goal.target}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Platform Goals</h3>
          <div className="space-y-3">
            {goals.platform && Object.entries(goals.platform).map(([key, goal]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {goal.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{goal.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Carbon Footprint Tab
const CarbonTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { carbonFootprint } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Carbon Footprint Tracking</h2>
      
      {/* Carbon Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🌍</div>
            <div>
              <p className="text-sm font-medium text-green-900">Total Carbon</p>
              <p className="text-2xl font-bold text-green-900">{carbonFootprint.total || 0} kg CO2</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Carbon Saved</p>
              <p className="text-2xl font-bold text-blue-900">{carbonFootprint.savings?.total || 0} kg CO2</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Savings %</p>
              <p className="text-2xl font-bold text-purple-900">{carbonFootprint.savings?.percentage || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Carbon Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Carbon by Vehicle Type</h3>
          <div className="space-y-3">
            {carbonFootprint.breakdown && Object.entries(carbonFootprint.breakdown).map(([type, carbon]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                <span className="text-sm font-medium">{Math.round(carbon)} kg CO2</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Comparison with Alternatives</h3>
          <div className="space-y-3">
            {carbonFootprint.comparison && Object.entries(carbonFootprint.comparison).map(([mode, carbon]) => (
              <div key={mode} className="flex justify-between items-center">
                <span className="text-sm text-gray-700 capitalize">{mode.replace('_', ' ')}</span>
                <span className="text-sm font-medium">{carbon} kg CO2</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carbon Trends */}
      {carbonFootprint.trends && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Carbon Reduction Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{carbonFootprint.trends.improvement}%</p>
              <p className="text-sm text-gray-600">Improvement</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{carbonFootprint.projection?.nextMonth || 0}</p>
              <p className="text-sm text-gray-600">Next Month (kg CO2)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{carbonFootprint.projection?.carbonNeutral || 'N/A'}</p>
              <p className="text-sm text-gray-600">Carbon Neutral Date</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Green Initiatives Tab
const InitiativesTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { greenInitiatives } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Green Initiatives</h2>
      
      {/* Platform Initiatives */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Platform Initiatives</h3>
        <div className="space-y-4">
          {greenInitiatives.platform?.map((initiative, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{initiative.name}</h4>
                  <p className="text-sm text-gray-600">{initiative.description}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {initiative.deadline}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1 mr-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${initiative.progress}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium">{initiative.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Initiatives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Community Initiatives</h3>
          <div className="space-y-3">
            {greenInitiatives.community?.map((initiative, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-1">{initiative.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{initiative.description}</p>
                <div className="text-xs text-gray-500">
                  <p>Impact: {initiative.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Partnerships</h3>
          <div className="space-y-3">
            {greenInitiatives.partnerships?.map((partnership, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-1">{partnership.name}</h4>
                <p className="text-sm text-gray-600 mb-1">Partner: {partnership.partner}</p>
                <p className="text-sm text-gray-600 mb-2">{partnership.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Impact: {partnership.impact}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    partnership.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {partnership.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Eco Drivers Tab
const DriversTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { ecoDrivers } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Eco-Friendly Drivers</h2>
      
      {/* Driver Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-green-900">Eco Drivers</p>
              <p className="text-2xl font-bold text-green-900">{ecoDrivers.metrics?.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Percentage</p>
              <p className="text-2xl font-bold text-blue-900">{ecoDrivers.metrics?.percentage || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">⭐</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Avg Rating</p>
              <p className="text-2xl font-bold text-purple-900">{ecoDrivers.metrics?.averageRating || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🌍</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Carbon Saved</p>
              <p className="text-2xl font-bold text-orange-900">{ecoDrivers.impact?.carbonSaved || 0} kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Eco Driver Rewards</h3>
          <div className="space-y-3">
            {ecoDrivers.rewards?.map((reward, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-1">{reward.reward}</h4>
                <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                <div className="text-xs text-gray-500">
                  <p>Requirements: {reward.requirements}</p>
                  <p>Benefits: {reward.benefits}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Certification Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Certified Drivers</span>
              <span className="text-sm font-medium">{ecoDrivers.certification?.certified || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Pending Certification</span>
              <span className="text-sm font-medium">{ecoDrivers.certification?.pending || 0}</span>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Certification Requirements:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {ecoDrivers.certification?.requirements?.map((req, index) => (
                  <li key={index} className="flex items-center">
                    <div className="text-green-500 mr-2">✓</div>
                    {req}
                  </li>
                ))}
              </ul>
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
      <h2 className="text-xl font-semibold text-gray-900">Sustainability Analytics</h2>
      
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-green-900">Green Score</p>
              <p className="text-2xl font-bold text-green-900">{analytics.overview?.greenScore || 0}/100</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Improvement</p>
              <p className="text-2xl font-bold text-blue-900">{analytics.overview?.improvement || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🌿</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Eco Rides</p>
              <p className="text-2xl font-bold text-purple-900">{analytics.overview?.ecoRides || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Percentile</p>
              <p className="text-2xl font-bold text-orange-900">{analytics.benchmarks?.percentile || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Sustainability Insights</h3>
          <div className="space-y-2">
            {analytics.insights?.map((insight, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="text-green-500 mt-1">💡</div>
                <span className="text-sm text-gray-700">{insight}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Benchmarks</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Industry Average:</span>
              <span className="text-sm font-medium">{analytics.benchmarks?.industry || 0} kg CO2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Platform Average:</span>
              <span className="text-sm font-medium">{analytics.benchmarks?.platform || 0} kg CO2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Target:</span>
              <span className="text-sm font-medium">{analytics.benchmarks?.target || 0} kg CO2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Carbon Offsets Tab
const OffsetsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { carbonOffsets } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Carbon Offset Programs</h2>
      
      {/* Offset Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🌳</div>
            <div>
              <p className="text-sm font-medium text-green-900">Total Offset</p>
              <p className="text-2xl font-bold text-green-900">{carbonOffsets.userParticipation?.totalOffset || 0} kg CO2</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Programs</p>
              <p className="text-2xl font-bold text-blue-900">{carbonOffsets.userParticipation?.programs || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Total Cost</p>
              <p className="text-2xl font-bold text-purple-900">${carbonOffsets.userParticipation?.cost || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Programs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Available Programs</h3>
          <div className="space-y-3">
            {carbonOffsets.available?.map((program, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-1">{program.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">${program.cost}/ton CO2</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {program.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{program.impact}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Offset Impact</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Carbon Offset:</span>
              <span className="text-sm font-medium">{carbonOffsets.impact?.carbonOffset || 0} kg CO2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Trees Equivalent:</span>
              <span className="text-sm font-medium">{carbonOffsets.impact?.treesEquivalent || 0} trees</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cost Savings:</span>
              <span className="text-sm font-medium">${carbonOffsets.impact?.costSavings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Percentage:</span>
              <span className="text-sm font-medium">{carbonOffsets.impact?.percentage || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Environmental Impact Tab
const ImpactTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { environmentalImpact } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Environmental Impact</h2>
      
      {/* Impact Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🌍</div>
            <div>
              <p className="text-sm font-medium text-green-900">Carbon Footprint</p>
              <p className="text-2xl font-bold text-green-900">{environmentalImpact.total?.carbonFootprint || 0} kg</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">💧</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Water Usage</p>
              <p className="text-2xl font-bold text-blue-900">{environmentalImpact.total?.waterUsage || 0} L</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">⚡</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Energy</p>
              <p className="text-2xl font-bold text-purple-900">{environmentalImpact.total?.energyConsumption || 0} kWh</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🗑️</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Waste</p>
              <p className="text-2xl font-bold text-orange-900">{environmentalImpact.total?.wasteGenerated || 0} kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Impact Breakdown</h3>
          <div className="space-y-2">
            {environmentalImpact.breakdown && Object.entries(environmentalImpact.breakdown).map(([category, percentage]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm text-gray-700 capitalize">{category}</span>
                <span className="text-sm font-medium">{percentage}%</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Improvements</h3>
          <div className="space-y-2">
            {environmentalImpact.improvements?.map((improvement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="text-green-500">✓</div>
                <span className="text-sm text-gray-700">{improvement}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Green Rewards Tab
const RewardsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { greenRewards } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Green Rewards</h2>
      
      {/* Rewards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">⭐</div>
            <div>
              <p className="text-sm font-medium text-green-900">Total Points</p>
              <p className="text-2xl font-bold text-green-900">{greenRewards.earned?.totalPoints || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">🎁</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Rewards Redeemed</p>
              <p className="text-2xl font-bold text-blue-900">{greenRewards.earned?.rewardsRedeemed || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🌍</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Carbon Offset</p>
              <p className="text-2xl font-bold text-purple-900">{greenRewards.earned?.carbonOffset || 0} kg</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Savings</p>
              <p className="text-2xl font-bold text-orange-900">${greenRewards.earned?.savings || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards and Challenges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Available Rewards</h3>
          <div className="space-y-3">
            {greenRewards.available?.map((reward, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-1">{reward.reward}</h4>
                <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{reward.requirements}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {reward.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Green Challenges</h3>
          <div className="space-y-3">
            {greenRewards.challenges?.map((challenge, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-1">{challenge.challenge}</h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {challenge.reward} pts
                  </span>
                  <span className="text-xs text-gray-500">{challenge.deadline}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(challenge.progress / 10) * 100}%` }}
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
    </div>
  );
};

export default SustainabilityDashboard; 