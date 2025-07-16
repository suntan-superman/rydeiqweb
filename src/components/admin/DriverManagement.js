import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getDriverApplications, 
  getDriverApplicationDetails, 
  approveDriverApplication, 
  rejectDriverApplication
} from '../../services/adminService';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const DriverManagement = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'newest'
  });

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Applications' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'review_pending', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' }
  ];

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDriverApplications(user, { status: 'all' });
      
      if (result.success) {
        setApplications(result.data);
      } else {
        toast.error('Failed to load driver applications');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Error loading applications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const applyFilters = useCallback(() => {
    let filtered = [...applications];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.personalInfo?.firstName?.toLowerCase().includes(searchLower) ||
        app.personalInfo?.lastName?.toLowerCase().includes(searchLower) ||
        app.personalInfo?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return (a.personalInfo?.firstName || '').localeCompare(b.personalInfo?.firstName || '');
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  }, [applications, filters]);

  // Load applications
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleViewDetails = async (applicationId) => {
    try {
      const result = await getDriverApplicationDetails(user, applicationId);
      if (result.success) {
        setSelectedApplication(result.data);
        setShowDetailsModal(true);
      } else {
        toast.error('Failed to load application details');
      }
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Error loading application details');
    }
  };

  const handleApprove = async (applicationId, notes = '') => {
    try {
      setActionLoading(true);
      const result = await approveDriverApplication(user, applicationId, notes);
      
      if (result.success) {
        toast.success('Driver application approved successfully');
        loadApplications();
        setShowDetailsModal(false);
      } else {
        toast.error('Failed to approve application');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Error approving application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (applicationId, reason) => {
    try {
      setActionLoading(true);
      const result = await rejectDriverApplication(user, applicationId, reason);
      
      if (result.success) {
        toast.success('Driver application rejected');
        loadApplications();
        setShowDetailsModal(false);
      } else {
        toast.error('Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Error rejecting application');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      review_pending: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800'
    };

    const statusLabels = {
      pending: 'Pending',
      review_pending: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      suspended: 'Suspended'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[status] || statusStyles.pending}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading driver applications..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
          <p className="text-gray-600 mt-1">
            Manage driver applications and account status
          </p>
        </div>
        <Button onClick={loadApplications} variant="outline">
          🔄 Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
          
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Applications</h3>
        </div>
        
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No applications found</div>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((application) => (
              <div key={application.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {application.personalInfo?.firstName?.[0]}{application.personalInfo?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {application.personalInfo?.firstName} {application.personalInfo?.lastName}
                      </h4>
                      <p className="text-gray-600">{application.personalInfo?.email}</p>
                      <p className="text-sm text-gray-500">
                        Applied: {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(application.status)}
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleViewDetails(application.id)}
                      >
                        View Details
                      </Button>
                      
                      {application.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="small"
                            onClick={() => handleApprove(application.id)}
                            loading={actionLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleReject(application.id, 'Application rejected by admin')}
                            loading={actionLoading}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quick Info */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Vehicle:</span>
                    <span className="ml-2 text-gray-900">
                      {application.vehicleInfo?.year} {application.vehicleInfo?.make} {application.vehicleInfo?.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">License:</span>
                    <span className="ml-2 text-gray-900">
                      {application.vehicleInfo?.licensePlate}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <span className="ml-2 text-gray-900">
                      {application.progress || 0}% Complete
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => setShowDetailsModal(false)}
          onApprove={handleApprove}
          onReject={handleReject}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// Application Details Modal Component
const ApplicationDetailsModal = ({ application, onClose, onApprove, onReject, actionLoading }) => {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApproveWithNotes = () => {
    onApprove(application.id, notes);
  };

  const handleRejectWithReason = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    onReject(application.id, rejectionReason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Driver Application Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="mt-1 text-gray-900">
                  {application.personalInfo?.firstName} {application.personalInfo?.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{application.personalInfo?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-gray-900">{application.personalInfo?.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <p className="mt-1 text-gray-900">{application.personalInfo?.dateOfBirth}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                <p className="mt-1 text-gray-900">
                  {application.vehicleInfo?.year} {application.vehicleInfo?.make} {application.vehicleInfo?.model}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">License Plate</label>
                <p className="mt-1 text-gray-900">{application.vehicleInfo?.licensePlate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <p className="mt-1 text-gray-900">{application.vehicleInfo?.color}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="mt-1 text-gray-900">{application.vehicleInfo?.type}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {application.status === 'pending' && !showRejectForm && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Review Actions</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes about this application..."
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    variant="success"
                    onClick={handleApproveWithNotes}
                    loading={actionLoading}
                    className="flex-1"
                  >
                    ✓ Approve Application
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1"
                  >
                    ✗ Reject Application
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Reject Application</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please provide a clear reason for rejection..."
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleRejectWithReason}
                    loading={actionLoading}
                    className="flex-1"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverManagement; 