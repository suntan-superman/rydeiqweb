import React, { useState, useEffect, useCallback } from 'react';
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  TruckIcon,
  ArrowPathIcon,
  BellIcon,
  EyeIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';
import notificationService from '../../services/notificationService';

/**
 * Scheduled Ride Requests Component
 * Shows pending scheduled ride requests that drivers can accept or decline
 * Integrates with the medical driver integration service
 */
const ScheduledRideRequests = ({ driverId, onRideAccepted, onRideDeclined }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);

  // Load pending scheduled ride requests for this driver
  const loadPendingRequests = useCallback(async () => {
    if (!driverId) return;

    try {
      setLoading(true);
      
      // Query for scheduled ride requests where this driver was notified
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', driverId),
        where('type', 'in', ['scheduled_ride_request', 'medical_ride_request']),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(notificationsQuery, async (snapshot) => {
        const requests = [];
        
        for (const docSnapshot of snapshot.docs) {
          const notification = { id: docSnapshot.id, ...docSnapshot.data() };
          
          // Get the ride details from the notification data
          if (notification.data?.rideId) {
            try {
              // Try to get medical ride first
              const medicalRideRef = doc(db, 'medicalRideSchedule', notification.data.rideId);
              const medicalRideSnap = await getDoc(medicalRideRef);
              
              if (medicalRideSnap.exists()) {
                const rideData = { id: medicalRideSnap.id, ...medicalRideSnap.data() };
                requests.push({
                  ...rideData,
                  notificationId: notification.id,
                  requestType: 'medical',
                  notification: notification
                });
              } else {
                // Try regular scheduled ride
                const scheduledRideRef = doc(db, 'scheduledRides', notification.data.rideId);
                const scheduledRideSnap = await getDoc(scheduledRideRef);
                
                if (scheduledRideSnap.exists()) {
                  const rideData = { id: scheduledRideSnap.id, ...scheduledRideSnap.data() };
                  requests.push({
                    ...rideData,
                    notificationId: notification.id,
                    requestType: 'regular',
                    notification: notification
                  });
                }
              }
            } catch (error) {
              console.error('Error loading ride details:', error);
            }
          }
        }
        
        setPendingRequests(requests);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    const unsubscribe = loadPendingRequests();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadPendingRequests]);

  // Handle accept ride request
  const handleAcceptRequest = async (request) => {
    try {
      setRespondingTo(request.id);
      
      // Update notification status
      await updateDoc(doc(db, 'notifications', request.notificationId), {
        status: 'accepted',
        respondedAt: serverTimestamp(),
        response: 'accepted'
      });

      // Update ride status
      const rideCollection = request.requestType === 'medical' ? 'medicalRideSchedule' : 'scheduledRides';
      await updateDoc(doc(db, rideCollection, request.id), {
        assignedDriverId: driverId,
        status: 'assigned',
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send confirmation notification to dispatcher/patient
      await notificationService.sendNotification(
        request.patientId || request.dispatcherId,
        {
          type: 'ride_accepted',
          title: 'Ride Accepted',
          message: `Driver has accepted your scheduled ride for ${formatDate(request.pickupDateTime || request.appointmentDateTime)}`,
          data: { rideId: request.id, driverId }
        }
      );

      toast.success('Ride request accepted successfully!', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
        },
        icon: '✅',
      });

      onRideAccepted?.(request);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      setShowDetailsModal(false);
      
    } catch (error) {
      console.error('Error accepting ride request:', error);
      toast.error('Failed to accept ride request. Please try again.', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
        },
        icon: '❌',
      });
    } finally {
      setRespondingTo(null);
    }
  };

  // Handle decline ride request
  const handleDeclineRequest = async (request) => {
    try {
      setRespondingTo(request.id);
      
      // Update notification status
      await updateDoc(doc(db, 'notifications', request.notificationId), {
        status: 'declined',
        respondedAt: serverTimestamp(),
        response: 'declined'
      });

      toast.success('Ride request declined', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#6B7280',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
        },
        icon: 'ℹ️',
      });

      onRideDeclined?.(request);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      setShowDetailsModal(false);
      
    } catch (error) {
      console.error('Error declining ride request:', error);
      toast.error('Failed to decline ride request. Please try again.', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
        },
        icon: '❌',
      });
    } finally {
      setRespondingTo(null);
    }
  };

  // Format date/time for display
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get ride type icon and color
  const getRideTypeInfo = (request) => {
    if (request.requestType === 'medical') {
      return {
        icon: HeartIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Medical Transport'
      };
    }
    return {
      icon: TruckIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'Scheduled Ride'
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BellIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Scheduled Ride Requests
              </h3>
              <p className="text-sm text-gray-600">
                {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={loadPendingRequests}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Refresh requests"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-600">
            You don't have any scheduled ride requests at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const typeInfo = getRideTypeInfo(request);
            const TypeIcon = typeInfo.icon;
            
            return (
              <div
                key={request.id}
                className={`bg-white rounded-lg shadow-sm border-2 ${typeInfo.borderColor} p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 ${typeInfo.bgColor} rounded-lg`}>
                        <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{typeInfo.label}</h4>
                        <p className="text-sm text-gray-600">
                          Requested {formatDateTime(request.notification?.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatDateTime(request.pickupDateTime || request.appointmentDateTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 truncate">
                          {request.pickupLocation?.address || request.pickupLocation}
                        </span>
                      </div>
                      {request.dropoffLocation && (
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPinIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 truncate">
                            {request.dropoffLocation?.address || request.dropoffLocation}
                          </span>
                        </div>
                      )}
                      {request.patientId && (
                        <div className="flex items-center space-x-2 text-sm">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Patient: {request.patientId}</span>
                        </div>
                      )}
                    </div>

                    {/* Medical Requirements */}
                    {request.requestType === 'medical' && request.medicalRequirements && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                          <InformationCircleIcon className="h-4 w-4 mr-1" />
                          Medical Requirements
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {request.medicalRequirements.wheelchairAccessible && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ♿ Wheelchair
                            </span>
                          )}
                          {request.medicalRequirements.oxygenSupport && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🫁 Oxygen Support
                            </span>
                          )}
                          {request.medicalRequirements.stretcherRequired && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              🏥 Stretcher
                            </span>
                          )}
                          {request.medicalRequirements.assistanceLevel && request.medicalRequirements.assistanceLevel !== 'none' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              🤝 {request.medicalRequirements.assistanceLevel} Assistance
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailsModal(true);
                      }}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    
                    <button
                      onClick={() => handleAcceptRequest(request)}
                      disabled={respondingTo === request.id}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {respondingTo === request.id ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4" />
                      )}
                      <span>Accept</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeclineRequest(request)}
                      disabled={respondingTo === request.id}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onAccept={() => handleAcceptRequest(selectedRequest)}
          onDecline={() => handleDeclineRequest(selectedRequest)}
          onClose={() => setShowDetailsModal(false)}
          respondingTo={respondingTo}
        />
      )}
    </div>
  );
};

// Request Details Modal Component
const RequestDetailsModal = ({ request, onAccept, onDecline, onClose, respondingTo }) => {
  const typeInfo = request.requestType === 'medical' 
    ? { icon: HeartIcon, color: 'text-red-600', label: 'Medical Transport' }
    : { icon: TruckIcon, color: 'text-blue-600', label: 'Scheduled Ride' };
  const TypeIcon = typeInfo.icon;

  // Format date/time for display
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 bg-gray-100 rounded-lg`}>
                <TypeIcon className={`h-6 w-6 ${typeInfo.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {typeInfo.label} Details
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time
                </label>
                <p className="text-gray-900">
                  {formatDateTime(request.pickupDateTime || request.appointmentDateTime)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID
                </label>
                <p className="text-gray-900">{request.patientId || 'N/A'}</p>
              </div>
            </div>

            {/* Locations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location
              </label>
              <div className="flex items-start space-x-2">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <p className="text-gray-900">
                  {request.pickupLocation?.address || request.pickupLocation}
                </p>
              </div>
            </div>

            {request.dropoffLocation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drop-off Location
                </label>
                <div className="flex items-start space-x-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <p className="text-gray-900">
                    {request.dropoffLocation?.address || request.dropoffLocation}
                  </p>
                </div>
              </div>
            )}

            {/* Medical Requirements */}
            {request.requestType === 'medical' && request.medicalRequirements && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
                  <InformationCircleIcon className="h-5 w-5 mr-2" />
                  Medical Requirements
                </h4>
                <div className="space-y-2">
                  {request.medicalRequirements.wheelchairAccessible && (
                    <p className="text-sm text-yellow-700">♿ Wheelchair accessible vehicle required</p>
                  )}
                  {request.medicalRequirements.oxygenSupport && (
                    <p className="text-sm text-yellow-700">🫁 Oxygen support equipment required</p>
                  )}
                  {request.medicalRequirements.stretcherRequired && (
                    <p className="text-sm text-yellow-700">🏥 Stretcher transport capability required</p>
                  )}
                  {request.medicalRequirements.assistanceLevel && request.medicalRequirements.assistanceLevel !== 'none' && (
                    <p className="text-sm text-yellow-700">
                      🤝 {request.medicalRequirements.assistanceLevel} level assistance required
                    </p>
                  )}
                  {request.medicalRequirements.specialInstructions && (
                    <div>
                      <p className="text-sm font-medium text-yellow-800 mb-1">Special Instructions:</p>
                      <p className="text-sm text-yellow-700">{request.medicalRequirements.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {request.specialInstructions && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {request.specialInstructions}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onDecline}
              disabled={respondingTo === request.id}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
            >
              <XCircleIcon className="h-4 w-4" />
              <span>Decline</span>
            </button>
            <button
              onClick={onAccept}
              disabled={respondingTo === request.id}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
            >
              {respondingTo === request.id ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              <span>Accept Ride</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledRideRequests;
