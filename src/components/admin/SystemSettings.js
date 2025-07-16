import React from 'react';

const SystemSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600 mt-1">
            Configure platform settings and business rules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Commission Rate (%)</label>
              <div className="mt-1 text-gray-500">Settings form will be implemented here</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Rules</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver Approval Process</label>
              <div className="mt-1 text-gray-500">Settings form will be implemented here</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings; 