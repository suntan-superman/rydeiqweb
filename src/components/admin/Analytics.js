import React from 'react';

const Analytics = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600 mt-1">
            Detailed platform analytics and performance metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder for analytics charts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ride Volume Trends</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Chart will be implemented here</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Analytics</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Chart will be implemented here</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 