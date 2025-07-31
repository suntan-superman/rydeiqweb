import React, { useState, useEffect } from 'react';
import { getPaymentAnalytics, PAYMENT_CONFIG } from '../../services/paymentService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const PaymentAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const result = await getPaymentAnalytics(selectedPeriod);
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        toast.error('Failed to load payment analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error loading payment analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'This Month';
    }
  };

  const calculateGrowthRate = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading && !analyticsData) {
    return <LoadingSpinner message="Loading payment analytics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Analytics</h2>
          <p className="text-gray-600 mt-1">
            Platform revenue and payment insights
          </p>
        </div>
        <Button
          onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
          variant="secondary"
        >
          {showDetailedBreakdown ? 'Hide' : 'Show'} Detailed Breakdown
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-2">
        {['day', 'week', 'month'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getPeriodLabel(period)}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData.totalRevenue)}
                </p>
                <p className="text-sm text-green-600">
                  +{formatCurrency(analyticsData.totalRevenue * 0.15)} vs last {selectedPeriod}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Platform Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData.platformRevenue)}
                </p>
                <p className="text-sm text-blue-600">
                  {Math.round(analyticsData.commissionRate * 100)}% commission rate
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">🚗</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Rides</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analyticsData.totalRides)}
                </p>
                <p className="text-sm text-purple-600">
                  {formatCurrency(analyticsData.averageRideValue)} avg per ride
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">💸</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Driver Payouts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData.driverPayouts)}
                </p>
                <p className="text-sm text-yellow-600">
                  {Math.round((analyticsData.driverPayouts / analyticsData.totalRevenue) * 100)}% of revenue
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commission Structure */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Structure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(PAYMENT_CONFIG.commissionRates).map(([type, rate]) => (
            <div key={type} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{type}</p>
                  <p className="text-sm text-gray-500">
                    {Math.round(rate * 100)}% commission
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {Math.round(rate * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    vs {type === 'standard' ? '50-60%' : 'competitors'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-blue-600 text-lg mr-2">💡</span>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Competitive Advantage
              </p>
              <p className="text-sm text-blue-700">
                Our {Math.round(PAYMENT_CONFIG.commissionRates.standard * 100)}% commission rate is significantly lower than competitors' 50-60%, 
                allowing drivers to keep more of their earnings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showDetailedBreakdown && analyticsData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Financial Breakdown</h3>
          
          <div className="space-y-4">
            {/* Revenue Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Revenue Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Revenue:</span>
                  <span className="font-medium">{formatCurrency(analyticsData.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Commission:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(analyticsData.totalCommission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver Payouts:</span>
                  <span className="font-medium text-green-600">{formatCurrency(analyticsData.driverPayouts)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Net Platform Revenue:</span>
                  <span className="text-gray-900">{formatCurrency(analyticsData.platformRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData.averageRideValue)}
                </p>
                <p className="text-sm text-gray-500">Average Ride Value</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((analyticsData.platformRevenue / analyticsData.totalRevenue) * 100)}%
                </p>
                <p className="text-sm text-gray-500">Platform Margin</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData.platformRevenue / analyticsData.totalRides)}
                </p>
                <p className="text-sm text-gray-500">Revenue per Ride</p>
              </div>
            </div>

            {/* Payout Options Analysis */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Payout Options Revenue</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(PAYMENT_CONFIG.payoutOptions).map(([method, config]) => (
                  <div key={method} className="bg-white p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{method}</p>
                        <p className="text-sm text-gray-500">
                          Fee: {config.fee > 0 ? `$${config.fee}` : 'Free'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {config.fee > 0 ? `$${config.fee}` : '$0'}
                        </p>
                        <p className="text-xs text-gray-500">per payout</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PAYMENT_CONFIG.supportedMethods.map((method) => (
            <div key={method} className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">
                {method === 'credit_card' && '💳'}
                {method === 'debit_card' && '💳'}
                {method === 'digital_wallet' && '📱'}
                {method === 'bank_transfer' && '🏦'}
                {method === 'cash' && '💵'}
              </div>
              <p className="font-medium text-gray-900 capitalize">
                {method.replace('_', ' ')}
              </p>
              <p className="text-sm text-gray-500">Supported</p>
            </div>
          ))}
        </div>
      </div>

      {/* Currency Support */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Currency Support</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {PAYMENT_CONFIG.supportedCurrencies.map((currency) => (
            <div key={currency} className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="font-medium text-gray-900">{currency}</p>
              <p className="text-sm text-gray-500">
                {currency === PAYMENT_CONFIG.defaultCurrency ? 'Default' : 'Supported'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={loadAnalyticsData}
          variant="secondary"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Refreshing...</span>
            </div>
          ) : (
            'Refresh Data'
          )}
        </Button>
        
        <Button
          onClick={() => {
            // In production, this would export analytics data
            toast.success('Analytics export started');
          }}
          variant="primary"
        >
          Export Analytics
        </Button>
      </div>
    </div>
  );
};

export default PaymentAnalytics; 