import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRide } from '../contexts/RideContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RideHistoryPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { rideHistory, loading, loadRideHistory } = useRide();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (isAuthenticated && user) {
      loadRideHistory();
    }
  }, [isAuthenticated, user, navigate, loadRideHistory]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  if (!isAuthenticated || loading) {
    return <LoadingSpinner message="Loading ride history..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ride History</h1>
            <p className="text-gray-600 mt-1">
              View your past rides and trip details
            </p>
          </div>
          <Button onClick={() => navigate('/request-ride')} variant="primary">
            Request New Ride
          </Button>
        </div>

        {/* Ride History List */}
        {rideHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No rides yet
              </h3>
              <p className="text-gray-600 mb-4">
                Once you take your first ride, it will appear here
              </p>
              <Button onClick={() => navigate('/request-ride')} variant="primary">
                Book Your First Ride
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {rideHistory.map((ride) => (
              <div key={ride.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {ride.pickup?.address?.split(',')[0]} → {ride.destination?.address?.split(',')[0]}
                      </h3>
                      {getStatusBadge(ride.status)}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📅 {formatDate(ride.createdAt)}</p>
                      <p>💰 ${ride.finalFare?.toFixed(2) || ride.estimatedFare?.toFixed(2)}</p>
                      {ride.selectedDriverId && (
                        <p>👤 Driver: {ride.driverBids?.find(bid => bid.driverId === ride.selectedDriverId)?.driverInfo?.firstName || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Button variant="ghost" size="small">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RideHistoryPage; 