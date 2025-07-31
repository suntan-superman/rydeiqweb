import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, CardContent } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { analyticsService } from '../../services/analyticsService';
import { driverToolsService } from '../../services/driverToolsService';
import { useAuth } from '../../contexts/AuthContext';

const DriverAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('earnings');

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getDriverAnalytics(user?.uid, timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, timeRange]);

  // Load driver tools data
  const loadDriverToolsData = useCallback(async () => {
    try {
      const toolsData = await driverToolsService.getDriverTools(user?.uid);
      // Merge with analytics data
      setAnalyticsData(prev => ({
        ...prev,
        driverTools: toolsData
      }));
    } catch (error) {
      console.error('Failed to load driver tools data:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadAnalyticsData();
      loadDriverToolsData();
    }
  }, [user?.uid, timeRange, loadAnalyticsData, loadDriverToolsData]);

  // Refresh data
  const handleRefresh = () => {
    loadAnalyticsData();
    loadDriverToolsData();
  };

  // Time range options
  const timeRangeOptions = [
    { label: 'Today', value: '1d' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' }
  ];

  // Metric cards
  const renderMetricCard = (title, value, icon, color, subtitle = '') => (
    <Card style={[styles.metricCard, { borderLeftColor: color }]}>
      <CardContent style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <MaterialIcons name={icon} size={24} color={color} />
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </CardContent>
    </Card>
  );

  // Performance insights
  const renderPerformanceInsights = () => {
    if (!analyticsData?.performance) return null;

    const { performance } = analyticsData;
    return (
      <Card style={styles.insightCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.insightRow}>
            <MaterialCommunityIcons name="trending-up" size={20} color="#4CAF50" />
            <Text style={styles.insightText}>
              {performance.rating}★ Average Rating ({performance.totalRides} rides)
            </Text>
          </View>
          <View style={styles.insightRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#2196F3" />
            <Text style={styles.insightText}>
              {performance.avgResponseTime} min avg response time
            </Text>
          </View>
          <View style={styles.insightRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={20} color="#FF9800" />
            <Text style={styles.insightText}>
              {performance.totalDistance} km driven this period
            </Text>
          </View>
        </CardContent>
      </Card>
    );
  };

  // Earnings breakdown
  const renderEarningsBreakdown = () => {
    if (!analyticsData?.earnings) return null;

    const { earnings } = analyticsData;
    return (
      <Card style={styles.breakdownCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Fares:</Text>
            <Text style={styles.breakdownValue}>${earnings.baseFares}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Tips:</Text>
            <Text style={styles.breakdownValue}>${earnings.tips}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Bonuses:</Text>
            <Text style={styles.breakdownValue}>${earnings.bonuses}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${earnings.total}</Text>
          </View>
        </CardContent>
      </Card>
    );
  };

  // Route optimization
  const renderRouteOptimization = () => {
    if (!analyticsData?.driverTools?.routeOptimization) return null;

    const { routeOptimization } = analyticsData.driverTools;
    return (
      <Card style={styles.optimizationCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Route Optimization</Text>
          <View style={styles.optimizationRow}>
            <MaterialCommunityIcons name="map-marker-path" size={20} color="#4CAF50" />
            <Text style={styles.optimizationText}>
              {routeOptimization.suggestedRoutes} optimized routes available
            </Text>
          </View>
          <View style={styles.optimizationRow}>
            <MaterialCommunityIcons name="gas-station" size={20} color="#FF9800" />
            <Text style={styles.optimizationText}>
              Save ${routeOptimization.fuelSavings} on fuel with optimized routes
            </Text>
          </View>
          <TouchableOpacity style={styles.optimizeButton}>
            <Text style={styles.optimizeButtonText}>View Optimized Routes</Text>
          </TouchableOpacity>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Analytics</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {timeRangeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.timeRangeButton,
              timeRange === option.value && styles.timeRangeButtonActive
            ]}
            onPress={() => setTimeRange(option.value)}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === option.value && styles.timeRangeTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        {analyticsData?.earnings && renderMetricCard(
          'Total Earnings',
          `$${analyticsData.earnings.total}`,
          'attach-money',
          '#4CAF50',
          `Last ${timeRange}`
        )}
        {analyticsData?.performance && renderMetricCard(
          'Rides Completed',
          analyticsData.performance.totalRides.toString(),
          'local-taxi',
          '#2196F3',
          `Last ${timeRange}`
        )}
        {analyticsData?.performance && renderMetricCard(
          'Average Rating',
          `${analyticsData.performance.rating}★`,
          'star',
          '#FF9800',
          `${analyticsData.performance.totalRides} rides`
        )}
        {analyticsData?.performance && renderMetricCard(
          'Online Hours',
          `${analyticsData.performance.onlineHours}h`,
          'schedule',
          '#9C27B0',
          `Last ${timeRange}`
        )}
      </View>

      {/* Performance Insights */}
      {renderPerformanceInsights()}

      {/* Earnings Breakdown */}
      {renderEarningsBreakdown()}

      {/* Route Optimization */}
      {renderRouteOptimization()}

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="assessment" size={24} color="#2196F3" />
            <Text style={styles.actionButtonText}>Detailed Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Performance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="map" size={24} color="#FF9800" />
            <Text style={styles.actionButtonText}>Route History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#2196F3',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
  },
  timeRangeTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  metricsContainer: {
    padding: 16,
  },
  metricCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
  },
  metricContent: {
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  insightCard: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  breakdownCard: {
    margin: 16,
    elevation: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  optimizationCard: {
    margin: 16,
    elevation: 2,
  },
  optimizationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optimizationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  optimizeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  optimizeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    margin: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    minWidth: 100,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DriverAnalyticsDashboard; 