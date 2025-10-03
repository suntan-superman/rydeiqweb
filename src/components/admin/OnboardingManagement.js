import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getDriverApplications
} from '../../services/adminService';
import { 
  setOnboardingStatus,
  checkOnboardingStatus
} from '../../services/driverService';
import { useConfirm } from '../../hooks/useConfirm';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

// Helper function to format Firestore timestamp
const formatDate = (timestamp) => {
  if (!timestamp) return 'Not available';
  
  try {
    // Handle Firestore Timestamp object
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    }
    // Handle timestamp with seconds property
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    // Handle ISO string or regular date
    return new Date(timestamp).toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const OnboardingManagement = () => {
  const { user } = useAuth();
  const { showConfirm, ConfirmDialog } = useConfirm();
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [filters, setFilters] = useState({
    onboardingStatus: 'all',
    search: '',
    sortBy: 'newest'
  });

  const isAuthorizedAdmin = user?.email === 'sroy@worksidesoftware.com';

  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDriverApplications(user, { status: 'all' });
      
      if (result.success) {
        setDrivers(result.data);
      } else {
        toast.error('Failed to load drivers');
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Error loading drivers');
    } finally {
      setLoading(false);
    }
  }, [user]);


  const applyFilters = useCallback(() => {
    let filtered = [...drivers];

    // Onboarding status filter
    if (filters.onboardingStatus !== 'all') {
      filtered = filtered.filter(driver => {
        const isCompleted = driver.onboardingStatus?.completed || false;
        return filters.onboardingStatus === 'completed' ? isCompleted : !isCompleted;
      });
    }

    // Search filter - handle both personalInfo and personal_info structures
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(driver => {
        const personalInfo = driver.personalInfo || driver.personal_info || {};
        return (
          personalInfo.firstName?.toLowerCase().includes(searchLower) ||
          personalInfo.lastName?.toLowerCase().includes(searchLower) ||
          personalInfo.email?.toLowerCase().includes(searchLower) ||
          driver.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          const aInfo = a.personalInfo || a.personal_info || {};
          const bInfo = b.personalInfo || b.personal_info || {};
          return (aInfo.firstName || '').localeCompare(bInfo.firstName || '');
        default:
          return 0;
      }
    });

    setFilteredDrivers(filtered);
  }, [drivers, filters]);

  // Load drivers
  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleToggleOnboarding = async (driverId, currentStatus, driverName = '') => {
    if (!isAuthorizedAdmin) {
      toast.error('Only authorized administrators can modify onboarding status');
      return;
    }

    const newStatus = !currentStatus;
    
    // Show confirmation only when setting to pending (reverting onboarding)
    if (!newStatus) {
      const confirmed = await showConfirm({
        title: 'Revert Onboarding Status',
        message: (
          <div className="text-left">
            <p className="mb-3">Are you sure you want to set this driver's onboarding status to <strong className="text-red-600">PENDING</strong>?</p>
            {driverName && (
              <div className="bg-gray-50 rounded p-3 mb-3">
                <p className="text-sm font-medium text-gray-900">{driverName}</p>
              </div>
            )}
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will mark the driver's onboarding as incomplete and may affect their ability to accept rides.
              </p>
            </div>
          </div>
        ),
        confirmText: 'Yes, Set to Pending',
        cancelText: 'Cancel',
        variant: 'danger'
      });
      
      if (!confirmed) {
        return;
      }
    }

    try {
      setActionLoading(true);
      const result = await setOnboardingStatus(driverId, newStatus, user.uid);
      
      if (result.success) {
        toast.success(`Onboarding status ${newStatus ? 'completed' : 'set to pending'}`);
        loadDrivers();
        setShowDetailsModal(false);
      } else {
        toast.error('Failed to update onboarding status');
      }
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      toast.error('Error updating onboarding status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (driverId) => {
    try {
      const result = await checkOnboardingStatus(driverId);
      if (result.success) {
        const driver = drivers.find(d => d.userId === driverId);
        const combinedDriver = { ...driver, ...result.data };
        setSelectedDriver(combinedDriver);
        setShowDetailsModal(true);
      } else {
        toast.error('Failed to load driver details');
      }
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Error loading driver details');
    }
  };

  const getOnboardingStatusBadge = (onboardingStatus) => {
    const isCompleted = onboardingStatus?.completed || false;
    const statusStyles = isCompleted 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusStyles}`}>
        {isCompleted ? '✅ Complete' : '⏳ Pending'}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading drivers..." />;
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800">Access Restricted</h3>
              <p className="text-red-700 mt-1">
                Only authorized administrators can access onboarding management. 
                Contact the system administrator for access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Onboarding Management</h2>
          <p className="text-gray-600 mt-1">
            Manage driver onboarding status for mobile app testing
          </p>
        </div>
        <Button onClick={loadDrivers} variant="outline">
          🔄 Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Onboarding Status
            </label>
            <select
              value={filters.onboardingStatus}
              onChange={(e) => setFilters({ ...filters, onboardingStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Drivers</option>
              <option value="completed">Onboarding Complete</option>
              <option value="pending">Onboarding Pending</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {/* Test button for debugging */}
          {/* <button
            onClick={testLoadDrivers}
            className="w-full px-3 py-2 bg-green-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Test Load Drivers
          </button> */}
        </div>
      </div>

      {/* Drivers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Drivers</h3>
        </div>
        
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No drivers found</div>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDrivers.map((driver) => {
              const personalInfo = driver.personalInfo || driver.personal_info || {};
              return (
                <div key={driver.userId} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {personalInfo.firstName?.[0]}{personalInfo.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {personalInfo.firstName} {personalInfo.lastName}
                        </h4>
                        <p className="text-gray-600">{personalInfo.email || driver.email}</p>
                        <p className="text-sm text-gray-500">
                          Created: {formatDate(driver.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {getOnboardingStatusBadge(driver.onboardingStatus)}
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => handleViewDetails(driver.userId)}
                        >
                          View Details
                        </Button>
                        
                        <Button
                          variant={driver.onboardingStatus?.completed ? "danger" : "success"}
                          size="small"
                          onClick={() => handleToggleOnboarding(
                            driver.userId, 
                            driver.onboardingStatus?.completed || false,
                            `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()
                          )}
                          loading={actionLoading}
                        >
                          {driver.onboardingStatus?.completed ? 'Set Pending' : 'Mark Complete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Info */}
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Vehicle:</span>
                      <span className="ml-2 text-gray-900">
                        {driver.vehicleInfo?.year} {driver.vehicleInfo?.make} {driver.vehicleInfo?.model}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">License:</span>
                      <span className="ml-2 text-gray-900">
                        {driver.vehicleInfo?.licensePlate}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Progress:</span>
                      <span className="ml-2 text-gray-900">
                        {driver.progress || 0}% Complete
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Driver Details Modal */}
      {showDetailsModal && selectedDriver && (
        <DriverDetailsModal
          driver={selectedDriver}
          onClose={() => setShowDetailsModal(false)}
          onToggleOnboarding={handleToggleOnboarding}
          actionLoading={actionLoading}
          isAuthorizedAdmin={isAuthorizedAdmin}
        />
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  );
};

// Driver Details Modal Component
const DriverDetailsModal = ({ driver, onClose, onToggleOnboarding, actionLoading, isAuthorizedAdmin }) => {
  const isCompleted = driver.onboardingStatus?.completed || false;
  
  // Handle both data structures - check for step-based data first
  const personalInfo = driver.personal_info || driver.personalInfo || {};
  const vehicleInfo = driver.vehicle_info || driver.vehicleInfo || {};
  const documents = driver.documents || {};

  // Helper function to format Firebase timestamps
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown';
    
    try {
      // Handle Firebase timestamp
      if (dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleString();
      }
      // Handle regular date string
      return new Date(dateValue).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Driver Onboarding Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Driver ID:</span>
                <span className="ml-2 text-gray-900">{driver.userId}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{driver.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 text-gray-900">{driver.status || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">{formatDate(driver.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 text-gray-900">
                  {personalInfo.firstName} {personalInfo.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{personalInfo.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2 text-gray-900">{personalInfo.phoneNumber || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-500">Date of Birth:</span>
                <span className="ml-2 text-gray-900">{personalInfo.dateOfBirth || 'Not provided'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Address:</span>
                <span className="ml-2 text-gray-900">
                  {personalInfo.address ? (
                    typeof personalInfo.address === 'string' ? (
                      personalInfo.address
                    ) : (
                      `${personalInfo.address.street || ''}, ${personalInfo.address.city || ''}, ${personalInfo.address.state || ''} ${personalInfo.address.zipCode || ''}`
                    )
                  ) : (
                    'Not provided'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          {Object.keys(vehicleInfo).length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Make:</span>
                  <span className="ml-2 text-gray-900">{vehicleInfo.make || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Model:</span>
                  <span className="ml-2 text-gray-900">{vehicleInfo.model || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Year:</span>
                  <span className="ml-2 text-gray-900">{vehicleInfo.year || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Color:</span>
                  <span className="ml-2 text-gray-900">{vehicleInfo.color || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-500">License Plate:</span>
                  <span className="ml-2 text-gray-900">{vehicleInfo.licensePlate || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Vehicle Type:</span>
                  <span className="ml-2 text-gray-900">{vehicleInfo.vehicleType || 'Not provided'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {Object.keys(documents).length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Documents</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(documents).map(([docType, docData]) => (
                  <div key={docType}>
                    <span className="text-gray-500">{docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                    <span className="ml-2 text-gray-900">
                      {docData.url ? '✅ Uploaded' : '❌ Not uploaded'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onboarding Status */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Onboarding Status</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isCompleted ? '✅ Complete' : '⏳ Pending'}
                </span>
              </div>
              
              {driver.onboardingStatus?.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Completed At:</span>
                  <span className="text-gray-900">
                    {formatDate(driver.onboardingStatus.completedAt)}
                  </span>
                </div>
              )}
              
              {driver.onboardingStatus?.completedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Completed By:</span>
                  <span className="text-gray-900">{driver.onboardingStatus.completedBy}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Last Updated:</span>
                <span className="text-gray-900">
                  {formatDate(driver.onboardingStatus?.lastUpdated)}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile App Status */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Mobile App Status</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Account Created:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  driver.mobileAppStatus?.accountCreated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {driver.mobileAppStatus?.accountCreated ? 'Yes' : 'No'}
                </span>
              </div>
              
              {driver.mobileAppStatus?.accountCreatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Created At:</span>
                  <span className="text-gray-900">
                    {formatDate(driver.mobileAppStatus.accountCreatedAt)}
                  </span>
                </div>
              )}
              
              {driver.mobileAppStatus?.lastMobileLogin && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Last Mobile Login:</span>
                  <span className="text-gray-900">
                    {formatDate(driver.mobileAppStatus.lastMobileLogin)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors"
            >
              Close
            </button>
            
            {isAuthorizedAdmin && (
              <button
                onClick={() => onToggleOnboarding(
                  driver.userId, 
                  isCompleted,
                  `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()
                )}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  actionLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : isCompleted 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {actionLoading ? 'Updating...' : isCompleted ? 'Set to Pending' : 'Mark Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingManagement; 