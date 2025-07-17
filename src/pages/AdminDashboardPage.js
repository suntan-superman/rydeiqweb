import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '../services/authService';
import { getPlatformMetrics } from '../services/adminService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminOverview from '../components/admin/AdminOverview';
import DriverManagement from '../components/admin/DriverManagement';
import RideMonitoring from '../components/admin/RideMonitoring';
import Analytics from '../components/admin/Analytics';
import FinancialManagement from '../components/admin/FinancialManagement';
import SystemSettings from '../components/admin/SystemSettings';
import SupportCenter from '../components/admin/SupportCenter';
import toast from 'react-hot-toast';

const AdminDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [platformMetrics, setPlatformMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Navigation tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'drivers', label: 'Driver Management', icon: '👥' },
    { id: 'rides', label: 'Ride Monitoring', icon: '🚗' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'support', label: 'Support', icon: '🎧' }
  ];

  // Check admin permissions and redirect if necessary
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin(user))) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Load platform metrics
  useEffect(() => {
    const loadMetrics = async () => {
      if (user && isAdmin(user)) {
        try {
          const result = await getPlatformMetrics(user, '7days');
          if (result.success) {
            setPlatformMetrics(result.data);
          } else {
            toast.error('Failed to load platform metrics');
          }
        } catch (error) {
          console.error('Error loading metrics:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMetrics();
  }, [user]);

  // Show loading while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading admin dashboard..." />
      </div>
    );
  }

  // Don't render if not admin (will redirect via useEffect)
  if (!user || !isAdmin(user)) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview metrics={platformMetrics} onRefresh={() => window.location.reload()} />;
      case 'drivers':
        return <DriverManagement />;
      case 'rides':
        return <RideMonitoring />;
      case 'analytics':
        return <Analytics />;
      case 'financial':
        return <FinancialManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'support':
        return <SupportCenter />;
      default:
        return <AdminOverview metrics={platformMetrics} onRefresh={() => window.location.reload()} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AnyRyde Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.displayName || user?.firstName || 'Administrator'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Online</span>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>

      {/* Quick Stats Bar */}
      {platformMetrics && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
            <div className="flex space-x-6">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Active Drivers:</span>
                <span className="font-semibold">{platformMetrics.drivers.active}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Total Rides (7d):</span>
                <span className="font-semibold">{platformMetrics.rides.total}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Pending Applications:</span>
                <span className="font-semibold">{platformMetrics.drivers.pending}</span>
              </div>
            </div>
            <div className="text-gray-500">
              Revenue (7d): <span className="font-semibold text-green-600">${platformMetrics.revenue.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage; 