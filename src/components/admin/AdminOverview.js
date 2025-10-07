import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getRecentDriverApplications } from '../../services/adminService';
import Button from '../common/Button';

const AdminOverview = ({ metrics, onRefresh, onTabChange }) => {
  const { user } = useAuth();
  const [recentApplications, setRecentApplications] = useState([]);

  // Load recent applications
  useEffect(() => {
    const loadRecentApplications = async () => {
      if (user) {
        const result = await getRecentDriverApplications(user, 3);
        if (result.success) {
          setRecentApplications(result.data);
        }
      }
    };
    loadRecentApplications();
  }, [user, metrics]); // Reload when metrics refresh

  // Handle quick action clicks
  const handleQuickAction = (action) => {
    console.log('AdminOverview: handleQuickAction called with action:', action);
    switch (action) {
      case 'review-applications':
        console.log('AdminOverview: Navigating to onboarding tab');
        onTabChange('onboarding');
        break;
      case 'monitor-rides':
        console.log('AdminOverview: Navigating to rides tab');
        onTabChange('rides');
        break;
      case 'generate-reports':
        console.log('AdminOverview: Navigating to analytics tab');
        onTabChange('analytics');
        break;
      case 'system-settings':
        console.log('AdminOverview: Navigating to settings tab');
        onTabChange('settings');
        break;
      default:
        console.log('AdminOverview: Unknown action:', action);
        break;
    }
  };

  // Extract metrics with defaults
  const {
    totalUsers = 0,
    activeDrivers = 0,
    revenue = { total: 0, commission: 0, averageRide: 0 },
    drivers = { pending: 0, approved: 0, total: 0 },
    rides = { total: 0, completed: 0, completionRate: 0 }
  } = metrics || {};

  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: totalUsers.toLocaleString(),
      subtitle: `${activeDrivers} active drivers`,
      change: `${((activeDrivers / totalUsers) * 100).toFixed(1)}% driver rate`,
      icon: '👥',
      color: 'blue'
    },
    {
      title: 'Active Drivers',
      value: activeDrivers,
      subtitle: `${drivers.approved} approved`,
      change: `${drivers.pending} pending applications`,
      icon: '🚗',
      color: 'yellow'
    },
    {
      title: 'Total Rides (7d)',
      value: rides.total,
      subtitle: `${rides.completed} completed`,
      change: `${rides.completionRate}% completion rate`,
      icon: '🚗',
      color: 'green'
    },
    {
      title: 'Revenue (7d)',
      value: `$${revenue.total.toFixed(2)}`,
      subtitle: `$${revenue.commission.toFixed(2)} commission`,
      change: `$${revenue.averageRide} avg/ride`,
      icon: '💰',
      color: 'purple'
    }
  ];

  const quickActions = [
    {
      id: 'review-applications',
      title: 'Review Driver Applications',
      description: `${drivers.pending} applications pending`,
      action: 'Review Now',
      urgent: drivers.pending > 0
    },
    {
      id: 'monitor-rides',
      title: 'Monitor Active Rides',
      description: 'View real-time ride activity',
      action: 'Monitor',
      urgent: false
    },
    {
      id: 'generate-reports',
      title: 'Generate Reports',
      description: 'Create analytics reports',
      action: 'Generate',
      urgent: false
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure platform settings',
      action: 'Configure',
      urgent: false
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200', 
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
          <p className="text-gray-600 mt-1">
            Data from {new Date(metrics.startDate).toLocaleDateString()} to {new Date(metrics.endDate).toLocaleDateString()}
          </p>
        </div>
        <Button 
          onClick={onRefresh}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`p-6 rounded-lg border-2 ${getColorClasses(stat.color)} transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                <p className="text-sm mt-1 opacity-75">{stat.subtitle}</p>
                <p className="text-xs mt-2 opacity-60">{stat.change}</p>
              </div>
              <div className="text-3xl opacity-75">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                action.urgent 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className={`font-medium ${action.urgent ? 'text-red-900' : 'text-gray-900'}`}>
                    {action.title}
                  </h4>
                  <p className={`text-sm mt-1 ${action.urgent ? 'text-red-600' : 'text-gray-600'}`}>
                    {action.description}
                  </p>
                </div>
                <Button
                  variant={action.urgent ? 'primary' : 'outline'}
                  size="small"
                  className="ml-4"
                  onClick={() => {
                    console.log('AdminOverview: Button clicked for action:', action.id);
                    handleQuickAction(action.id);
                  }}
                >
                  {action.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Driver Applications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Driver Applications</h3>
          <div className="space-y-3">
            {recentApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No recent applications</p>
              </div>
            ) : (
              recentApplications.map((app) => {
                const initials = app.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                const statusColor = 
                  app.status === 'approved' ? 'bg-green-100 text-green-800' :
                  app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800';
                
                const timeAgo = app.createdAt ? 
                  Math.floor((Date.now() - (app.createdAt.seconds ? app.createdAt.seconds * 1000 : new Date(app.createdAt).getTime())) / (1000 * 60 * 60)) :
                  0;
                const timeText = timeAgo < 1 ? 'Just now' :
                  timeAgo < 24 ? `${timeAgo} hours ago` :
                  `${Math.floor(timeAgo / 24)} days ago`;

                return (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                        <span className="text-sm">{initials}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{app.name}</p>
                        <p className="text-sm text-gray-600">{timeText}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                      {app.status === 'review_pending' ? 'Pending' : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-4"
            onClick={() => onTabChange('onboarding')}
          >
            View All Applications →
          </Button>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cloud Functions</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">6 Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Push Notifications</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">SMS Notifications</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-700">Ready (Config Needed)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Authentication</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-gray-700 font-medium">Overall Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-700">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview; 