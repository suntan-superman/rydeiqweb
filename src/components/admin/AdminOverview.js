import React from 'react';
import Button from '../common/Button';

const AdminOverview = ({ metrics, onRefresh }) => {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    );
  }

  const { drivers, rides, revenue } = metrics;

  const statCards = [
    {
      title: 'Total Drivers',
      value: drivers.total,
      subtitle: `${drivers.active} active`,
      change: `${drivers.approvalRate}% approval rate`,
      icon: '👥',
      color: 'blue'
    },
    {
      title: 'Pending Applications',
      value: drivers.pending,
      subtitle: 'Awaiting review',
      change: 'Requires attention',
      icon: '⏳',
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
      title: 'Review Driver Applications',
      description: `${drivers.pending} applications pending`,
      action: 'Review Now',
      urgent: drivers.pending > 0
    },
    {
      title: 'Monitor Active Rides',
      description: 'View real-time ride activity',
      action: 'Monitor',
      urgent: false
    },
    {
      title: 'Generate Reports',
      description: 'Create analytics reports',
      action: 'Generate',
      urgent: false
    },
    {
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
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">JD</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">John Doe</p>
                    <p className="text-sm text-gray-600">Applied 2 hours ago</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4">
            View All Applications
          </Button>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Response Time</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">125ms</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Healthy</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Payment System</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Background Jobs</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">3 queued</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview; 