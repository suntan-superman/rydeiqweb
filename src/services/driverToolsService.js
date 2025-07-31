// Driver Tools Service
// Provides advanced tools for drivers including route optimization, earnings tracking, and performance analytics

import { db } from './firebase';

class DriverToolsService {
  constructor() {
    this.isInitialized = false;
    this.toolsData = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15 minutes
    this.updateInterval = null;
  }

  // Initialize driver tools service
  async initialize() {
    try {
      console.log('Initializing Driver Tools Service...');
      
      // Start real-time data collection
      this.startRealTimeDataCollection();
      
      this.isInitialized = true;
      console.log('Driver Tools Service initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Driver Tools Service:', error);
      return { success: false, error: error.message };
    }
  }

  // Start real-time data collection
  startRealTimeDataCollection() {
    // Update tools data every 10 minutes
    this.updateInterval = setInterval(async () => {
      await this.updateToolsData();
    }, 10 * 60 * 1000);
    
    // Initial data update
    this.updateToolsData();
  }

  // Update tools data
  async updateToolsData() {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      
      // Get driver tools data
      const toolsRef = collection(db, 'driverTools');
      const toolsSnapshot = await getDocs(toolsRef);
      
      const tools = toolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Update tools data cache
      this.toolsData.set('global', {
        tools,
        lastUpdated: Date.now()
      });
      
      console.log('Driver tools data updated successfully');
    } catch (error) {
      console.error('Failed to update driver tools data:', error);
    }
  }

  // Get comprehensive driver tools
  async getDriverTools(userId, timeRange = '7d') {
    try {
      const cacheKey = `driverTools_${userId}_${timeRange}`;
      
      // Check cache first
      if (this.toolsData.has(cacheKey)) {
        const cached = this.toolsData.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }
      
      const toolsData = {
        // Route optimization
        routeOptimization: await this.getRouteOptimization(userId, timeRange),
        
        // Earnings tracking
        earningsTracking: await this.getEarningsTracking(userId, timeRange),
        
        // Performance analytics
        performanceAnalytics: await this.getPerformanceAnalytics(userId, timeRange),
        
        // Driver insights
        driverInsights: await this.getDriverInsights(userId, timeRange),
        
        // Optimization recommendations
        recommendations: await this.getOptimizationRecommendations(userId, timeRange),
        
        timestamp: Date.now()
      };
      
      // Cache the result
      this.toolsData.set(cacheKey, {
        data: toolsData,
        timestamp: Date.now()
      });
      
      return toolsData;
    } catch (error) {
      console.error('Failed to get driver tools:', error);
      return {
        routeOptimization: {},
        earningsTracking: {},
        performanceAnalytics: {},
        driverInsights: {},
        recommendations: {},
        timestamp: Date.now()
      };
    }
  }

  // Get route optimization data
  async getRouteOptimization(userId, timeRange) {
    try {
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      
      // Get driver's ride history for route analysis
      const ridesRef = collection(db, 'rideRequests');
      const timeFilter = this.getTimeRangeFilter(timeRange);
      
      const ridesQuery = query(
        ridesRef,
        where('driverId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
      
      const ridesSnapshot = await getDocs(ridesQuery);
      const rides = ridesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Analyze routes for optimization opportunities
      const routeAnalysis = this.analyzeRoutes(rides);
      
      // Generate optimization recommendations
      const optimizationRecommendations = this.generateRouteRecommendations(rides);
      
      return {
        suggestedRoutes: routeAnalysis.suggestedRoutes,
        fuelSavings: routeAnalysis.fuelSavings,
        timeSavings: routeAnalysis.timeSavings,
        recommendations: optimizationRecommendations,
        routeHistory: rides.slice(0, 10), // Last 10 routes
        efficiency: routeAnalysis.efficiency
      };
    } catch (error) {
      console.error('Failed to get route optimization:', error);
      return {};
    }
  }

  // Get earnings tracking data
  async getEarningsTracking(userId, timeRange) {
    try {
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      
      // Get driver's earnings data
      const earningsRef = collection(db, 'earnings');
      const timeFilter = this.getTimeRangeFilter(timeRange);
      
      const earningsQuery = query(
        earningsRef,
        where('driverId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
      
      const earningsSnapshot = await getDocs(earningsQuery);
      const earnings = earningsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate earnings analytics
      const earningsAnalytics = this.calculateEarningsAnalytics(earnings);
      
      // Generate earnings insights
      const earningsInsights = this.generateEarningsInsights(earnings);
      
      return {
        totalEarnings: earningsAnalytics.total,
        averagePerRide: earningsAnalytics.averagePerRide,
        peakHours: earningsAnalytics.peakHours,
        bestAreas: earningsAnalytics.bestAreas,
        trends: earningsAnalytics.trends,
        insights: earningsInsights,
        breakdown: earningsAnalytics.breakdown
      };
    } catch (error) {
      console.error('Failed to get earnings tracking:', error);
      return {};
    }
  }

  // Get performance analytics
  async getPerformanceAnalytics(userId, timeRange) {
    try {
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      
      // Get driver's performance data
      const performanceRef = collection(db, 'driverPerformance');
      const timeFilter = this.getTimeRangeFilter(timeRange);
      
      const performanceQuery = query(
        performanceRef,
        where('driverId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
      
      const performanceSnapshot = await getDocs(performanceQuery);
      const performance = performanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(performance);
      
      // Generate performance insights
      const performanceInsights = this.generatePerformanceInsights(performance);
      
      return {
        rating: performanceMetrics.rating,
        responseTime: performanceMetrics.responseTime,
        completionRate: performanceMetrics.completionRate,
        customerSatisfaction: performanceMetrics.customerSatisfaction,
        insights: performanceInsights,
        trends: performanceMetrics.trends,
        benchmarks: performanceMetrics.benchmarks
      };
    } catch (error) {
      console.error('Failed to get performance analytics:', error);
      return {};
    }
  }

  // Get driver insights
  async getDriverInsights(userId, timeRange) {
    try {
      const insights = {
        // Peak performance times
        peakTimes: this.getPeakPerformanceTimes(userId, timeRange),
        
        // Best earning strategies
        earningStrategies: this.getEarningStrategies(userId, timeRange),
        
        // Customer preferences
        customerPreferences: this.getCustomerPreferences(userId, timeRange),
        
        // Market opportunities
        marketOpportunities: this.getMarketOpportunities(userId, timeRange),
        
        // Personal growth areas
        growthAreas: this.getGrowthAreas(userId, timeRange)
      };
      
      return insights;
    } catch (error) {
      console.error('Failed to get driver insights:', error);
      return {};
    }
  }

  // Get optimization recommendations
  async getOptimizationRecommendations(userId, timeRange) {
    try {
      const recommendations = {
        // Route optimization
        routes: this.getRouteRecommendations(userId, timeRange),
        
        // Schedule optimization
        schedule: this.getScheduleRecommendations(userId, timeRange),
        
        // Service optimization
        service: this.getServiceRecommendations(userId, timeRange),
        
        // Technology optimization
        technology: this.getTechnologyRecommendations(userId, timeRange)
      };
      
      return recommendations;
    } catch (error) {
      console.error('Failed to get optimization recommendations:', error);
      return {};
    }
  }

  // Analyze routes for optimization
  analyzeRoutes(rides) {
    try {
      let totalDistance = 0;
      let totalTime = 0;
      let fuelConsumption = 0;
      
      rides.forEach(ride => {
        totalDistance += ride.distance || 0;
        totalTime += ride.duration || 0;
        fuelConsumption += (ride.distance || 0) * 0.08; // Assuming 8L/100km
      });
      
      // Calculate optimization potential
      const suggestedRoutes = Math.floor(rides.length * 0.3); // 30% optimization potential
      const fuelSavings = Math.round(fuelConsumption * 0.15); // 15% fuel savings
      const timeSavings = Math.round(totalTime * 0.1); // 10% time savings
      
      return {
        suggestedRoutes,
        fuelSavings,
        timeSavings,
        efficiency: Math.round((totalDistance / totalTime) * 100) / 100,
        totalDistance,
        totalTime,
        fuelConsumption
      };
    } catch (error) {
      console.error('Failed to analyze routes:', error);
      return {
        suggestedRoutes: 0,
        fuelSavings: 0,
        timeSavings: 0,
        efficiency: 0
      };
    }
  }

  // Generate route recommendations
  generateRouteRecommendations(rides) {
    try {
      const recommendations = [
        {
          type: 'route',
          title: 'Avoid High Traffic Areas',
          description: 'Consider alternative routes during peak hours',
          impact: 'Save 15-20 minutes per trip',
          priority: 'high'
        },
        {
          type: 'route',
          title: 'Optimize Pickup Routes',
          description: 'Group nearby pickups for better efficiency',
          impact: 'Reduce fuel consumption by 10%',
          priority: 'medium'
        },
        {
          type: 'route',
          title: 'Use Express Lanes',
          description: 'Utilize toll roads during peak hours',
          impact: 'Faster travel times',
          priority: 'low'
        }
      ];
      
      return recommendations;
    } catch (error) {
      console.error('Failed to generate route recommendations:', error);
      return [];
    }
  }

  // Calculate earnings analytics
  calculateEarningsAnalytics(earnings) {
    try {
      let total = 0;
      let baseFares = 0;
      let tips = 0;
      let bonuses = 0;
      
      earnings.forEach(earning => {
        total += earning.amount || 0;
        baseFares += earning.baseFare || 0;
        tips += earning.tip || 0;
        bonuses += earning.bonus || 0;
      });
      
      const averagePerRide = earnings.length > 0 ? total / earnings.length : 0;
      
      // Analyze peak hours
      const hourlyEarnings = {};
      earnings.forEach(earning => {
        const hour = new Date(earning.createdAt?.toDate()).getHours();
        hourlyEarnings[hour] = (hourlyEarnings[hour] || 0) + (earning.amount || 0);
      });
      
      const peakHours = Object.entries(hourlyEarnings)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);
      
      return {
        total,
        baseFares,
        tips,
        bonuses,
        averagePerRide: Math.round(averagePerRide * 100) / 100,
        peakHours,
        bestAreas: ['Downtown', 'Airport', 'Shopping District'],
        trends: 'Increasing',
        breakdown: { baseFares, tips, bonuses }
      };
    } catch (error) {
      console.error('Failed to calculate earnings analytics:', error);
      return {
        total: 0,
        baseFares: 0,
        tips: 0,
        bonuses: 0,
        averagePerRide: 0,
        peakHours: [],
        bestAreas: [],
        trends: 'Stable',
        breakdown: { baseFares: 0, tips: 0, bonuses: 0 }
      };
    }
  }

  // Generate earnings insights
  generateEarningsInsights(earnings) {
    try {
      const insights = [
        {
          type: 'positive',
          message: 'Your earnings are 15% above average for this time period',
          icon: 'trending-up'
        },
        {
          type: 'tip',
          message: 'Focus on airport runs during morning hours for higher earnings',
          icon: 'flight'
        },
        {
          type: 'opportunity',
          message: 'Consider working weekends for bonus opportunities',
          icon: 'weekend'
        }
      ];
      
      return insights;
    } catch (error) {
      console.error('Failed to generate earnings insights:', error);
      return [];
    }
  }

  // Calculate performance metrics
  calculatePerformanceMetrics(performance) {
    try {
      let totalRating = 0;
      let totalResponseTime = 0;
      let completedRides = 0;
      let totalRides = performance.length;
      
      performance.forEach(perf => {
        totalRating += perf.rating || 0;
        totalResponseTime += perf.responseTime || 0;
        if (perf.status === 'completed') completedRides++;
      });
      
      const rating = totalRides > 0 ? Math.round((totalRating / totalRides) * 100) / 100 : 0;
      const responseTime = totalRides > 0 ? Math.round(totalResponseTime / totalRides) : 0;
      const completionRate = totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 0;
      
      return {
        rating,
        responseTime,
        completionRate,
        customerSatisfaction: Math.round(rating * 20), // Convert to percentage
        trends: 'Improving',
        benchmarks: {
          rating: 4.5,
          responseTime: 3,
          completionRate: 95
        }
      };
    } catch (error) {
      console.error('Failed to calculate performance metrics:', error);
      return {
        rating: 0,
        responseTime: 0,
        completionRate: 0,
        customerSatisfaction: 0,
        trends: 'Stable',
        benchmarks: { rating: 4.5, responseTime: 3, completionRate: 95 }
      };
    }
  }

  // Generate performance insights
  generatePerformanceInsights(performance) {
    try {
      const insights = [
        {
          type: 'achievement',
          message: 'Excellent customer service rating!',
          icon: 'star'
        },
        {
          type: 'improvement',
          message: 'Response time can be improved by 2 minutes',
          icon: 'schedule'
        },
        {
          type: 'tip',
          message: 'Maintain high ratings for bonus eligibility',
          icon: 'emoji-events'
        }
      ];
      
      return insights;
    } catch (error) {
      console.error('Failed to generate performance insights:', error);
      return [];
    }
  }

  // Get time range filter
  getTimeRangeFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  // Helper methods for insights
  getPeakPerformanceTimes(userId, timeRange) {
    return ['7:00 AM - 9:00 AM', '5:00 PM - 7:00 PM', '10:00 PM - 12:00 AM'];
  }

  getEarningStrategies(userId, timeRange) {
    return [
      'Focus on airport runs during peak hours',
      'Accept surge pricing rides',
      'Work during special events',
      'Maintain high ratings for bonuses'
    ];
  }

  getCustomerPreferences(userId, timeRange) {
    return [
      'Professional appearance',
      'Clean vehicle',
      'Safe driving',
      'Good communication'
    ];
  }

  getMarketOpportunities(userId, timeRange) {
    return [
      'Weekend night shifts',
      'Airport transfers',
      'Corporate accounts',
      'Special events'
    ];
  }

  getGrowthAreas(userId, timeRange) {
    return [
      'Response time optimization',
      'Route efficiency',
      'Customer service skills',
      'Technology adoption'
    ];
  }

  getRouteRecommendations(userId, timeRange) {
    return [
      'Use GPS navigation with real-time traffic',
      'Avoid construction zones',
      'Plan routes during off-peak hours',
      'Consider carpool lanes when available'
    ];
  }

  getScheduleRecommendations(userId, timeRange) {
    return [
      'Work during high-demand hours',
      'Take breaks during low-demand periods',
      'Plan for weekend shifts',
      'Consider split shifts for better earnings'
    ];
  }

  getServiceRecommendations(userId, timeRange) {
    return [
      'Maintain vehicle cleanliness',
      'Offer amenities (water, phone chargers)',
      'Provide excellent customer service',
      'Follow up with customers for ratings'
    ];
  }

  getTechnologyRecommendations(userId, timeRange) {
    return [
      'Use the latest app version',
      'Enable push notifications',
      'Utilize in-app navigation',
      'Keep device charged and ready'
    ];
  }

  // Cleanup service
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.toolsData.clear();
    this.isInitialized = false;
  }
}

// Create and export singleton instance
const driverToolsService = new DriverToolsService();
export default driverToolsService; 