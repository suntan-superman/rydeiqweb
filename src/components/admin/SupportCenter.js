import React from 'react';

const SupportCenter = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Center</h2>
          <p className="text-gray-600 mt-1">
            Manage customer support tickets and driver assistance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Open Tickets</h3>
          <div className="text-center py-8 text-gray-500">
            No open support tickets
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Support Requests</h3>
          <div className="text-center py-8 text-gray-500">
            No pending driver support requests
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportCenter; 