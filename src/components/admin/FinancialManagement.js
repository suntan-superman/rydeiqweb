import React from 'react';

const FinancialManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Management</h2>
          <p className="text-gray-600 mt-1">
            Manage payouts, commissions, and financial reporting
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Payouts</h3>
          <div className="text-center py-8 text-gray-500">
            No pending payouts
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Summary</h3>
          <div className="text-center py-8 text-gray-500">
            Commission data will be displayed here
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Reports</h3>
          <div className="text-center py-8 text-gray-500">
            Generate reports here
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialManagement; 