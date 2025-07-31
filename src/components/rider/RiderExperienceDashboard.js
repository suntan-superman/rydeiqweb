import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { riderExperienceService } from '../../services/riderExperienceService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const RiderExperienceDashboard = () => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');

  // Refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    try {
      const data = await riderExperienceService.getRiderExperienceDashboard(user.uid, timeRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }, [user.uid, timeRange]);

  // Initialize rider experience service
  const initializeRiderExperience = useCallback(async () => {
    try {
      setLoading(true);
      const result = await riderExperienceService.initialize();
      
      if (result.success) {
        setIsInitialized(true);
        await refreshDashboard();
        toast.success('Rider Experience Dashboard initialized successfully');
      } else {
        toast.error('Failed to initialize Rider Experience Dashboard');
      }
    } catch (error) {
      console.error('Failed to initialize rider experience:', error);
      toast.error('Failed to initialize Rider Experience Dashboard');
    } finally {
      setLoading(false);
    }
  }, [refreshDashboard]);

  // Initialize rider experience service
  useEffect(() => {
    initializeRiderExperience();
    
    // Set up auto-refresh every 10 minutes
    const interval = setInterval(() => {
      refreshDashboard();
    }, 10 * 60 * 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [initializeRiderExperience, refreshDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '👤' },
    { id: 'scheduling', name: 'Smart Scheduling', icon: '📅' },
    { id: 'preferences', name: 'Preference Learning', icon: '🧠' },
    { id: 'accessibility', name: 'Accessibility', icon: '♿' },
    { id: 'family', name: 'Family Safety', icon: '👨‍👩‍👧‍👦' },
    { id: 'business', name: 'Business Travel', icon: '💼' },
    { id: 'sharing', name: 'Ride Sharing', icon: '🚗' },
    { id: 'loyalty', name: 'Loyalty Program', icon: '🏆' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab dashboardData={dashboardData} />;
      case 'scheduling':
        return <SchedulingTab dashboardData={dashboardData} />;
      case 'preferences':
        return <PreferencesTab dashboardData={dashboardData} />;
      case 'accessibility':
        return <AccessibilityTab dashboardData={dashboardData} />;
      case 'family':
        return <FamilyTab dashboardData={dashboardData} />;
      case 'business':
        return <BusinessTab dashboardData={dashboardData} />;
      case 'sharing':
        return <SharingTab dashboardData={dashboardData} />;
      case 'loyalty':
        return <LoyaltyTab dashboardData={dashboardData} />;
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
              <h1 className="text-3xl font-bold text-gray-900">Rider Experience Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Personalized experience optimization and smart features for your rides
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isInitialized ? 'Experience Active' : 'Experience Inactive'}
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
        <div className="text-4xl mb-4">👤</div>
        <p className="text-gray-600">Loading rider experience...</p>
      </div>
    );
  }

  const { profile, recommendations } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Rider Overview</h2>
      
      {/* Profile Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">⭐</div>
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
            <div className="text-purple-600 text-2xl mr-3">📅</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Member Since</p>
              <p className="text-lg font-bold text-purple-900">
                {profile.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Status</p>
              <p className="text-2xl font-bold text-orange-900">{profile.status || 'Active'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Recommendations */}
      {recommendations?.daily && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Today's Recommendations</h3>
            <div className="space-y-2">
              {recommendations.daily.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="text-blue-500 mt-1">💡</div>
                  <span className="text-sm text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Priority Actions</h3>
            <div className="space-y-2">
              {recommendations.priority?.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="text-red-500 mt-1">⚡</div>
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

// Smart Scheduling Tab
const SchedulingTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { scheduling } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Smart Scheduling</h2>
      
      {/* Scheduling Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">⏰</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Avg Advance Time</p>
              <p className="text-2xl font-bold text-blue-900">{scheduling.patterns?.averageAdvanceTime || 0} min</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-green-900">Last Minute Bookings</p>
              <p className="text-2xl font-bold text-green-900">{Math.round((scheduling.patterns?.lastMinuteBookings || 0) * 100)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Optimal Times</p>
              <p className="text-lg font-bold text-purple-900">{scheduling.optimalTimes?.morning?.length || 0} found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Optimal Times */}
      {scheduling.optimalTimes && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Optimal Pickup Times</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Morning</h4>
                <div className="flex flex-wrap gap-2">
                  {scheduling.optimalTimes.morning?.map((time, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {time}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Evening</h4>
                <div className="flex flex-wrap gap-2">
                  {scheduling.optimalTimes.evening?.map((time, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Scheduling Recommendations</h3>
            <div className="space-y-3">
              {scheduling.recommendations?.map((rec, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{rec.recommendation}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      rec.impact === 'High' ? 'bg-red-100 text-red-800' :
                      rec.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.impact}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Save ${rec.savings}
                    </span>
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

// Preferences Tab
const PreferencesTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Preference Learning</h2>
      
      <div className="bg-purple-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-purple-600 text-2xl mr-3">🧠</div>
          <div>
            <h3 className="text-lg font-medium text-purple-900">AI Learning Engine</h3>
            <p className="text-sm text-purple-700">Your preferences are continuously learned and improved</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Learning Accuracy</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Overall Accuracy:</span>
                <span className="font-medium text-green-600">87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Route Preferences:</span>
                <span className="font-medium text-blue-600">92%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timing Preferences:</span>
                <span className="font-medium text-purple-600">85%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Learning Progress</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Rides Analyzed:</span>
                <span className="font-medium text-green-600">247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Patterns Identified:</span>
                <span className="font-medium text-blue-600">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Update:</span>
                <span className="font-medium text-purple-600">2 rides</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Accessibility Tab
const AccessibilityTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { accessibility } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Accessibility Features</h2>
      
      {/* Accessibility Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">♿</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Accessibility Needs</p>
              <p className="text-2xl font-bold text-blue-900">{accessibility.needs?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-green-900">Available Drivers</p>
              <p className="text-2xl font-bold text-green-900">{accessibility.drivers?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">✅</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Verified Features</p>
              <p className="text-2xl font-bold text-purple-900">{accessibility.accommodations?.filter(a => a.verified).length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accommodations */}
      {accessibility.accommodations && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Available Accommodations</h3>
            <div className="space-y-3">
              {accessibility.accommodations.map((accommodation, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 capitalize">{accommodation.type.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      accommodation.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {accommodation.available ? 'Available' : 'Unavailable'}
                    </span>
                    {accommodation.verified && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Accessibility Features</h3>
            <div className="space-y-2">
              {accessibility.features?.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="text-green-500">✓</div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Family Safety Tab
const FamilyTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { familySafety } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Family Safety</h2>
      
      {/* Family Safety Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">👶</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Child Seats</p>
              <p className="text-2xl font-bold text-blue-900">{Object.values(familySafety.childSeats || {}).filter(Boolean).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-green-900">Family Drivers</p>
              <p className="text-2xl font-bold text-green-900">{familySafety.familyDrivers?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🛡️</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Safety Score</p>
              <p className="text-2xl font-bold text-purple-900">{familySafety.verification?.safetyScore || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Child Seat Verification */}
      {familySafety.childSeats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Child Seat Verification</h3>
            <div className="space-y-2">
              {Object.entries(familySafety.childSeats).map(([type, available]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Safety Features</h3>
            <div className="space-y-2">
              {familySafety.safetyFeatures?.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="text-green-500">🛡️</div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Business Travel Tab
const BusinessTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { businessTravel } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Business Travel</h2>
      
      {/* Business Travel Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">💼</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Monthly Expenses</p>
              <p className="text-2xl font-bold text-blue-900">${businessTravel.expenses?.monthly || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-green-900">Yearly Total</p>
              <p className="text-2xl font-bold text-green-900">${businessTravel.expenses?.yearly || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Cost Savings</p>
              <p className="text-2xl font-bold text-purple-900">${businessTravel.analytics?.costSavings || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">📋</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Receipts</p>
              <p className="text-2xl font-bold text-orange-900">{businessTravel.receipts?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Corporate Account Features</h3>
          <div className="space-y-2">
            {businessTravel.corporate && Object.entries(businessTravel.corporate).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  value === true ? 'bg-green-100 text-green-800' :
                  value === false ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : value}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Integration Features</h3>
          <div className="space-y-2">
            {businessTravel.integration?.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="text-blue-500">🔗</div>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Ride Sharing Tab
const SharingTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { rideSharing } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Ride Sharing</h2>
      
      {/* Ride Sharing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Monthly Savings</p>
              <p className="text-2xl font-bold text-blue-900">${rideSharing.costSavings?.monthly || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-green-900">Available Routes</p>
              <p className="text-2xl font-bold text-green-900">{rideSharing.opportunities?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">👥</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Potential Matches</p>
              <p className="text-2xl font-bold text-purple-900">{rideSharing.matches?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ride Sharing Opportunities */}
      {rideSharing.opportunities && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Sharing Opportunities</h3>
            <div className="space-y-3">
              {rideSharing.opportunities.map((opportunity, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{opportunity.route}</div>
                    <div className="text-xs text-gray-500">{opportunity.frequency}</div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Save ${opportunity.potentialSavings}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Sharing Groups</h3>
            <div className="space-y-3">
              {rideSharing.groups?.map((group, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{group.name}</div>
                    <div className="text-xs text-gray-500">{group.members} members</div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {group.savings}% savings
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

// Loyalty Tab
const LoyaltyTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { loyalty } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Loyalty Program</h2>
      
      {/* Loyalty Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">🏆</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Tier</p>
              <p className="text-2xl font-bold text-blue-900">{loyalty.tier || 'Bronze'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">⭐</div>
            <div>
              <p className="text-sm font-medium text-green-900">Total Points</p>
              <p className="text-2xl font-bold text-green-900">{loyalty.points?.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🎁</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Available Points</p>
              <p className="text-2xl font-bold text-purple-900">{loyalty.points?.available || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Progress</p>
              <p className="text-2xl font-bold text-orange-900">{loyalty.points?.progress || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards and Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Available Rewards</h3>
          <div className="space-y-3">
            {loyalty.rewards?.map((reward, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{reward.reward}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {reward.points} pts
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    reward.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {reward.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Tier Benefits</h3>
          <div className="space-y-2">
            {loyalty.benefits?.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="text-green-500">✓</div>
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenges */}
      {loyalty.challenges && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Active Challenges</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loyalty.challenges.map((challenge, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-700 mb-2">{challenge.challenge}</div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Progress: {challenge.progress}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {challenge.reward} pts
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(challenge.progress / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderExperienceDashboard; 