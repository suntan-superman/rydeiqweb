import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { communicationService } from '../../services/communicationService';
import MessageThread from './MessageThread';
import toast from 'react-hot-toast';

const CommunicationWidget = ({ rideId, otherUserId, otherUserName, rideStatus }) => {
  const { user } = useAuth();
  const [showMessages, setShowMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState(null);

  // Load unread message count
  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await communicationService.getUnreadMessageCount(user.uid);
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, [user.uid]);

  // Handle answer call
  const handleAnswerCall = useCallback(async (callData) => {
    try {
      setIsCalling(true);
      setCallStatus('connecting');
      
      // In production, this would integrate with a calling service
      // For now, we'll simulate the call
      toast.success('Connecting call...');
      
      // Simulate call connection
      setTimeout(() => {
        setCallStatus('connected');
        toast.success('Call connected');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to answer call:', error);
      toast.error('Failed to connect call');
      setCallStatus(null);
    } finally {
      setIsCalling(false);
    }
  }, []);

  // Handle incoming call notification
  const handleIncomingCall = useCallback((callData) => {
    if (callData.rideId === rideId) {
      setCallStatus('incoming');
      // Show call notification
      toast.success(`Incoming call from ${otherUserName}`, {
        duration: 10000,
        action: {
          label: 'Answer',
          onClick: () => handleAnswerCall(callData)
        }
      });
    }
  }, [rideId, otherUserName, handleAnswerCall]);

  // Handle end call
  const handleEndCall = () => {
    setCallStatus(null);
    setIsCalling(false);
    toast.success('Call ended');
  };

  // Initialize communication
  useEffect(() => {
    const initializeCommunication = async () => {
      await communicationService.initialize(user.uid);
      await loadUnreadCount();
    };

    initializeCommunication();

    // Listen for incoming calls
    window.addEventListener('incomingCall', (event) => {
      handleIncomingCall(event.detail);
    });

    // Listen for new messages to update unread count
    window.addEventListener('newMessage', () => {
      loadUnreadCount();
    });

    return () => {
      window.removeEventListener('incomingCall', handleIncomingCall);
      window.removeEventListener('newMessage', loadUnreadCount);
    };
  }, [user.uid, rideId, handleIncomingCall, loadUnreadCount]);

  // Handle initiate call
  const handleInitiateCall = async () => {
    try {
      setIsCalling(true);
      setCallStatus('initiating');
      
      const result = await communicationService.createMaskedCall(
        rideId,
        user.uid,
        otherUserId,
        'voice'
      );

      if (result.success) {
        setCallStatus('connecting');
        toast.success('Calling...');
        
        // Simulate call connection
        setTimeout(() => {
          setCallStatus('connected');
          toast.success('Call connected');
        }, 3000);
      } else {
        toast.error('Failed to initiate call');
        setCallStatus(null);
      }
    } catch (error) {
      console.error('Failed to initiate call:', error);
      toast.error('Failed to initiate call');
      setCallStatus(null);
    } finally {
      setIsCalling(false);
    }
  };

  // Handle send quick message
  const handleQuickMessage = async (templateCategory, templateIndex) => {
    try {
      const result = await communicationService.sendTemplateMessage(
        rideId,
        user.uid,
        otherUserId,
        templateCategory,
        templateIndex
      );

      if (result.success) {
        toast.success('Message sent');
        loadUnreadCount();
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send quick message:', error);
      toast.error('Failed to send message');
    }
  };

  // Get quick message templates
  const getQuickTemplates = () => {
    const templates = communicationService.getMessageTemplates();
    return {
      pickup: templates.pickup[0],
      eta: templates.ride[0],
      safety: templates.safety[0]
    };
  };

  const quickTemplates = getQuickTemplates();

  return (
    <div className="relative">
      {/* Communication Widget */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Communication</h3>
          <div className="flex items-center space-x-2">
            {/* Message Button */}
            <button
              onClick={() => setShowMessages(!showMessages)}
              className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Call Button */}
            <button
              onClick={handleInitiateCall}
              disabled={isCalling}
              className={`p-2 transition-colors ${
                callStatus === 'connected' 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-gray-400 hover:text-green-600'
              }`}
              title={callStatus === 'connected' ? 'End Call' : 'Call'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {callStatus === 'connected' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18M3 21l18-18" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Call Status */}
        {callStatus && (
          <div className={`mb-4 p-3 rounded-lg ${
            callStatus === 'connected' ? 'bg-green-50 border border-green-200' :
            callStatus === 'connecting' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  callStatus === 'connected' ? 'bg-green-500' :
                  callStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-blue-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  callStatus === 'connected' ? 'text-green-800' :
                  callStatus === 'connecting' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {callStatus === 'connected' ? 'Call Connected' :
                   callStatus === 'connecting' ? 'Connecting...' :
                   'Initiating Call'}
                </span>
              </div>
              {callStatus === 'connected' && (
                <button
                  onClick={handleEndCall}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  End Call
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Messages */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Quick Messages</h4>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickMessage('pickup', 0)}
              className="text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
            >
              📍 {quickTemplates.pickup}
            </button>
            <button
              onClick={() => handleQuickMessage('ride', 0)}
              className="text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
            >
              ⏱️ {quickTemplates.eta}
            </button>
            <button
              onClick={() => handleQuickMessage('safety', 0)}
              className="text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
            >
              🚨 {quickTemplates.safety}
            </button>
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Notifications</span>
            <button
              onClick={() => {
                // Toggle notification preferences
                toast.success('Notification preferences updated');
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Message Thread Modal */}
      {showMessages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md h-96">
            <MessageThread
              rideId={rideId}
              otherUserId={otherUserId}
              otherUserName={otherUserName}
              onClose={() => setShowMessages(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationWidget; 