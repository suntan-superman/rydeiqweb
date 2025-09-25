import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';

class DriverBidService {
  constructor() {
    this.collection = 'driverBids';
  }

  // Get all bids for a specific ride request
  async getBidsForRide(rideRequestId) {
    try {
      const q = query(
        collection(db, this.collection),
        where('rideRequestId', '==', rideRequestId),
        where('status', '==', 'active'),
        orderBy('bidAmount', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching bids for ride:', error);
      return [];
    }
  }

  // Get all active bids (for admin dashboard)
  async getAllActiveBids() {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching all active bids:', error);
      return [];
    }
  }

  // Get bids by driver ID
  async getBidsByDriver(driverId, limit = 50) {
    try {
      const q = query(
        collection(db, this.collection),
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching bids by driver:', error);
      return [];
    }
  }

  // Submit a new bid
  async submitBid(bidData) {
    try {
      const bid = {
        ...bidData,
        status: 'active',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      };
      const docRef = await addDoc(collection(db, this.collection), bid);
      return { success: true, bidId: docRef.id };
    } catch (error) {
      console.error('Error submitting bid:', error);
      return { success: false, error: error.message };
    }
  }

  // Accept a bid (rider selects this bid)
  async acceptBid(bidId) {
    try {
      await updateDoc(doc(db, this.collection, bidId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error accepting bid:', error);
      return { success: false, error: error.message };
    }
  }

  // Reject a bid
  async rejectBid(bidId, reason = '') {
    try {
      await updateDoc(doc(db, this.collection, bidId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectionReason: reason
      });
      return { success: true };
    } catch (error) {
      console.error('Error rejecting bid:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel a bid (driver cancels their own bid)
  async cancelBid(bidId) {
    try {
      await updateDoc(doc(db, this.collection, bidId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error cancelling bid:', error);
      return { success: false, error: error.message };
    }
  }

  // Expire a bid (when time runs out)
  async expireBid(bidId) {
    try {
      await updateDoc(doc(db, this.collection, bidId), {
        status: 'expired',
        expiredAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error expiring bid:', error);
      return { success: false, error: error.message };
    }
  }

  // Get bid statistics for admin dashboard
  async getBidStatistics(timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);
      const q = query(
        collection(db, this.collection),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const bids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const stats = {
        totalBids: bids.length,
        activeBids: bids.filter(bid => bid.status === 'active').length,
        acceptedBids: bids.filter(bid => bid.status === 'accepted').length,
        rejectedBids: bids.filter(bid => bid.status === 'rejected').length,
        expiredBids: bids.filter(bid => bid.status === 'expired').length,
        cancelledBids: bids.filter(bid => bid.status === 'cancelled').length,
        averageBidAmount: this.calculateAverageBidAmount(bids),
        acceptanceRate: this.calculateAcceptanceRate(bids)
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching bid statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time listener for bids (for admin dashboard)
  subscribeToBids(callback) {
    const q = query(
      collection(db, this.collection),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const bids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(bids);
    });
  }

  // Helper method to calculate average bid amount
  calculateAverageBidAmount(bids) {
    if (bids.length === 0) return 0;
    const totalAmount = bids.reduce((sum, bid) => sum + (bid.bidAmount || 0), 0);
    return totalAmount / bids.length;
  }

  // Helper method to calculate acceptance rate
  calculateAcceptanceRate(bids) {
    if (bids.length === 0) return 0;
    const acceptedCount = bids.filter(bid => bid.status === 'accepted').length;
    return (acceptedCount / bids.length) * 100;
  }

  // Helper method to get start date for time range
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  // Clean up expired bids (should be called periodically)
  async cleanupExpiredBids() {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.collection),
        where('status', '==', 'active'),
        where('expiresAt', '<', now)
      );
      const snapshot = await getDocs(q);
      
      const expiredBids = snapshot.docs.map(doc => doc.id);
      const updatePromises = expiredBids.map(bidId => 
        this.expireBid(bidId)
      );
      
      await Promise.all(updatePromises);
      return { success: true, expiredCount: expiredBids.length };
    } catch (error) {
      console.error('Error cleaning up expired bids:', error);
      return { success: false, error: error.message };
    }
  }
}

const driverBidService = new DriverBidService();
export default driverBidService;
