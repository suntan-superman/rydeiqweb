import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const NotificationWidget = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const dropdownRef = useRef(null);
  const initializeNotificationsRef = useRef(null);
  const requestNotificationPermissionRef = useRef(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      console.log('📥 Loading notifications for user:', user.uid);
      const result = await notificationService.getNotificationHistory(user.uid, 10);
      console.log('📥 Notification history result:', result);
      if (result.success) {
        setNotifications(result.notifications);
        console.log('✅ Loaded notifications:', result.notifications.length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [user.uid]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadNotificationCount(user.uid);
      console.log('📊 Loading unread count result:', count);
      if (typeof count === 'number') {
        setUnreadCount(count);
      } else if (count.success) {
        setUnreadCount(count.count);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, [user.uid]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      const prefs = notificationService.notificationPreferences;
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  // Request notification permission manually
  const requestNotificationPermission = useCallback(async () => {
    try {
      if (!('Notification' in window)) {
        toast.error('This browser does not support notifications');
        return;
      }

      if (Notification.permission === 'granted') {
        toast.success('Notifications already enabled! 🔔');
        return;
      }

      if (Notification.permission === 'denied') {
        toast.error('Please enable notifications in your browser settings');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled! 🔔');
        // Re-initialize the service using the ref
        if (initializeNotificationsRef.current) {
          await initializeNotificationsRef.current();
        }
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      toast.error('Failed to enable notifications');
    }
  }, []);

  // Store the function in ref to avoid circular dependency
  useEffect(() => {
    requestNotificationPermissionRef.current = requestNotificationPermission;
  }, [requestNotificationPermission]);

  // Initialize notification service
  const initializeNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const result = await notificationService.initialize(user.uid);
      
      if (result.success) {
        setIsInitialized(true);
        console.log('Notifications initialized successfully');
        toast.success('Push notifications enabled! 🔔');
      } else {
        console.warn('Failed to initialize notifications:', result.error);
        // Show a more informative message instead of an error
        toast((t) => (
          <div className="flex items-center space-x-2">
            <span>🔔</span>
            <div>
              <div className="font-medium">Notifications Limited</div>
              <div className="text-sm opacity-90">
                {result.error === 'Push notifications not supported' 
                  ? 'Browser notifications not supported'
                  : 'Click to enable notifications'}
              </div>
            </div>
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                if (requestNotificationPermissionRef.current) {
                  requestNotificationPermissionRef.current();
                }
              }}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Enable
            </button>
          </div>
        ));
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      toast.error('Failed to initialize notifications');
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  // Store the function in ref to avoid circular dependency
  useEffect(() => {
    initializeNotificationsRef.current = initializeNotifications;
  }, [initializeNotifications]);

  // Initialize notifications when user changes
  useEffect(() => {
    if (user?.uid && !isInitialized) {
      initializeNotifications();
    }
  }, [user, isInitialized, initializeNotifications]);

  // Load notifications when user changes
  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
      loadUnreadCount();
      loadPreferences();
    }
  }, [user?.uid, loadNotifications, loadUnreadCount, loadPreferences]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for notification count updates
  useEffect(() => {
    const handleNotificationCountUpdate = (event) => {
      setUnreadCount(prev => prev + event.detail.increment);
    };

    window.addEventListener('notificationCountUpdate', handleNotificationCountUpdate);
    return () => window.removeEventListener('notificationCountUpdate', handleNotificationCountUpdate);
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update notifications list
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const result = await notificationService.markAllNotificationsAsRead(user.uid);
      if (result.success) {
        setUnreadCount(0);
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Update preference
  const updatePreference = async (key, value) => {
    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      
      await notificationService.updateNotificationPreferences(user.uid, newPreferences);
      toast.success('Preferences updated');
    } catch (error) {
      console.error('Failed to update preference:', error);
      toast.error('Failed to update preference');
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      const result = await notificationService.sendTestNotification(user.uid);
      if (result.success) {
        toast.success('Test notification sent!');
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
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
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        disabled={loading}
      >
        <div className="w-6 h-6">
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
          ) : (
            <span className="text-xl">
              {isInitialized ? '🔔' : '🔕'}
            </span>
          )}
        </div>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Notification Status Indicator */}
        {!isInitialized && !loading && (
          <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Preferences Panel */}
          {showPreferences && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Preferences</h4>
              <div className="space-y-2">
                {Object.entries(preferences).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updatePreference(key, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button
                  onClick={sendTestNotification}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Send Test Notification
                </Button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-2xl mb-2">🔕</div>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${getNotificationColor(notification.type, notification.read)}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.body}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Mark as read
                            </button>
                          )}
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

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
              <span>{unreadCount} unread</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationWidget; 