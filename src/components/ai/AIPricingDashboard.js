import React, { useState, useEffect, useCallback } from 'react';
import { aiPricingService } from '../../services/aiPricingService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const AIPricingDashboard = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marketInsights, setMarketInsights] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');

  // Refresh market insights
  const refreshMarketInsights = useCallback(async () => {
    try {
      const insights = await aiPricingService.getMarketInsights(timeRange);
      setMarketInsights(insights);
    } catch (error) {
      console.error('Failed to refresh market insights:', error);
    }
  }, [timeRange]);

  // Initialize AI pricing service
  const initializeAIPricing = useCallback(async () => {
    try {
      setLoading(true);
      const result = await aiPricingService.initialize();
      
      if (result.success) {
        setIsInitialized(true);
        await refreshMarketInsights();
        toast.success('AI Pricing Engine initialized successfully');
      } else {
        toast.error('Failed to initialize AI Pricing Engine');
      }
    } catch (error) {
      console.error('Failed to initialize AI pricing:', error);
      toast.error('Failed to initialize AI Pricing Engine');
    } finally {
      setLoading(false);
    }
  }, [refreshMarketInsights]);

  // Initialize AI pricing service
  useEffect(() => {
    initializeAIPricing();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      refreshMarketInsights();
    }, 5 * 60 * 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [initializeAIPricing, refreshMarketInsights]);

  // Test demand prediction
  const testDemandPrediction = async () => {
    try {
      const testLocation = { lat: 40.7128, lng: -74.0060 }; // NYC coordinates
      const prediction = await aiPricingService.predictDemand(testLocation);
      
      toast.success(`Demand prediction: ${prediction.demand} rides (confidence: ${prediction.confidence})`);
    } catch (error) {
      console.error('Failed to test demand prediction:', error);
      toast.error('Failed to test demand prediction');
    }
  };

  // Test pricing calculation
  const testPricingCalculation = async () => {
    try {
      const testRideRequest = {
        pickup: { coordinates: { lat: 40.7128, lng: -74.0060 } },
        destination: { coordinates: { lat: 40.7589, lng: -73.9851 } },
        rideType: 'standard'
      };
      
      const pricing = await aiPricingService.calculateOptimalPrice(testRideRequest);
      
      toast.success(`Optimal price: $${pricing.price} (confidence: ${pricing.confidence})`);
    } catch (error) {
      console.error('Failed to test pricing calculation:', error);
      toast.error('Failed to test pricing calculation');
    }
  };

  // Test fraud detection
  const testFraudDetection = async () => {
    try {
      const testRideRequest = {
        pickup: { coordinates: { lat: 40.7128, lng: -74.0060 } },
        destination: { coordinates: { lat: 40.7589, lng: -73.9851 } }
      };
      
      const testUserData = {
        userId: 'test-user',
        rating: 4.5,
        rideCount: 10
      };
      
      const fraudResult = await aiPricingService.detectFraud(testRideRequest, testUserData);
      
      toast.success(`Fraud detection: ${fraudResult.riskLevel} risk (score: ${fraudResult.riskScore})`);
    } catch (error) {
      console.error('Failed to test fraud detection:', error);
      toast.error('Failed to test fraud detection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Market Overview', icon: '📊' },
    { id: 'demand', name: 'Demand Analytics', icon: '📈' },
    { id: 'pricing', name: 'Pricing Insights', icon: '💰' },
    { id: 'drivers', name: 'Driver Analytics', icon: '🚗' },
    { id: 'revenue', name: 'Revenue Analysis', icon: '💵' },
    { id: 'fraud', name: 'Fraud Detection', icon: '🛡️' },
    { id: 'recommendations', name: 'AI Recommendations', icon: '🤖' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <MarketOverviewTab marketInsights={marketInsights} />;
      case 'demand':
        return <DemandAnalyticsTab marketInsights={marketInsights} />;
      case 'pricing':
        return <PricingInsightsTab marketInsights={marketInsights} />;
      case 'drivers':
        return <DriverAnalyticsTab marketInsights={marketInsights} />;
      case 'revenue':
        return <RevenueAnalysisTab marketInsights={marketInsights} />;
      case 'fraud':
        return <FraudDetectionTab />;
      case 'recommendations':
        return <RecommendationsTab marketInsights={marketInsights} />;
      default:
        return <MarketOverviewTab marketInsights={marketInsights} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Pricing Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Real-time market insights, demand predictions, and AI-powered recommendations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isInitialized ? 'AI Engine Active' : 'AI Engine Inactive'}
                </span>
              </div>
              <Button
                onClick={refreshMarketInsights}
                variant="outline"
                size="sm"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Test Controls */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Testing Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={testDemandPrediction}
              variant="outline"
              className="w-full"
            >
              🧪 Test Demand Prediction
            </Button>
            <Button
              onClick={testPricingCalculation}
              variant="outline"
              className="w-full"
            >
              🧪 Test Pricing Calculation
            </Button>
            <Button
              onClick={testFraudDetection}
              variant="outline"
              className="w-full"
            >
              🧪 Test Fraud Detection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Market Overview Tab
const MarketOverviewTab = ({ marketInsights }) => {
  if (!marketInsights) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-600">Loading market insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Market Overview</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Current Demand</p>
              <p className="text-2xl font-bold text-blue-900">High</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-green-900">Avg. Fare</p>
              <p className="text-2xl font-bold text-green-900">$28.50</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🚗</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Active Drivers</p>
              <p className="text-2xl font-bold text-purple-900">156</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm font-medium text-orange-900">Market Score</p>
              <p className="text-2xl font-bold text-orange-900">8.2/10</p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Conditions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Current Market Conditions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Weather Impact</p>
            <p className="font-medium">Sunny - Normal demand</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Time of Day</p>
            <p className="font-medium">Peak hours - High demand</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Special Events</p>
            <p className="font-medium">None detected</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Competition</p>
            <p className="font-medium">Moderate - Good pricing power</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demand Analytics Tab
const DemandAnalyticsTab = ({ marketInsights }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Demand Analytics</h2>
      
      {/* Demand Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Hourly Demand Pattern</h3>
          <div className="space-y-2">
            {[7, 9, 12, 15, 17, 19, 22].map(hour => (
              <div key={hour} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{hour}:00</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.random() * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{Math.floor(Math.random() * 50 + 20)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Location Demand</h3>
          <div className="space-y-2">
            {['Downtown', 'Airport', 'Residential', 'Commercial', 'Entertainment'].map(location => (
              <div key={location} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{location}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.random() * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{Math.floor(Math.random() * 30 + 10)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demand Forecast */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Demand Forecast</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-blue-700">Next Hour</p>
            <p className="text-2xl font-bold text-blue-900">+15%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-blue-700">Next 4 Hours</p>
            <p className="text-2xl font-bold text-blue-900">+8%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-blue-700">Next 24 Hours</p>
            <p className="text-2xl font-bold text-blue-900">+3%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pricing Insights Tab
const PricingInsightsTab = ({ marketInsights }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Pricing Insights</h2>
      
      {/* Pricing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Average Fare</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Standard</span>
              <span className="font-medium">$24.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Luxury</span>
              <span className="font-medium">$45.20</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">XL</span>
              <span className="font-medium">$32.80</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Dynamic Pricing</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Peak Hours</span>
              <span className="font-medium text-green-600">+25%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Weather</span>
              <span className="font-medium text-blue-600">+15%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Events</span>
              <span className="font-medium text-purple-600">+40%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Commission Rates</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Standard</span>
              <span className="font-medium">15%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Premium</span>
              <span className="font-medium">12%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Dynamic</span>
              <span className="font-medium">10-18%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Recommendations */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-green-900 mb-3">Pricing Recommendations</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-800">Increase prices by 10% during peak hours (17:00-19:00)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-800">Reduce commission to 12% for high-demand areas</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-800">Implement surge pricing for airport routes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Driver Analytics Tab
const DriverAnalyticsTab = ({ marketInsights }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Driver Analytics</h2>
      
      {/* Driver Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Driver Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Rating</span>
              <span className="font-medium">4.7/5.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="font-medium">2.3 min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Acceptance Rate</span>
              <span className="font-medium">87%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="font-medium">94%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Earnings Analysis</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg. Hourly Rate</span>
              <span className="font-medium">$28.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Peak Hour Bonus</span>
              <span className="font-medium">+$5.20</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tips Average</span>
              <span className="font-medium">$3.40</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Weekly Average</span>
              <span className="font-medium">$1,240</span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Recommendations */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Driver Recommendations</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">💡</span>
            <span className="text-sm text-blue-800">Focus on downtown area during 17:00-19:00 for 25% higher earnings</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">💡</span>
            <span className="text-sm text-blue-800">Accept airport rides for consistent high-value trips</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">💡</span>
            <span className="text-sm text-blue-800">Maintain 4.8+ rating to qualify for premium ride requests</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Revenue Analysis Tab
const RevenueAnalysisTab = ({ marketInsights }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Revenue Analysis</h2>
      
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Platform Revenue</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Today</span>
              <span className="font-medium">$12,450</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="font-medium">$87,230</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="font-medium">$342,180</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Commission Revenue</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Today</span>
              <span className="font-medium">$1,867</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="font-medium">$13,084</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="font-medium">$51,327</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Growth Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenue Growth</span>
              <span className="font-medium text-green-600">+12.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Ride Volume</span>
              <span className="font-medium text-green-600">+8.3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg. Fare</span>
              <span className="font-medium text-green-600">+4.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Optimization */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-green-900 mb-3">Revenue Optimization</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">📈</span>
            <span className="text-sm text-green-800">Implement dynamic pricing to increase revenue by 15-20%</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">📈</span>
            <span className="text-sm text-green-800">Optimize commission rates based on demand patterns</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">📈</span>
            <span className="text-sm text-green-800">Focus on high-value routes and premium services</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fraud Detection Tab
const FraudDetectionTab = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Fraud Detection</h2>
      
      {/* Fraud Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Risk Levels</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Low Risk</span>
              <span className="font-medium text-green-600">94.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Medium Risk</span>
              <span className="font-medium text-yellow-600">4.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">High Risk</span>
              <span className="font-medium text-red-600">1.0%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Detection Rate</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Accuracy</span>
              <span className="font-medium text-green-600">96.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">False Positives</span>
              <span className="font-medium text-blue-600">2.1%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="font-medium">0.3s</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Prevented Loss</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Today</span>
              <span className="font-medium text-green-600">$2,450</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="font-medium text-green-600">$18,720</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="font-medium text-green-600">$67,890</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fraud Patterns */}
      <div className="bg-red-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-red-900 mb-3">Common Fraud Patterns</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-sm text-red-800">Rapid fare changes and cancellations</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-sm text-red-800">Unusual route patterns and fake locations</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-sm text-red-800">Payment anomalies and chargeback attempts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recommendations Tab
const RecommendationsTab = ({ marketInsights }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
      
      {/* Strategic Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Pricing Strategy</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 mt-1">💡</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Implement surge pricing</p>
                <p className="text-xs text-gray-600">Increase prices by 20% during peak hours to maximize revenue</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 mt-1">💡</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Dynamic commission rates</p>
                <p className="text-xs text-gray-600">Reduce commission to 10% in high-demand areas to attract drivers</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 mt-1">💡</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Premium service pricing</p>
                <p className="text-xs text-gray-600">Introduce luxury tier with 30% premium pricing</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Market Expansion</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-green-600 mt-1">🚀</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Focus on airport routes</p>
                <p className="text-xs text-gray-600">High-value, consistent demand with 40% higher average fares</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600 mt-1">🚀</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Entertainment district</p>
                <p className="text-xs text-gray-600">High demand during evenings and weekends</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600 mt-1">🚀</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Business district</p>
                <p className="text-xs text-gray-600">Consistent demand during business hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Recommendations */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Operational Improvements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">⚡</span>
              <span className="text-sm text-blue-800">Optimize driver allocation during peak hours</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">⚡</span>
              <span className="text-sm text-blue-800">Implement real-time demand forecasting</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">⚡</span>
              <span className="text-sm text-blue-800">Enhance fraud detection algorithms</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">⚡</span>
              <span className="text-sm text-blue-800">Improve driver-rider matching algorithm</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">⚡</span>
              <span className="text-sm text-blue-800">Add weather-based pricing adjustments</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">⚡</span>
              <span className="text-sm text-blue-800">Implement event-based surge pricing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPricingDashboard; 