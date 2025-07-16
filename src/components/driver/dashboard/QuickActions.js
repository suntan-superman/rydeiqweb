import React from 'react';
import Button from '../../common/Button';

const QuickActions = ({ onGoOnline, onEditProfile, onViewEarnings, canGoOnline, isOnline }) => {
  const actions = [
    {
      title: 'Go Online',
      description: 'Start accepting ride requests',
      icon: '🟢',
      action: onGoOnline,
      disabled: !canGoOnline || isOnline,
      variant: 'primary'
    },
    {
      title: 'Edit Profile',
      description: 'Update your driver information',
      icon: '✏️',
      action: onEditProfile,
      disabled: false,
      variant: 'outline'
    },
    {
      title: 'View Earnings',
      description: 'Check your earnings and payouts',
      icon: '💰',
      action: onViewEarnings,
      disabled: false,
      variant: 'secondary'
    },
    {
      title: 'Vehicle Status',
      description: 'Check vehicle and document status',
      icon: '🚗',
      action: () => {}, // Placeholder for future implementation
      disabled: false,
      variant: 'outline'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{action.icon}</div>
              <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{action.description}</p>
              <Button
                variant={action.variant}
                size="sm"
                className="w-full"
                onClick={action.action}
                disabled={action.disabled}
              >
                {action.disabled && action.title === 'Go Online' && isOnline ? 'Online' : action.title}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions; 