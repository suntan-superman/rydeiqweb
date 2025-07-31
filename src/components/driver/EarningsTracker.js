import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Card, CardContent, Button, ProgressBar } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { driverToolsService } from '../../services/driverToolsService';
import { useAuth } from '../../contexts/AuthContext';

const EarningsTracker = () => {
  const { user } = useAuth();
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  // Load earnings data
  const loadEarningsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await driverToolsService.getEarningsTracking(user?.uid, timeRange);
      setEarningsData(data);
    } catch (error) {
      console.error('Failed to load earnings data:', error);
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, timeRange]);

  useEffect(() => {
    if (user?.uid) {
      loadEarningsData();
    }
  }, [user?.uid, timeRange, loadEarningsData]);

  // Time range options
  const timeRangeOptions = [
    { label: 'Today', value: '1d' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' }
  ];

  // Period options
  const periodOptions = [
    { label: 'Current', value: 'current' },
    { label: 'Previous', value: 'previous' },
    { label: 'Target', value: 'target' }
  ];

  // Earnings overview card
  const renderEarningsOverview = () => {
    if (!earningsData) return null;

    return (
      <Card style={styles.overviewCard}>
        <CardContent>
          <View style={styles.cardHeader}>
            <MaterialIcons name="attach-money" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Earnings Overview</Text>
          </View>
          
          <View style={styles.earningsDisplay}>
            <Text style={styles.totalEarnings}>${earningsData.totalEarnings}</Text>
            <Text style={styles.earningsPeriod}>Last {timeRange}</Text>
          </View>
          
          <View style={styles.earningsBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Base Fares</Text>
              <Text style={styles.breakdownValue}>${earningsData.breakdown?.baseFares || 0}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Tips</Text>
              <Text style={styles.breakdownValue}>${earningsData.breakdown?.tips || 0}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Bonuses</Text>
              <Text style={styles.breakdownValue}>${earningsData.breakdown?.bonuses || 0}</Text>
            </View>
          </View>
          
          <Button
            mode="contained"
            onPress={loadEarningsData}
            style={styles.refreshButton}
            loading={loading}
          >
            Refresh Earnings
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Performance metrics
  const renderPerformanceMetrics = () => {
    if (!earningsData) return null;

    return (
      <Card style={styles.metricsCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          
          <View style={styles.metricRow}>
            <MaterialCommunityIcons name="currency-usd" size={20} color="#4CAF50" />
            <Text style={styles.metricLabel}>Average per Ride:</Text>
            <Text style={styles.metricValue}>${earningsData.averagePerRide}</Text>
          </View>
          
          <View style={styles.metricRow}>
            <MaterialCommunityIcons name="trending-up" size={20} color="#2196F3" />
            <Text style={styles.metricLabel}>Earnings Trend:</Text>
            <Text style={[styles.metricValue, { color: '#4CAF50' }]}>{earningsData.trends}</Text>
          </View>
          
          <View style={styles.metricRow}>
            <MaterialCommunityIcons name="target" size={20} color="#FF9800" />
            <Text style={styles.metricLabel}>Goal Progress:</Text>
            <Text style={styles.metricValue}>75%</Text>
          </View>
          
          <ProgressBar progress={0.75} color="#4CAF50" style={styles.progressBar} />
        </CardContent>
      </Card>
    );
  };

  // Peak hours analysis
  const renderPeakHours = () => {
    if (!earningsData?.peakHours) return null;

    return (
      <Card style={styles.peakHoursCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Peak Earning Hours</Text>
          
          {earningsData.peakHours.map((hour, index) => (
            <View key={index} style={styles.peakHourItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#2196F3" />
              <Text style={styles.peakHourText}>{hour}</Text>
              <Text style={styles.peakHourEarnings}>+$25/hr avg</Text>
            </View>
          ))}
          
          <Text style={styles.peakHoursTip}>
            💡 Focus on these hours for maximum earnings
          </Text>
        </CardContent>
      </Card>
    );
  };

  // Best areas
  const renderBestAreas = () => {
    if (!earningsData?.bestAreas) return null;

    return (
      <Card style={styles.areasCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Best Earning Areas</Text>
          
          {earningsData.bestAreas.map((area, index) => (
            <View key={index} style={styles.areaItem}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#4CAF50" />
              <Text style={styles.areaName}>{area}</Text>
              <Text style={styles.areaEarnings}>+$30 avg per trip</Text>
            </View>
          ))}
          
          <TouchableOpacity style={styles.viewMapButton}>
            <Text style={styles.viewMapButtonText}>View on Map</Text>
          </TouchableOpacity>
        </CardContent>
      </Card>
    );
  };

  // Earnings insights
  const renderEarningsInsights = () => {
    if (!earningsData?.insights) return null;

    return (
      <Card style={styles.insightsCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Earnings Insights</Text>
          
          {earningsData.insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <MaterialIcons 
                name={insight.icon} 
                size={20} 
                color={insight.type === 'positive' ? '#4CAF50' : '#FF9800'} 
              />
              <Text style={styles.insightText}>{insight.message}</Text>
            </View>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Earning strategies
  const renderEarningStrategies = () => (
    <Card style={styles.strategiesCard}>
      <CardContent>
        <Text style={styles.sectionTitle}>Earning Strategies</Text>
        
        <View style={styles.strategyItem}>
          <MaterialCommunityIcons name="airplane" size={20} color="#2196F3" />
          <Text style={styles.strategyText}>Focus on airport runs during peak hours</Text>
        </View>
        
        <View style={styles.strategyItem}>
          <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FF9800" />
          <Text style={styles.strategyText}>Accept surge pricing rides for higher earnings</Text>
        </View>
        
        <View style={styles.strategyItem}>
          <MaterialCommunityIcons name="calendar-star" size={20} color="#9C27B0" />
          <Text style={styles.strategyText}>Work during special events and holidays</Text>
        </View>
        
        <View style={styles.strategyItem}>
          <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
          <Text style={styles.strategyText}>Maintain high ratings for bonus eligibility</Text>
        </View>
      </CardContent>
    </Card>
  );

  // Quick actions
  const renderQuickActions = () => (
    <Card style={styles.actionsCard}>
      <CardContent>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="assessment" size={24} color="#2196F3" />
            <Text style={styles.actionButtonText}>Detailed Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Set Goals</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="schedule" size={24} color="#FF9800" />
            <Text style={styles.actionButtonText}>Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#9C27B0" />
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );

  if (loading && !earningsData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading earnings data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        {periodOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.periodButton,
              selectedPeriod === option.value && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(option.value)}
          >
            <Text style={[
              styles.periodText,
              selectedPeriod === option.value && styles.periodTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings Overview */}
      {renderEarningsOverview()}
      
      {/* Performance Metrics */}
      {renderPerformanceMetrics()}
      
      {/* Peak Hours */}
      {renderPeakHours()}
      
      {/* Best Areas */}
      {renderBestAreas()}
      
      {/* Earnings Insights */}
      {renderEarningsInsights()}
      
      {/* Earning Strategies */}
      {renderEarningStrategies()}
      
      {/* Quick Actions */}
      {renderQuickActions()}
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
    backgroundColor: '#4CAF50',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
  },
  timeRangeTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  periodContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
  },
  periodTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  overviewCard: {
    margin: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  earningsDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  totalEarnings: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  earningsPeriod: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  earningsBreakdown: {
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  refreshButton: {
    backgroundColor: '#4CAF50',
  },
  metricsCard: {
    margin: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    marginTop: 8,
  },
  peakHoursCard: {
    margin: 16,
    elevation: 4,
  },
  peakHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  peakHourText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  peakHourEarnings: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  peakHoursTip: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  areasCard: {
    margin: 16,
    elevation: 4,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  areaName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  areaEarnings: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  viewMapButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewMapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  insightsCard: {
    margin: 16,
    elevation: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  strategiesCard: {
    margin: 16,
    elevation: 4,
  },
  strategyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strategyText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  actionsCard: {
    margin: 16,
    elevation: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EarningsTracker; 