import React from 'react';

const RideProgress = ({ rideStatus, currentRide, estimatedArrival }) => {
  const getProgressSteps = () => {
    return [
      {
        id: 'matched',
        label: 'Driver Assigned',
        icon: '✅',
        completed: ['matched', 'active', 'completed'].includes(rideStatus),
        time: currentRide?.matchedAt
      },
      {
        id: 'pickup',
        label: 'Driver Arriving',
        icon: '🚗',
        completed: ['active', 'completed'].includes(rideStatus),
        time: estimatedArrival ? `ETA: ${estimatedArrival} min` : null
      },
      {
        id: 'active',
        label: 'Trip Started',
        icon: '🛣️',
        completed: ['completed'].includes(rideStatus),
        time: currentRide?.startedAt
      },
      {
        id: 'completed',
        label: 'Trip Completed',
        icon: '🏁',
        completed: rideStatus === 'completed',
        time: currentRide?.completedAt
      }
    ];
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const steps = getProgressSteps();
  const currentStepIndex = steps.findIndex(step => !step.completed);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Ride Progress</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-4">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step.completed 
                ? 'bg-green-100 text-green-600' 
                : index === currentStepIndex 
                  ? 'bg-blue-100 text-blue-600 animate-pulse'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              <span className="text-lg">{step.icon}</span>
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className={`font-medium ${
                step.completed ? 'text-green-900' : 
                index === currentStepIndex ? 'text-blue-900' : 'text-gray-500'
              }`}>
                {step.label}
              </div>
              
              {step.time && (
                <div className="text-sm text-gray-600">
                  {typeof step.time === 'string' ? step.time : formatTime(step.time)}
                </div>
              )}
            </div>
            
            {/* Status */}
            <div>
              {step.completed ? (
                <span className="text-green-600">✓</span>
              ) : index === currentStepIndex ? (
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              ) : (
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      {rideStatus === 'matched' && estimatedArrival && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">ℹ️</span>
            <span className="text-sm text-blue-700">
              Your driver will arrive in approximately {estimatedArrival} minutes
            </span>
          </div>
        </div>
      )}
      
      {rideStatus === 'active' && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">🚗</span>
            <span className="text-sm text-green-700">
              Trip in progress - sit back and enjoy the ride!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideProgress; 