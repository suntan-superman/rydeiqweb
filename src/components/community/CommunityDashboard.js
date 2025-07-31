import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { communityService } from '../../services/communityService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const CommunityDashboard = () => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');

  // Refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    try {
      const data = await communityService.getCommunityDashboard(user.uid, timeRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }, [user.uid, timeRange]);

  // Initialize community service
  const initializeCommunity = useCallback(async () => {
    try {
      setLoading(true);
      const result = await communityService.initialize();
      
      if (result.success) {
        setIsInitialized(true);
        await refreshDashboard();
        toast.success('Community Dashboard initialized successfully');
      } else {
        toast.error('Failed to initialize Community Dashboard');
      }
    } catch (error) {
      console.error('Failed to initialize community:', error);
      toast.error('Failed to initialize Community Dashboard');
    } finally {
      setLoading(false);
    }
  }, [refreshDashboard]);

  // Initialize community service
  useEffect(() => {
    initializeCommunity();
    
    // Set up auto-refresh every 10 minutes
    const interval = setInterval(() => {
      refreshDashboard();
    }, 10 * 60 * 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [initializeCommunity, refreshDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '🏠' },
    { id: 'drivers', name: 'Driver Communities', icon: '🚗' },
    { id: 'riders', name: 'Rider Communities', icon: '👥' },
    { id: 'social', name: 'Social Features', icon: '💬' },
    { id: 'events', name: 'Community Events', icon: '📅' },
    { id: 'engagement', name: 'Engagement Tools', icon: '🎯' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'local', name: 'Local Communities', icon: '📍' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab dashboardData={dashboardData} />;
      case 'drivers':
        return <DriversTab dashboardData={dashboardData} />;
      case 'riders':
        return <RidersTab dashboardData={dashboardData} />;
      case 'social':
        return <SocialTab dashboardData={dashboardData} />;
      case 'events':
        return <EventsTab dashboardData={dashboardData} />;
      case 'engagement':
        return <EngagementTab dashboardData={dashboardData} />;
      case 'analytics':
        return <AnalyticsTab dashboardData={dashboardData} />;
      case 'local':
        return <LocalTab dashboardData={dashboardData} />;
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
              <h1 className="text-3xl font-bold text-gray-900">Community Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Connect, share, and grow with the AnyRyde community
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isInitialized ? 'Community Active' : 'Community Inactive'}
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
        <div className="text-4xl mb-4">🏠</div>
        <p className="text-gray-600">Loading community data...</p>
      </div>
    );
  }

  const { overview } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Community Overview</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">👥</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Total Communities</p>
              <p className="text-2xl font-bold text-blue-900">{overview.stats?.totalCommunities || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">👤</div>
            <div>
              <p className="text-sm font-medium text-green-900">Your Communities</p>
              <p className="text-2xl font-bold text-green-900">{overview.stats?.userCommunities || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Total Members</p>
              <p className="text-2xl font-bold text-purple-900">{overview.stats?.totalMembers || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Engagement Rate</p>
              <p className="text-2xl font-bold text-orange-900">{overview.stats?.engagementRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {overview.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="text-blue-500">
                  {activity.type === 'post' && '📝'}
                  {activity.type === 'event' && '📅'}
                  {activity.type === 'achievement' && '🏆'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                  <p className="text-xs text-gray-600">{activity.action} in {activity.community}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Community Recommendations</h3>
          <div className="space-y-3">
            {overview.recommendations?.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-1">{rec.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{rec.memberCount} members</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {rec.matchScore}% match
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

// Driver Communities Tab
const DriversTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { driverCommunities } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Driver Communities</h2>
      
      {/* Driver Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Total Communities</p>
              <p className="text-2xl font-bold text-blue-900">{driverCommunities.stats?.totalCommunities || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">👥</div>
            <div>
              <p className="text-sm font-medium text-green-900">Total Members</p>
              <p className="text-2xl font-bold text-green-900">{driverCommunities.stats?.totalMembers || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">⭐</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Active Communities</p>
              <p className="text-2xl font-bold text-purple-900">{driverCommunities.stats?.activeCommunities || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Avg Members</p>
              <p className="text-2xl font-bold text-orange-900">{driverCommunities.stats?.averageMembers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Communities and Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Your Driver Communities</h3>
          <div className="space-y-3">
            {driverCommunities.userCommunities?.map((community, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-1">{community.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{community.memberCount} members</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    community.role === 'moderator' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {community.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Posts</h3>
          <div className="space-y-3">
            {driverCommunities.posts?.map((post, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">{post.author}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(post.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{post.likes} likes • {post.comments} comments</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {post.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Drivers and Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Top Drivers</h3>
          <div className="space-y-3">
            {driverCommunities.topDrivers?.map((driver, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{driver.name}</p>
                  <p className="text-sm text-gray-600">{driver.community}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{driver.rides} rides</p>
                  <p className="text-sm text-gray-600">⭐ {driver.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Driver Tips</h3>
          <div className="space-y-2">
            {driverCommunities.tips?.map((tip, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="text-green-500 mt-1">💡</div>
                <span className="text-sm text-gray-700">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Rider Communities Tab
const RidersTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { riderCommunities } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Rider Communities</h2>
      
      {/* Rider Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">👥</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Total Communities</p>
              <p className="text-2xl font-bold text-blue-900">{riderCommunities.stats?.totalCommunities || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">👤</div>
            <div>
              <p className="text-sm font-medium text-green-900">Total Members</p>
              <p className="text-2xl font-bold text-green-900">{riderCommunities.stats?.totalMembers || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">⭐</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Active Communities</p>
              <p className="text-2xl font-bold text-purple-900">{riderCommunities.stats?.activeCommunities || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Avg Members</p>
              <p className="text-2xl font-bold text-orange-900">{riderCommunities.stats?.averageMembers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rider Experiences */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Rider Experiences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riderCommunities.experiences?.map((experience, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="text-blue-500 mt-1">💬</div>
              <span className="text-sm text-gray-700">{experience}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Social Features Tab
const SocialTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { socialFeatures } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Social Features</h2>
      
      {/* Social Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📝</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Your Posts</p>
              <p className="text-2xl font-bold text-blue-900">{socialFeatures.interactions?.posts || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">👍</div>
            <div>
              <p className="text-sm font-medium text-green-900">Total Likes</p>
              <p className="text-2xl font-bold text-green-900">{socialFeatures.interactions?.likes || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">💬</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Comments</p>
              <p className="text-2xl font-bold text-purple-900">{socialFeatures.interactions?.comments || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🏆</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Reputation</p>
              <p className="text-2xl font-bold text-orange-900">{socialFeatures.reputation?.score || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts and Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Your Posts</h3>
          <div className="space-y-3">
            {socialFeatures.posts?.map((post, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{post.likes} likes • {post.comments} comments</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {post.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Achievements</h3>
          <div className="space-y-3">
            {socialFeatures.achievements?.map((achievement, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{achievement.name}</p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  achievement.earned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {achievement.earned ? 'Earned' : `${achievement.progress}/10`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Events Tab
const EventsTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { events } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Community Events</h2>
      
      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📅</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Upcoming Events</p>
              <p className="text-2xl font-bold text-blue-900">{events.stats?.upcoming || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">✅</div>
            <div>
              <p className="text-sm font-medium text-green-900">Past Events</p>
              <p className="text-2xl font-bold text-green-900">{events.stats?.past || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">👥</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Avg Attendance</p>
              <p className="text-2xl font-bold text-purple-900">{events.stats?.averageAttendance || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Your Events</p>
              <p className="text-2xl font-bold text-orange-900">{events.userEvents?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Upcoming Events</h3>
        <div className="space-y-3">
          {events.upcoming?.map((event, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-1">{event.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {new Date(event.startDate).toLocaleDateString()}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {event.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Engagement Tools Tab
const EngagementTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { engagement } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Engagement Tools</h2>
      
      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Community Points</p>
              <p className="text-2xl font-bold text-blue-900">{engagement.rewards?.points || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">🏆</div>
            <div>
              <p className="text-sm font-medium text-green-900">Level</p>
              <p className="text-2xl font-bold text-green-900">{engagement.rewards?.level || 'Member'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Active Challenges</p>
              <p className="text-2xl font-bold text-purple-900">{engagement.challenges?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenges and Polls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Active Challenges</h3>
          <div className="space-y-3">
            {engagement.challenges?.map((challenge, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-1">{challenge.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${challenge.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{challenge.progress}% complete</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {challenge.reward}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Community Polls</h3>
          <div className="space-y-3">
            {engagement.polls?.map((poll, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">{poll.question}</h4>
                <div className="space-y-2">
                  {poll.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{option}</span>
                      <span className="text-sm font-medium">{poll.votes[optIndex]} votes</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
      <h2 className="text-xl font-semibold text-gray-900">Community Analytics</h2>
      
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">👥</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Total Members</p>
              <p className="text-2xl font-bold text-blue-900">{analytics.overview?.totalMembers || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-green-900">Growth Rate</p>
              <p className="text-2xl font-bold text-green-900">{analytics.overview?.growthRate || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">💬</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Engagement Rate</p>
              <p className="text-2xl font-bold text-purple-900">{analytics.overview?.engagementRate || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">👤</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Active Members</p>
              <p className="text-2xl font-bold text-orange-900">{analytics.overview?.activeMembers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trends and Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Community Trends</h3>
          <div className="space-y-2">
            {analytics.trends && Object.entries(analytics.trends).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-sm font-medium text-green-600">{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Community Insights</h3>
          <div className="space-y-2">
            {analytics.insights?.map((insight, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="text-blue-500 mt-1">💡</div>
                <span className="text-sm text-gray-700">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Local Communities Tab
const LocalTab = ({ dashboardData }) => {
  if (!dashboardData) return <div>Loading...</div>;
  
  const { localCommunities } = dashboardData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Local Communities</h2>
      
      {/* Location Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-blue-600 text-2xl mr-3">📍</div>
          <div>
            <p className="text-sm font-medium text-blue-900">Your Location</p>
            <p className="text-lg font-bold text-blue-900">
              {localCommunities.userLocation?.city}, {localCommunities.userLocation?.state}
            </p>
          </div>
        </div>
      </div>

      {/* Local Communities */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Nearby Communities</h3>
        <div className="space-y-3">
          {localCommunities.communities?.map((community, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-1">{community.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{community.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{community.memberCount} members</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Local
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityDashboard; 