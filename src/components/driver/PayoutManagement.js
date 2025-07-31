import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getDriverEarnings, 
  processDriverPayout, 
  generateTaxReport,
  PAYMENT_CONFIG 
} from '../../services/paymentService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const PayoutManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [earningsData, setEarningsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState('weekly');
  const [showTaxReport, setShowTaxReport] = useState(false);
  const [taxReport, setTaxReport] = useState(null);

  // Load earnings data
  useEffect(() => {
    if (user?.uid) {
      loadEarningsData();
    }
  }, [user, selectedPeriod]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      const result = await getDriverEarnings(user.uid, selectedPeriod);
      
      if (result.success) {
        setEarningsData(result.data);
      } else {
        toast.error('Failed to load earnings data');
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
      toast.error('Error loading earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    if (!earningsData || earningsData.pendingPayouts < PAYMENT_CONFIG.payoutOptions[selectedPayoutMethod].minimumAmount) {
      toast.error(`Minimum payout amount is $${PAYMENT_CONFIG.payoutOptions[selectedPayoutMethod].minimumAmount}`);
      return;
    }

    try {
      setLoading(true);
      // In a real implementation, this would process all pending payouts for the driver
      const result = await processDriverPayout('batch', selectedPayoutMethod);
      
      if (result.success) {
        toast.success(`Payout request submitted! Processing time: ${result.data.processingTime}`);
        loadEarningsData(); // Refresh data
      } else {
        toast.error('Failed to process payout request');
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error('Error processing payout request');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTaxReport = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      const result = await generateTaxReport(user.uid, currentYear);
      
      if (result.success) {
        setTaxReport(result.data);
        setShowTaxReport(true);
        toast.success('Tax report generated successfully');
      } else {
        toast.error('Failed to generate tax report');
      }
    } catch (error) {
      console.error('Error generating tax report:', error);
      toast.error('Error generating tax report');
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

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'This Week';
    }
  };

  if (loading && !earningsData) {
    return <LoadingSpinner message="Loading earnings data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Earnings & Payouts</h2>
          <p className="text-gray-600 mt-1">
            Track your earnings and manage your payouts
          </p>
        </div>
        <Button
          onClick={handleGenerateTaxReport}
          variant="secondary"
          disabled={loading}
        >
          📊 Generate Tax Report
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

      {/* Earnings Summary */}
      {earningsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(earningsData.totalEarnings)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">🚗</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Rides</p>
                <p className="text-2xl font-bold text-gray-900">
                  {earningsData.totalRides}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Commission Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(earningsData.totalCommission)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Payout</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(earningsData.pendingPayouts)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payout Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(PAYMENT_CONFIG.payoutOptions).map(([method, config]) => (
            <label
              key={method}
              className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPayoutMethod === method
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="payoutMethod"
                value={method}
                checked={selectedPayoutMethod === method}
                onChange={(e) => setSelectedPayoutMethod(e.target.value)}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 capitalize">{method}</div>
                <div className="text-sm text-gray-500">
                  Fee: {config.fee > 0 ? `$${config.fee}` : 'Free'}
                </div>
                <div className="text-sm text-gray-500">
                  Processing: {config.processingTime}
                </div>
                <div className="text-sm text-gray-500">
                  Min: ${config.minimumAmount}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Payout Request */}
        {earningsData && earningsData.pendingPayouts > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  Request Payout: {formatCurrency(earningsData.pendingPayouts)}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedPayoutMethod === 'instant' && 'Instant payout with $1.50 fee'}
                  {selectedPayoutMethod === 'daily' && 'Daily payout with $0.50 fee'}
                  {selectedPayoutMethod === 'weekly' && 'Weekly payout (free)'}
                </p>
              </div>
              <Button
                onClick={handlePayoutRequest}
                variant="primary"
                disabled={loading || earningsData.pendingPayouts < PAYMENT_CONFIG.payoutOptions[selectedPayoutMethod].minimumAmount}
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Processing...</span>
                  </div>
                ) : (
                  'Request Payout'
                )}
              </Button>
            </div>
          </div>
        )}

        {earningsData && earningsData.pendingPayouts === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💰</div>
            <p>No pending payouts at the moment</p>
            <p className="text-sm">Complete more rides to earn money</p>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {earningsData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earningsData.averagePerRide)}
              </p>
              <p className="text-sm text-gray-500">Average per ride</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(earningsData.commissionRate * 100)}%
              </p>
              <p className="text-sm text-gray-500">Commission rate</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {earningsData.totalRides > 0 ? Math.round(earningsData.totalEarnings / earningsData.totalRides) : 0}
              </p>
              <p className="text-sm text-gray-500">Rides this {selectedPeriod}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tax Report Modal */}
      {showTaxReport && taxReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tax Report {taxReport.year}</h3>
              <button
                onClick={() => setShowTaxReport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(taxReport.totalEarnings)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Rides</p>
                  <p className="text-xl font-bold text-gray-900">
                    {taxReport.totalRides}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Monthly Breakdown</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {Object.entries(taxReport.monthlyBreakdown).map(([month, data]) => (
                    <div key={month} className="text-center">
                      <p className="font-medium">{new Date(2024, parseInt(month)).toLocaleDateString('en-US', { month: 'short' })}</p>
                      <p className="text-gray-600">{formatCurrency(data.earnings)}</p>
                      <p className="text-xs text-gray-500">{data.rides} rides</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setShowTaxReport(false)}
                  variant="secondary"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // In production, this would download the tax report as PDF
                    toast.success('Tax report download started');
                  }}
                  variant="primary"
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutManagement; 