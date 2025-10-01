import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  TruckIcon,
  HeartIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import specializedETAService from '../../services/specializedETAService';
import toast from 'react-hot-toast';

const SpecializedETACommunication = ({ 
  rideId, 
  rideType, 
  driverId, 
  riderId, 
  estimatedETA,
  onETAUpdate,
  showConfirmation = true 
}) => {
  const [etaInfo, setEtaInfo] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationResponse, setConfirmationResponse] = useState(null);

  useEffect(() => {
    if (rideId && rideType) {
      loadETACommunications();
    }
  }, [rideId, rideType]);

  useEffect(() => {
    if (estimatedETA) {
      calculateSpecializedETA();
    }
  }, [estimatedETA, rideType]);

  const calculateSpecializedETA = async () => {
    if (!estimatedETA || !rideType) return;

    const etaData = specializedETAService.calculateSpecializedETA(
      rideType, 
      estimatedETA.distance || 5,
      {
        traffic: estimatedETA.traffic || false,
        weather: estimatedETA.weather || false,
        timeOfDay: estimatedETA.timeOfDay || false
      }
    );

    setEtaInfo(etaData);
  };

  const loadETACommunications = async () => {
    try {
      const result = await specializedETAService.getETACommunications(rideId);
      if (result.success) {
        setCommunications(result.data);
      }
    } catch (error) {
      console.error('Error loading ETA communications:', error);
    }
  };

  const sendETACommunication = async () => {
    if (!etaInfo || !driverId || !riderId) return;

    setLoading(true);
    try {
      const result = await specializedETAService.sendETACommunication(
        rideId,
        riderId,
        etaInfo,
        driverId
      );

      if (result.success) {
        toast.success('ETA communication sent to rider');
        await loadETACommunications();
        onETAUpdate?.(etaInfo);
        
        if (etaInfo.requiresConfirmation) {
          setShowConfirmationModal(true);
        }
      } else {
        toast.error('Failed to send ETA communication');
      }
    } catch (error) {
      console.error('Error sending ETA communication:', error);
      toast.error('Error sending communication');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationResponse = async (accepted) => {
    setConfirmationResponse(accepted);
    
    if (accepted) {
      toast.success('Ride confirmed - driver will proceed');
      // Here you would typically update the ride status
    } else {
      toast.error('Ride cancelled by rider');
      // Here you would typically cancel the ride
    }
    
    setShowConfirmationModal(false);
  };

  const getRideTypeIcon = (type) => {
    const icons = {
      tow_truck: TruckIcon,
      companion_driver: UserGroupIcon,
      medical: HeartIcon,
      wheelchair: ShieldCheckIcon,
      pet_friendly: '🐕',
      large: '🚐',
      premium: '✨',
      standard: '🚗'
    };
    return icons[type] || icons.standard;
  };

  const getRideTypeColor = (type) => {
    const colors = {
      tow_truck: 'bg-orange-100 text-orange-800 border-orange-200',
      companion_driver: 'bg-blue-100 text-blue-800 border-blue-200',
      medical: 'bg-red-100 text-red-800 border-red-200',
      wheelchair: 'bg-green-100 text-green-800 border-green-200',
      pet_friendly: 'bg-purple-100 text-purple-800 border-purple-200',
      large: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      premium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      standard: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || colors.standard;
  };

  if (!etaInfo) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Calculating ETA...</span>
        </div>
      </div>
    );
  }

  const IconComponent = getRideTypeIcon(rideType);

  return (
    <div className="space-y-4">
      {/* ETA Information Card */}
      <div className={`rounded-lg shadow-sm border p-6 ${getRideTypeColor(rideType)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {typeof IconComponent === 'string' ? (
              <span className="text-2xl">{IconComponent}</span>
            ) : (
              <IconComponent className="h-8 w-8" />
            )}
            <div>
              <h3 className="text-lg font-semibold capitalize">
                {rideType.replace('_', ' ')} Service
              </h3>
              <p className="text-sm opacity-80">
                Estimated arrival time
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">
              {etaInfo.estimatedMinutes} min
            </div>
            <div className="text-sm opacity-80">
              {etaInfo.minETA}-{etaInfo.maxETA} min range
            </div>
          </div>
        </div>

        {/* ETA Message */}
        <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <ChatBubbleLeftIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{etaInfo.message}</p>
          </div>
        </div>

        {/* Factors */}
        {etaInfo.factors && (
          <div className="mt-3 flex flex-wrap gap-2">
            {etaInfo.factors.traffic && (
              <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full">
                Heavy Traffic
              </span>
            )}
            {etaInfo.factors.weather && (
              <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                Weather Delay
              </span>
            )}
            {etaInfo.factors.timeOfDay && (
              <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                Rush Hour
              </span>
            )}
          </div>
        )}
      </div>

      {/* Communication Actions */}
      {etaInfo.communicationRequired && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Driver Communication</h4>
          
          <div className="space-y-3">
            <button
              onClick={sendETACommunication}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                  Send ETA Communication to Rider
                </>
              )}
            </button>

            {etaInfo.requiresConfirmation && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Confirmation Required
                    </p>
                    <p className="text-sm text-yellow-700">
                      This service requires rider confirmation due to extended wait time.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Communications */}
      {communications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Recent Communications</h4>
          
          <div className="space-y-3">
            {communications.slice(0, 3).map((comm, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <ClockIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{comm.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {comm.sentAt?.toDate?.()?.toLocaleTimeString() || 'Recently'}
                  </p>
                </div>
                {comm.status === 'sent' && (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmation Required
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Your {rideType.replace('_', ' ')} service will take approximately{' '}
              <strong>{etaInfo.estimatedMinutes} minutes</strong> to arrive. 
              Do you want to proceed with this booking?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleConfirmationResponse(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel Ride
              </button>
              <button
                onClick={() => handleConfirmationResponse(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm Ride
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecializedETACommunication;
