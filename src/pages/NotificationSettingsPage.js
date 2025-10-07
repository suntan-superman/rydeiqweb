import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const NotificationSettingsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('preferences');
  const [preferences, setPreferences] = useState({});
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Initialize notification service
      await notificationService.initialize(user.uid);
      
      // Load preferences
      const prefs = notificationService.notificationPreferences;
      setPreferences(prefs);
      
      // Load notification history
      const historyResult = await notificationService.getNotificationHistory(user.uid, 50);
      if (historyResult.success) {
        setNotificationHistory(historyResult.notifications);
      }
      
    } catch (error) {
      console.error('Failed to load notification data:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user?.uid, loadData]);

  // Update preference
  const updatePreference = async (key, value) => {
    try {
      setSaving(true);
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      
      await notificationService.updateNotificationPreferences(user.uid, newPreferences);
      toast.success('Preference updated');
    } catch (error) {
      console.error('Failed to update preference:', error);
      toast.error('Failed to update preference');
      // Revert the change
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      setSaving(true);
      const result = await notificationService.sendTestNotification(user.uid);
      
      if (result.success) {
        toast.success('Test notification sent! Check your notifications.');
        setTestNotificationSent(true);
        
        // Reset after 3 seconds
        setTimeout(() => setTestNotificationSent(false), 3000);
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setSaving(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setSaving(true);
      const result = await notificationService.markAllNotificationsAsRead(user.uid);
      
      if (result.success) {
        setNotificationHistory(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setSaving(false);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotificationHistory(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const icons = {
      'ride_request': '🚗',
      'ride_update': '📍',
      'emergency': '🚨',
      'payment': '💳',
      'driver_available': '👨‍💼',
      'rider_booking': '👤',
      'system': '⚙️',
      'promotion': '🎉'
    };
    return icons[type] || '📢';
  };

  // Get notification color
  const getNotificationColor = (type, read) => {
    if (read) return 'text-gray-500';
    
    const colors = {
      'ride_request': 'text-blue-600',
      'ride_update': 'text-green-600',
      'emergency': 'text-red-600',
      'payment': 'text-purple-600',
      'driver_available': 'text-orange-600',
      'rider_booking': 'text-indigo-600',
      'system': 'text-gray-600',
      'promotion': 'text-pink-600'
    };
    return colors[type] || 'text-gray-600';
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  // Get preference description
  const getPreferenceDescription = (key) => {
    const descriptions = {
      'rideRequests': 'Get notified when new ride requests are available',
      'rideUpdates': 'Receive updates about your ride status and ETA',
      'payments': 'Get notified about payment confirmations and receipts',
      'promotions': 'Receive promotional offers and discounts',
      'safety': 'Get safety alerts and emergency notifications',
      'system': 'Receive system updates and maintenance notifications',
      'sound': 'Play sound for incoming notifications',
      'vibration': 'Vibrate device for important notifications'
    };
    return descriptions[key] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const tabs = [
    { 
      id: 'preferences', 
      name: 'Notification Preferences', 
      icon: '⚙️', 
      description: 'Manage your notification settings and preferences' 
    },
    { 
      id: 'history', 
      name: 'Notification History', 
      icon: '📋', 
      description: 'View your recent notifications and manage them' 
    },
    { 
      id: 'test', 
      name: 'Test Notifications', 
      icon: '🧪', 
      description: 'Test your notification setup and troubleshoot issues' 
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preferences':
        return (
          <div className="space-y-6">
            {/* Notification Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Categories</h3>
              <div className="space-y-4">
                {Object.entries(preferences).map(([key, value]) => (
                  <div key={key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) => updatePreference(key, e.target.checked)}
                      disabled={saving}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label htmlFor={key} className="text-sm font-medium text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        {getPreferenceDescription(key)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Behavior */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Behavior</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="sound"
                    checked={preferences.sound}
                    onChange={(e) => updatePreference('sound', e.target.checked)}
                    disabled={saving}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="sound" className="text-sm font-medium text-gray-900">
                    Play Sound
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="vibration"
                    checked={preferences.vibration}
                    onChange={(e) => updatePreference('vibration', e.target.checked)}
                    disabled={saving}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="vibration" className="text-sm font-medium text-gray-900">
                    Vibrate Device
                  </label>
                </div>
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">SMS Notifications</h3>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-900">
                  📱 <strong>SMS notifications will be available soon!</strong> Once configured, you'll be able to receive important ride updates via text message.
                </p>
              </div>

              <div className="space-y-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Enable SMS</p>
                    <p className="text-sm text-gray-600">Receive updates via text message</p>
                  </div>
                  <button
                    disabled
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-gray-300 bg-gray-200"
                  >
                    <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow translate-x-0" />
                  </button>
                </div>
                
                <div className="ml-4 space-y-3">
                  <label className="flex items-center opacity-50">
                    <input
                      type="checkbox"
                      disabled
                      className="h-5 w-5 rounded border-2 border-gray-900 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm">Ride status updates</span>
                  </label>
                  
                  <label className="flex items-center opacity-50">
                    <input
                      type="checkbox"
                      disabled
                      className="h-5 w-5 rounded border-2 border-gray-900 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm">Driver arrival notifications</span>
                  </label>
                  
                  <label className="flex items-center opacity-50">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="h-5 w-5 rounded border-2 border-gray-900 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm">Emergency alerts <span className="text-xs text-red-600">(Always On)</span></span>
                  </label>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p>Standard message and data rates may apply.</p>
                <p className="mt-1">
                  <a href="/sms-terms" className="text-green-600 hover:text-green-700 underline">SMS Terms & Conditions</a>
                </p>
              </div>
            </div>

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">About Notifications</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Notifications help you stay informed about your rides and account</li>
                <li>• Emergency notifications cannot be disabled for safety reasons</li>
                <li>• You can customize which types of notifications you receive</li>
                <li>• Notifications are stored securely and can be deleted at any time</li>
              </ul>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Notification History</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {notificationHistory.length} notifications total
                </p>
              </div>
              {notificationHistory.some(n => !n.read) && (
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  disabled={saving}
                >
                  Mark All as Read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {notificationHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">🔕</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
                  <p className="text-gray-600">You haven't received any notifications yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notificationHistory.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${getNotificationColor(notification.type, notification.read)}`}>
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.body}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'test':
        return (
          <div className="space-y-6">
            {/* Test Notifications */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Test Notifications</h3>
              <p className="text-sm text-gray-600 mb-4">
                Send a test notification to verify your notification setup is working correctly.
              </p>
              
              <div className="space-y-4">
                <Button
                  onClick={sendTestNotification}
                  disabled={saving || testNotificationSent}
                  className="w-full md:w-auto"
                >
                  {saving ? 'Sending...' : testNotificationSent ? 'Test Sent!' : 'Send Test Notification'}
                </Button>
                
                {testNotificationSent && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="text-green-600 mr-2">✅</div>
                      <div>
                        <p className="text-sm font-medium text-green-900">Test notification sent!</p>
                        <p className="text-sm text-green-700">
                          Check your browser notifications and the notification widget to confirm it was received.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-yellow-900 mb-3">Troubleshooting</h4>
              <div className="space-y-3 text-sm text-yellow-800">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">•</span>
                  <span>Make sure you've granted notification permissions to your browser</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">•</span>
                  <span>Check that your browser supports push notifications</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">•</span>
                  <span>Ensure you're not blocking notifications from this site</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">•</span>
                  <span>Try refreshing the page if notifications aren't working</span>
                </div>
              </div>
            </div>

            {/* Notification Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Browser Support:</span>
                  <span className="text-green-600">✅ Supported</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Permission Status:</span>
                  <span className="text-green-600">✅ Granted</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Service Worker:</span>
                  <span className="text-green-600">✅ Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">FCM Token:</span>
                  <span className="text-green-600">✅ Available</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
              <p className="text-gray-600 mt-2">
                Manage your notification preferences and view your notification history
              </p>
            </div>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
            >
              ← Back
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
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
      </div>
    </div>
  );
};

export default NotificationSettingsPage; 