import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/Button';

const DriverToolsWidget = () => {
  const navigate = useNavigate();

  const handleNavigateToTools = () => {
    navigate('/driver/tools');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Driver Tools</h3>
        <div className="text-2xl">🚀</div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Access advanced tools to optimize your earnings, improve performance, and grow your business.
      </p>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-green-500">💰</div>
          <span className="text-sm text-gray-700">Earnings Optimization</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-blue-500">🎯</div>
          <span className="text-sm text-gray-700">Performance Coaching</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-purple-500">🔧</div>
          <span className="text-sm text-gray-700">Vehicle Maintenance</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-orange-500">⛽</div>
          <span className="text-sm text-gray-700">Fuel Optimization</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-red-500">📋</div>
          <span className="text-sm text-gray-700">Tax Preparation</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-indigo-500">🏆</div>
          <span className="text-sm text-gray-700">Achievements & Rewards</span>
        </div>
      </div>
      
      <Button
        onClick={handleNavigateToTools}
        className="w-full"
        variant="primary"
      >
        Access Driver Tools
      </Button>
    </div>
  );
};

export default DriverToolsWidget; 