import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Card, CardContent, Button } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { driverToolsService } from '../../services/driverToolsService';
import { useAuth } from '../../contexts/AuthContext';

const RouteOptimizationWidget = () => {
  const { user } = useAuth();
  const [optimizationData, setOptimizationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load route optimization data
  const loadOptimizationData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await driverToolsService.getRouteOptimization(user?.uid, '7d');
      setOptimizationData(data);
    } catch (error) {
      console.error('Failed to load route optimization data:', error);
      Alert.alert('Error', 'Failed to load route optimization data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadOptimizationData();
    }
  }, [user?.uid, loadOptimizationData]);

  // Apply route optimization
  const handleApplyOptimization = (route) => {
    Alert.alert(
      'Apply Route Optimization',
      `Apply the optimized route to save ${route.timeSavings} minutes and ${route.fuelSavings}L of fuel?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => {
            // Here you would integrate with navigation app
            Alert.alert('Success', 'Route optimization applied to navigation');
            setSelectedRoute(route);
          }
        }
      ]
    );
  };

  // View route details
  const handleViewDetails = (route) => {
    setSelectedRoute(route);
    setShowDetails(true);
  };

  // Route optimization card
  const renderOptimizationCard = () => {
    if (!optimizationData) return null;

    return (
      <Card style={styles.optimizationCard}>
        <CardContent>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="map-marker-path" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Route Optimization</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{optimizationData.suggestedRoutes}</Text>
              <Text style={styles.statLabel}>Optimized Routes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{optimizationData.fuelSavings}L</Text>
              <Text style={styles.statLabel}>Fuel Savings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{optimizationData.timeSavings}min</Text>
              <Text style={styles.statLabel}>Time Savings</Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={loadOptimizationData}
            style={styles.refreshButton}
            loading={loading}
          >
            Refresh Optimization
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Route recommendations
  const renderRouteRecommendations = () => {
    if (!optimizationData?.recommendations) return null;

    return (
      <Card style={styles.recommendationsCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Route Recommendations</Text>
          
          {optimizationData.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationHeader}>
                <MaterialIcons 
                  name={rec.priority === 'high' ? 'priority-high' : 'info'} 
                  size={20} 
                  color={rec.priority === 'high' ? '#f44336' : '#2196F3'} 
                />
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
              </View>
              <Text style={styles.recommendationDescription}>{rec.description}</Text>
              <Text style={styles.recommendationImpact}>Impact: {rec.impact}</Text>
            </View>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Route history
  const renderRouteHistory = () => {
    if (!optimizationData?.routeHistory) return null;

    return (
      <Card style={styles.historyCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Recent Routes</Text>
          
          {optimizationData.routeHistory.slice(0, 5).map((route, index) => (
            <View key={index} style={styles.routeItem}>
              <View style={styles.routeHeader}>
                <MaterialIcons name="place" size={16} color="#666" />
                <Text style={styles.routeTitle}>
                  {route.pickupLocation} → {route.dropoffLocation}
                </Text>
              </View>
              <View style={styles.routeDetails}>
                <Text style={styles.routeDetail}>
                  Distance: {route.distance}km | Time: {route.duration}min
                </Text>
                <Text style={styles.routeDetail}>
                  Earnings: ${route.earnings} | Rating: {route.rating}★
                </Text>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Efficiency metrics
  const renderEfficiencyMetrics = () => {
    if (!optimizationData) return null;

    return (
      <Card style={styles.efficiencyCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Efficiency Metrics</Text>
          
          <View style={styles.metricRow}>
            <MaterialCommunityIcons name="speedometer" size={20} color="#4CAF50" />
            <Text style={styles.metricLabel}>Average Speed:</Text>
            <Text style={styles.metricValue}>{optimizationData.efficiency} km/h</Text>
          </View>
          
          <View style={styles.metricRow}>
            <MaterialCommunityIcons name="gas-station" size={20} color="#FF9800" />
            <Text style={styles.metricLabel}>Fuel Efficiency:</Text>
            <Text style={styles.metricValue}>8.2 L/100km</Text>
          </View>
          
          <View style={styles.metricRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#2196F3" />
            <Text style={styles.metricLabel}>Response Time:</Text>
            <Text style={styles.metricValue}>3.2 min avg</Text>
          </View>
          
          <View style={styles.metricRow}>
            <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
            <Text style={styles.metricLabel}>Route Rating:</Text>
            <Text style={styles.metricValue}>4.6★</Text>
          </View>
        </CardContent>
      </Card>
    );
  };

  // Quick actions
  const renderQuickActions = () => (
    <Card style={styles.actionsCard}>
      <CardContent>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="navigation" size={24} color="#2196F3" />
            <Text style={styles.actionButtonText}>Start Navigation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="traffic" size={24} color="#FF9800" />
            <Text style={styles.actionButtonText}>Check Traffic</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="gas-station" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Find Gas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="restaurant" size={24} color="#9C27B0" />
            <Text style={styles.actionButtonText}>Nearby Food</Text>
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );

  if (loading && !optimizationData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading route optimization...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Route Optimization Overview */}
      {renderOptimizationCard()}
      
      {/* Route Recommendations */}
      {renderRouteRecommendations()}
      
      {/* Efficiency Metrics */}
      {renderEfficiencyMetrics()}
      
      {/* Route History */}
      {renderRouteHistory()}
      
      {/* Quick Actions */}
      {renderQuickActions()}
      
      {/* Route Details Modal */}
      {showDetails && selectedRoute && (
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <CardContent>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Route Details</Text>
                <TouchableOpacity onPress={() => setShowDetails(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.routeDetailItem}>
                <Text style={styles.detailLabel}>Pickup:</Text>
                <Text style={styles.detailValue}>{selectedRoute.pickupLocation}</Text>
              </View>
              
              <View style={styles.routeDetailItem}>
                <Text style={styles.detailLabel}>Dropoff:</Text>
                <Text style={styles.detailValue}>{selectedRoute.dropoffLocation}</Text>
              </View>
              
              <View style={styles.routeDetailItem}>
                <Text style={styles.detailLabel}>Distance:</Text>
                <Text style={styles.detailValue}>{selectedRoute.distance} km</Text>
              </View>
              
              <View style={styles.routeDetailItem}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{selectedRoute.duration} min</Text>
              </View>
              
              <View style={styles.routeDetailItem}>
                <Text style={styles.detailLabel}>Earnings:</Text>
                <Text style={styles.detailValue}>${selectedRoute.earnings}</Text>
              </View>
              
              <Button
                mode="contained"
                onPress={() => handleApplyOptimization(selectedRoute)}
                style={styles.applyButton}
              >
                Apply This Route
              </Button>
            </CardContent>
          </Card>
        </View>
      )}
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
  optimizationCard: {
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
  },
  recommendationsCard: {
    margin: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendationItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  recommendationImpact: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  historyCard: {
    margin: 16,
    elevation: 4,
  },
  routeItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  routeDetails: {
    marginLeft: 24,
  },
  routeDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  efficiencyCard: {
    margin: 16,
    elevation: 4,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    width: '90%',
    maxHeight: '80%',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  routeDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    marginTop: 16,
  },
});

export default RouteOptimizationWidget; 