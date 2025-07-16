import React from 'react';

const OnlineToggle = ({ isOnline, onToggle, disabled = false }) => {
  return (
    <div className="flex items-center space-x-3">
      {/* Status indicator */}
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-600'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={() => onToggle(!isOnline)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          disabled 
            ? 'bg-gray-200 cursor-not-allowed' 
            : isOnline 
              ? 'bg-green-600' 
              : 'bg-gray-200'
        }`}
        aria-label={`Go ${isOnline ? 'offline' : 'online'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isOnline ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default OnlineToggle; 