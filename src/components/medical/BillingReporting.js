import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const BillingReporting = ({ user }) => {
  const [activeTab, setActiveTab] = useState('invoicing');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [billingData, setBillingData] = useState({
    monthlyTotal: 0,
    pendingPayments: 0,
    completedRides: 0,
    averageFare: 0
  });

  useEffect(() => {
    // TODO: Load actual billing data from Firebase
    setBillingData({
      monthlyTotal: 15420.50,
      pendingPayments: 2340.75,
      completedRides: 127,
      averageFare: 121.42
    });
  }, []);

  const mockInvoices = [
    {
      id: 'INV-001',
      month: 'December 2024',
      totalAmount: 15420.50,
      ridesCount: 127,
      status: 'paid',
      dueDate: '2024-12-31',
      paidDate: '2024-12-28'
    },
    {
      id: 'INV-002',
      month: 'January 2025',
      totalAmount: 18230.25,
      ridesCount: 145,
      status: 'pending',
      dueDate: '2025-01-31',
      paidDate: null
    }
  ];

  const mockTransactions = [
    {
      id: '1',
      patientId: 'P001',
      date: '2025-01-14',
      pickup: 'Sunrise Assisted Living',
      dropoff: 'Kern Medical',
      baseFare: 25.00,
      fees: 3.50,
      total: 28.50,
      paymentMethod: 'Insurance',
      status: 'completed'
    },
    {
      id: '2',
      patientId: 'P003',
      date: '2025-01-14',
      pickup: '1234 Oak Street',
      dropoff: 'Central Valley Dialysis',
      baseFare: 32.00,
      fees: 4.25,
      total: 36.25,
      paymentMethod: 'Medicaid',
      status: 'completed'
    }
  ];

  const handleExportData = (format) => {
    // TODO: Implement actual export functionality
    alert(`Exporting data in ${format} format...`);
  };

  const StatCard = ({ title, value, icon: Icon, color = "green" }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-${color}-600`} aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {typeof value === 'number' && title.includes('$') ? `$${value.toFixed(2)}` : value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const InvoicingTab = () => (
    <div className="space-y-6">
      {/* Monthly Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Total"
          value={billingData.monthlyTotal}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatCard
          title="Pending Payments"
          value={billingData.pendingPayments}
          icon={ClockIcon}
          color="yellow"
        />
        <StatCard
          title="Completed Rides"
          value={billingData.completedRides}
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatCard
          title="Average Fare"
          value={billingData.averageFare}
          icon={ChartBarIcon}
          color="purple"
        />
      </div>

      {/* Invoices */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Monthly Invoices</h3>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Generate Invoice
          </button>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rides
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.ridesCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${invoice.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-green-600 hover:text-green-900 mr-4">
                      Download
                    </button>
                    <button className="text-blue-600 hover:text-blue-900">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const TransactionsTab = () => (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Filter Transactions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-end">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Trip-Level Transactions</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExportData('CSV')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              <ArrowDownTrayIcon className="h-4 w-4 inline mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => handleExportData('Excel')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              <ArrowDownTrayIcon className="h-4 w-4 inline mr-2" />
              Export Excel
            </button>
          </div>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Fare
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.patientId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      <div>From: {transaction.pickup}</div>
                      <div>To: {transaction.dropoff}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transaction.baseFare.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transaction.fees.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${transaction.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.paymentMethod}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ReportsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Medicaid/Medicare Reporting */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Insurance Reporting</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-blue-800">Medicaid Reporting</h4>
              <p className="text-sm text-blue-600 mt-1">
                Generate reports in Medicaid-compliant format for reimbursement.
              </p>
              <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                Generate Medicaid Report
              </button>
            </div>
            
            <div className="bg-green-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-green-800">Medicare Reporting</h4>
              <p className="text-sm text-green-600 mt-1">
                Generate reports in Medicare-compliant format for reimbursement.
              </p>
              <button className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                Generate Medicare Report
              </button>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Cost Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Base Transportation</span>
                <span className="text-sm font-medium">$12,450.00</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Accessibility Fees</span>
                <span className="text-sm font-medium">$1,240.50</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Medical Equipment</span>
                <span className="text-sm font-medium">$780.00</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Emergency Surcharges</span>
                <span className="text-sm font-medium">$350.00</span>
              </div>
              <div className="flex justify-between items-center py-2 font-medium">
                <span className="text-gray-900">Total Monthly</span>
                <span className="text-green-600">$14,820.50</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'invoicing', name: 'Monthly Invoicing', icon: DocumentTextIcon },
    { id: 'transactions', name: 'Trip-Level Export', icon: ArrowDownTrayIcon },
    { id: 'reports', name: 'Insurance Reports', icon: ChartBarIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'invoicing' && <InvoicingTab />}
      {activeTab === 'transactions' && <TransactionsTab />}
      {activeTab === 'reports' && <ReportsTab />}
    </div>
  );
};

export default BillingReporting;
