import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const TestNotificationButton = () => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  const sendTestNotification = async () => {
    try {
      setSending(true);
      
      const functions = getFunctions();
      const sendNotification = httpsCallable(functions, 'sendNotification');
      
      const result = await sendNotification({
        userId: user.uid,
        title: '🎉 Test Notification',
        body: 'Your notification system is working perfectly! Cloud Functions are live.',
        type: 'test',
        priority: 'high',
        channels: ['push'] // Add 'sms' when Twilio is configured
      });
      
      console.log('✅ Test notification result:', result.data);
      
      if (result.data.success) {
        toast.success('Test notification sent! Check your notification widget.', {
          duration: 5000,
          icon: '🔔'
        });
      } else {
        toast.error('Notification sent but delivery may have failed. Check console.');
      }
      
    } catch (error) {
      console.error('❌ Test notification error:', error);
      toast.error(`Failed to send test notification: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={sendTestNotification}
      disabled={sending}
      className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
        sending
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      <span>🔔</span>
      <span>{sending ? 'Sending...' : 'Test Notification'}</span>
    </button>
  );
};

export default TestNotificationButton;

