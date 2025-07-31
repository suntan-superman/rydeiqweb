import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Import components
import DriverAnalyticsDashboard from '../components/analytics/DriverAnalyticsDashboard';
import RouteOptimizationWidget from '../components/driver/RouteOptimizationWidget';
import EarningsTracker from '../components/driver/EarningsTracker';
import DriverToolsDashboard from '../components/driver/DriverToolsDashboard';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Analytics Stack
const AnalyticsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="AnalyticsDashboard" 
      component={DriverAnalyticsDashboard}
      options={{
        title: 'Analytics',
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  </Stack.Navigator>
);

// Route Optimization Stack
const RouteOptimizationStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="RouteOptimization" 
      component={RouteOptimizationWidget}
      options={{
        title: 'Route Optimization',
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  </Stack.Navigator>
);

// Earnings Stack
const EarningsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="EarningsTracker" 
      component={EarningsTracker}
      options={{
        title: 'Earnings Tracker',
        headerStyle: {
          backgroundColor: '#FF9800',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  </Stack.Navigator>
);

// Driver Tools Stack
const DriverToolsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="DriverTools" 
      component={DriverToolsDashboard}
      options={{
        title: 'Driver Tools',
        headerStyle: {
          backgroundColor: '#9C27B0',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  </Stack.Navigator>
);

// Main Driver Dashboard Navigator
const DriverDashboardNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics';
          } else if (route.name === 'Routes') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'attach-money' : 'attach-money';
          } else if (route.name === 'Tools') {
            iconName = focused ? 'build' : 'build';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsStack}
        options={{
          title: 'Analytics',
        }}
      />
      <Tab.Screen 
        name="Routes" 
        component={RouteOptimizationStack}
        options={{
          title: 'Routes',
        }}
      />
      <Tab.Screen 
        name="Earnings" 
        component={EarningsStack}
        options={{
          title: 'Earnings',
        }}
      />
      <Tab.Screen 
        name="Tools" 
        component={DriverToolsStack}
        options={{
          title: 'Tools',
        }}
      />
    </Tab.Navigator>
  );
};

export default DriverDashboardNavigator; 