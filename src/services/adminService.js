import {
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from './firebase';
import { isAdmin } from './authService';

// Admin permissions check
const checkAdminPermissions = (currentUser) => {
  if (!isAdmin(currentUser)) {
    throw new Error('Insufficient permissions for admin operations');
  }
};

// ===== DRIVER MANAGEMENT =====

// Get all driver applications with pagination
export const getDriverApplications = async (currentUser, filters = {}, pagination = {}) => {
  try {
    checkAdminPermissions(currentUser);

    const { status, search, page = 1, pageSize = 20 } = { ...filters, ...pagination };
    
    let q = collection(db, 'driverApplications');
    
    // Add status filter
    if (status && status !== 'all') {
      q = query(q, where('status', '==', status));
    }
    
    // Add ordering and pagination
    q = query(q, orderBy('createdAt', 'desc'), limit(pageSize));
    
    const snapshot = await getDocs(q);
    const applications = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Apply search filter on client side for simplicity
      if (!search || 
          data.personalInfo?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          data.personalInfo?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
          data.personalInfo?.email?.toLowerCase().includes(search.toLowerCase())) {
        applications.push({
          id: doc.id,
          ...data
        });
      }
    });

    return {
      success: true,
      data: applications,
      pagination: {
        page,
        pageSize,
        hasMore: snapshot.docs.length === pageSize
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Get driver application details
export const getDriverApplicationDetails = async (currentUser, applicationId) => {
  try {
    checkAdminPermissions(currentUser);

    const docRef = doc(db, 'driverApplications', applicationId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Driver application not found');
    }

    return {
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Approve driver application
export const approveDriverApplication = async (currentUser, applicationId, notes = '') => {
  try {
    checkAdminPermissions(currentUser);

    const docRef = doc(db, 'driverApplications', applicationId);
    await updateDoc(docRef, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser.uid,
      adminNotes: notes,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Reject driver application
export const rejectDriverApplication = async (currentUser, applicationId, reason) => {
  try {
    checkAdminPermissions(currentUser);

    const docRef = doc(db, 'driverApplications', applicationId);
    await updateDoc(docRef, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: currentUser.uid,
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Suspend/Unsuspend driver
export const updateDriverStatus = async (currentUser, driverId, status, reason = '') => {
  try {
    checkAdminPermissions(currentUser);

    const docRef = doc(db, 'driverApplications', driverId);
    await updateDoc(docRef, {
      status: status,
      statusUpdatedAt: new Date().toISOString(),
      statusUpdatedBy: currentUser.uid,
      statusReason: reason,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// ===== RIDE MANAGEMENT =====

/**
 * Get all rides with filtering and cursor-based pagination
 * @param {Object} currentUser - Current admin user
 * @param {Object} filters - Filter options (status, driverId, customerId)
 * @param {Object} pagination - Pagination options (pageSize, lastDoc)
 * @returns {Promise<Object>} Paginated rides with hasMore indicator
 */
export const getRides = async (currentUser, filters = {}, pagination = {}) => {
  try {
    checkAdminPermissions(currentUser);

    const { status, driverId, customerId } = filters;
    const { pageSize = 20, lastDoc = null } = pagination;
    
    // Build query constraints
    let constraints = [];
    
    // Add filters
    if (status && status !== 'all') {
      constraints.push(where('status', '==', status));
    }
    if (driverId) {
      constraints.push(where('driverId', '==', driverId));
    }
    if (customerId) {
      constraints.push(where('customerId', '==', customerId));
    }
    
    // Add ordering
    constraints.push(orderBy('createdAt', 'desc'));
    
    // Add cursor for pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    // Fetch one extra to check if there's more
    constraints.push(limit(pageSize + 1));
    
    const q = query(collection(db, 'rides'), ...constraints);
    const snapshot = await getDocs(q);
    
    const rides = [];
    let lastVisible = null;
    let hasMore = false;
    
    snapshot.forEach((doc, index) => {
      if (index < pageSize) {
        rides.push({
          id: doc.id,
          ...doc.data()
        });
        lastVisible = doc;
      } else {
        hasMore = true;
      }
    });

    return {
      success: true,
      data: rides,
      pagination: {
        pageSize,
        hasMore,
        lastDoc: lastVisible,
        totalFetched: rides.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Get ride details
export const getRideDetails = async (currentUser, rideId) => {
  try {
    checkAdminPermissions(currentUser);

    const docRef = doc(db, 'rides', rideId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Ride not found');
    }

    return {
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// ===== ANALYTICS & METRICS =====

// Get recent driver applications for overview
export const getRecentDriverApplications = async (currentUser, limitCount = 5) => {
  try {
    checkAdminPermissions(currentUser);

    const applicationsQuery = query(
      collection(db, 'driverApplications'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(applicationsQuery);
    const applications = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        id: doc.id,
        ...data,
        name: `${data.personalInfo?.firstName || ''} ${data.personalInfo?.lastName || ''}`.trim() || 'Unknown',
        email: data.personalInfo?.email || data.email || 'No email',
        createdAt: data.createdAt,
        status: data.approvalStatus?.status || data.status || 'pending'
      });
    });

    return {
      success: true,
      data: applications
    };
  } catch (error) {
    console.error('Error getting recent applications:', error);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      },
      data: []
    };
  }
};

// Get platform overview metrics
export const getPlatformMetrics = async (currentUser, timeRange = '7days') => {
  try {
    checkAdminPermissions(currentUser);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '24hours':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get all users count
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const totalUsers = usersSnapshot.size;

    // Get driver metrics
    const driversQuery = query(collection(db, 'driverApplications'));
    const driversSnapshot = await getDocs(driversQuery);
    
    let totalDrivers = 0;
    let activeDrivers = 0;
    let approvedDrivers = 0;
    let pendingApplications = 0;
    
    driversSnapshot.forEach((doc) => {
      const data = doc.data();
      totalDrivers++;
      
      // Check approval status
      if (data.approvalStatus?.status === 'approved') {
        approvedDrivers++;
      }
      
      // Check activity status
      if (data.status === 'approved' || data.status === 'active' || data.status === 'available') {
        activeDrivers++;
      } else if (data.status === 'pending' || data.status === 'review_pending') {
        pendingApplications++;
      }
    });

    // Get ride metrics
    const ridesQuery = query(
      collection(db, 'rides'),
      where('createdAt', '>=', startDate.toISOString()),
      where('createdAt', '<=', endDate.toISOString())
    );
    const ridesSnapshot = await getDocs(ridesQuery);
    
    let totalRides = 0;
    let completedRides = 0;
    let cancelledRides = 0;
    let totalRevenue = 0;
    let totalCommission = 0;
    
    ridesSnapshot.forEach((doc) => {
      const data = doc.data();
      totalRides++;
      
      if (data.status === 'completed') {
        completedRides++;
        totalRevenue += data.fare || 0;
        totalCommission += data.commission || 0;
      } else if (data.status === 'cancelled') {
        cancelledRides++;
      }
    });

    return {
      success: true,
      data: {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalUsers,
        activeDrivers,
        drivers: {
          total: totalDrivers,
          active: activeDrivers,
          approved: approvedDrivers,
          pending: pendingApplications,
          approvalRate: totalDrivers > 0 ? (approvedDrivers / totalDrivers * 100).toFixed(1) : 0
        },
        rides: {
          total: totalRides,
          completed: completedRides,
          cancelled: cancelledRides,
          completionRate: totalRides > 0 ? (completedRides / totalRides * 100).toFixed(1) : 0
        },
        revenue: {
          total: totalRevenue,
          commission: totalCommission,
          averageRide: completedRides > 0 ? (totalRevenue / completedRides).toFixed(2) : 0
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Get driver performance metrics
export const getDriverMetrics = async (currentUser, driverId, timeRange = '30days') => {
  try {
    checkAdminPermissions(currentUser);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange.replace('days', '')));

    const ridesQuery = query(
      collection(db, 'rides'),
      where('driverId', '==', driverId),
      where('createdAt', '>=', startDate.toISOString()),
      where('createdAt', '<=', endDate.toISOString())
    );
    
    const ridesSnapshot = await getDocs(ridesQuery);
    
    let totalRides = 0;
    let completedRides = 0;
    let totalEarnings = 0;
    let totalRating = 0;
    let ratingCount = 0;
    
    ridesSnapshot.forEach((doc) => {
      const data = doc.data();
      totalRides++;
      
      if (data.status === 'completed') {
        completedRides++;
        totalEarnings += data.driverEarnings || 0;
        
        if (data.driverRating) {
          totalRating += data.driverRating;
          ratingCount++;
        }
      }
    });

    return {
      success: true,
      data: {
        timeRange,
        totalRides,
        completedRides,
        totalEarnings,
        averageRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0,
        completionRate: totalRides > 0 ? (completedRides / totalRides * 100).toFixed(1) : 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// ===== FINANCIAL MANAGEMENT =====

// Get pending payouts
export const getPendingPayouts = async (currentUser) => {
  try {
    checkAdminPermissions(currentUser);

    const payoutsQuery = query(
      collection(db, 'payouts'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(payoutsQuery);
    const payouts = [];
    
    snapshot.forEach((doc) => {
      payouts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: payouts
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Process payout
export const processPayout = async (currentUser, payoutId) => {
  try {
    checkAdminPermissions(currentUser);

    const docRef = doc(db, 'payouts', payoutId);
    await updateDoc(docRef, {
      status: 'processed',
      processedAt: new Date().toISOString(),
      processedBy: currentUser.uid
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// ===== SYSTEM MANAGEMENT =====

// Get system settings
export const getSystemSettings = async (currentUser) => {
  try {
    checkAdminPermissions(currentUser);

    const docRef = doc(db, 'systemSettings', 'main');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Return default settings if none exist
      return {
        success: true,
        data: {
          commissionRate: 15,
          minimumFare: 5.00,
          cancellationFee: 2.50,
          driverApprovalRequired: true,
          autoMatchRides: true
        }
      };
    }

    return {
      success: true,
      data: docSnap.data()
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// Update system settings
export const updateSystemSettings = async (currentUser, settings) => {
  try {
    checkAdminPermissions(currentUser);

    const docRef = doc(db, 'systemSettings', 'main');
    await updateDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.uid
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

// ===== CUSTOMER SUPPORT =====

// Get support tickets
export const getSupportTickets = async (currentUser, filters = {}) => {
  try {
    checkAdminPermissions(currentUser);

    const { status = 'all', priority = 'all' } = filters;
    
    let q = collection(db, 'supportTickets');
    
    if (status !== 'all') {
      q = query(q, where('status', '==', status));
    }
    if (priority !== 'all') {
      q = query(q, where('priority', '==', priority));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const tickets = [];
    
    snapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: tickets
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
};

const adminService = {
  // Driver Management
  getDriverApplications,
  getDriverApplicationDetails,
  approveDriverApplication,
  rejectDriverApplication,
  updateDriverStatus,
  
  // Ride Management
  getRides,
  getRideDetails,
  
  // Analytics
  getPlatformMetrics,
  getDriverMetrics,
  
  // Financial
  getPendingPayouts,
  processPayout,
  
  // System
  getSystemSettings,
  updateSystemSettings,
  
  // Support
  getSupportTickets
};

export default adminService; 