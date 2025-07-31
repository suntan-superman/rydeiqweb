import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { communicationService } from '../../services/communicationService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const MessageThread = ({ rideId, otherUserId, otherUserName, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const result = await communicationService.getRideMessages(rideId, 50);
      
      if (result.success) {
        setMessages(result.messages);
        // Mark messages as read
        result.messages.forEach(msg => {
          if (msg.senderId !== user.uid && !msg.read) {
            communicationService.markMessageAsRead(msg.id, user.uid);
          }
        });
      } else {
        toast.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [rideId, user.uid]);

  // Send message
  const sendMessage = async (messageText, messageType = 'text') => {
    if (!messageText.trim()) return;

    try {
      setSending(true);
      const result = await communicationService.sendMessage(
        rideId,
        user.uid,
        otherUserId,
        messageText,
        messageType
      );

      if (result.success) {
        setNewMessage('');
        setShowTemplates(false);
        // Message will be added via real-time listener
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle new message from real-time listener
  const handleNewMessage = useCallback((messageData) => {
    if (messageData.rideId === rideId) {
      setMessages(prev => [...prev, messageData]);
      // Mark as read if we're the receiver
      if (messageData.senderId !== user.uid) {
        communicationService.markMessageAsRead(messageData.id, user.uid);
      }
    }
  }, [rideId, user.uid]);

  // Send template message
  const sendTemplateMessage = async (templateCategory, templateIndex) => {
    const result = await communicationService.sendTemplateMessage(
      rideId,
      user.uid,
      otherUserId,
      templateCategory,
      templateIndex
    );

    if (result.success) {
      setShowTemplates(false);
    } else {
      toast.error('Failed to send template message');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // For now, we'll just send the filename as a text message
    // In production, you'd upload the file to Firebase Storage
    const messageText = `📎 ${file.name}`;
    await sendMessage(messageText, 'file');
  };

  // Handle voice recording
  const handleVoiceRecording = async () => {
    try {
      const result = await communicationService.startVoiceRecording();
      if (result.success) {
        // In production, you'd handle the recording and send it
        toast.success('Voice recording started');
      } else {
        toast.error('Failed to start voice recording');
      }
    } catch (error) {
      toast.error('Voice recording not supported');
    }
  };

  // Initialize communication service
  useEffect(() => {
    const initializeCommunication = async () => {
      await communicationService.initialize(user.uid);
      await loadMessages();
    };

    initializeCommunication();

    // Listen for new messages
    window.addEventListener('newMessage', (event) => {
      handleNewMessage(event.detail);
    });

    return () => {
      window.removeEventListener('newMessage', handleNewMessage);
    };
  }, [user.uid, loadMessages, handleNewMessage]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get message templates
  const templates = communicationService.getMessageTemplates();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="medium" text="Loading messages..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {otherUserName?.charAt(0)?.toUpperCase() || 'D'}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{otherUserName || 'Driver'}</h3>
            <p className="text-sm text-gray-500">Ride #{rideId.slice(-6)}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">💬</div>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user.uid
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="text-sm">{message.message}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.senderId === user.uid ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                  {message.senderId === user.uid && (
                    <span className="ml-2">
                      {message.status === 'read' ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Templates */}
      {showTemplates && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(templates).map(([category, categoryTemplates]) => (
              <div key={category} className="space-y-1">
                <h4 className="text-xs font-medium text-gray-700 capitalize">{category}</h4>
                {categoryTemplates.slice(0, 2).map((template, index) => (
                  <button
                    key={index}
                    onClick={() => sendTemplateMessage(category, index)}
                    className="block w-full text-left text-xs text-gray-600 hover:text-gray-900 hover:bg-white px-2 py-1 rounded"
                  >
                    {template}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          {/* Template Button */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Quick messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Voice Recording */}
          <button
            onClick={handleVoiceRecording}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Voice message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Message Input */}
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="1"
              disabled={sending}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={() => sendMessage(newMessage)}
            disabled={!newMessage.trim() || sending}
            loading={sending}
            size="small"
            className="px-4"
          >
            Send
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
        />
      </div>
    </div>
  );
};

export default MessageThread; 