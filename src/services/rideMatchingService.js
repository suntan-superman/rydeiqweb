import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

class RideMatchingService {
  constructor() {
    this.collection = 'rideMatching';
  }

  // Create a ride match
  async createMatch(rideRequestId, driverId, riderId, matchData) {
    try {
      const match = {
        rideRequestId,
        driverId,
        riderId,
        status: 'pending',
        matchScore: matchData.score || 0.8,
        estimatedPickup: matchData.estimatedPickup,
        estimatedDropoff: matchData.estimatedDropoff,
        distance: matchData.distance || 0,
        duration: matchData.duration || 0,
        fare: matchData.fare || 0,
        pickupLocation: matchData.pickupLocation,
        dropoffLocation: matchData.dropoffLocation,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, this.collection), match);
      return { success: true, matchId: docRef.id };
    } catch (error) {
      console.error('Error creating match:', error);
      return { success: false, error: error.message };
    }
  }

  // Get matches for a specific user
  async getMatchesForUser(userId, userType = 'rider', limitCount = 50) {
    try {
      const field = userType === 'driver' ? 'driverId' : 'riderId';
      const q = query(
        collection(db, this.collection),
        where(field, '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching matches for user:', error);
      return [];
    }
  }

  // Get active matches (for admin dashboard)
  async getActiveMatches() {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', 'in', ['pending', 'matched']),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching active matches:', error);
      return [];
    }
  }

  // Get match by ID
  async getMatchById(matchId) {
    try {
      const docRef = doc(db, this.collection, matchId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Match not found' };
      }
    } catch (error) {
      console.error('Error fetching match by ID:', error);
      return { success: false, error: error.message };
    }
  }

  // Accept a match (rider accepts the match)
  async acceptMatch(matchId) {
    try {
      await updateDoc(doc(db, this.collection, matchId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error accepting match:', error);
      return { success: false, error: error.message };
    }
  }

  // Reject a match
  async rejectMatch(matchId, reason = '') {
    try {
      await updateDoc(doc(db, this.collection, matchId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectionReason: reason
      });
      return { success: true };
    } catch (error) {
      console.error('Error rejecting match:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete a match (ride completed)
  async completeMatch(matchId, completionData = {}) {
    try {
      await updateDoc(doc(db, this.collection, matchId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        ...completionData
      });
      return { success: true };
    } catch (error) {
      console.error('Error completing match:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel a match
  async cancelMatch(matchId, reason = '') {
    try {
      await updateDoc(doc(db, this.collection, matchId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancellationReason: reason
      });
      return { success: true };
    } catch (error) {
      console.error('Error cancelling match:', error);
      return { success: false, error: error.message };
    }
  }

  // Get match statistics for admin dashboard
  async getMatchStatistics(timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);
      const q = query(
        collection(db, this.collection),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const stats = {
        totalMatches: matches.length,
        pendingMatches: matches.filter(match => match.status === 'pending').length,
        acceptedMatches: matches.filter(match => match.status === 'accepted').length,
        rejectedMatches: matches.filter(match => match.status === 'rejected').length,
        completedMatches: matches.filter(match => match.status === 'completed').length,
        cancelledMatches: matches.filter(match => match.status === 'cancelled').length,
        averageMatchScore: this.calculateAverageMatchScore(matches),
        acceptanceRate: this.calculateAcceptanceRate(matches),
        averageFare: this.calculateAverageFare(matches),
        averageDistance: this.calculateAverageDistance(matches)
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching match statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time listener for matches (for admin dashboard)
  subscribeToMatches(callback) {
    const q = query(
      collection(db, this.collection),
      where('status', 'in', ['pending', 'matched']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(matches);
    });
  }

  // Find best matches for a ride request
  async findBestMatches(rideRequestId, criteria = {}) {
    try {
      // This would typically involve complex matching algorithms
      // For now, we'll return a simple implementation
      const q = query(
        collection(db, this.collection),
        where('rideRequestId', '==', rideRequestId),
        where('status', '==', 'pending'),
        orderBy('matchScore', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error finding best matches:', error);
      return [];
    }
  }

  // Update match status
  async updateMatchStatus(matchId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData
      };
      await updateDoc(doc(db, this.collection, matchId), updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating match status:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to calculate average match score
  calculateAverageMatchScore(matches) {
    if (matches.length === 0) return 0;
    const totalScore = matches.reduce((sum, match) => sum + (match.matchScore || 0), 0);
    return totalScore / matches.length;
  }

  // Helper method to calculate acceptance rate
  calculateAcceptanceRate(matches) {
    if (matches.length === 0) return 0;
    const acceptedCount = matches.filter(match => match.status === 'accepted').length;
    return (acceptedCount / matches.length) * 100;
  }

  // Helper method to calculate average fare
  calculateAverageFare(matches) {
    if (matches.length === 0) return 0;
    const totalFare = matches.reduce((sum, match) => sum + (match.fare || 0), 0);
    return totalFare / matches.length;
  }

  // Helper method to calculate average distance
  calculateAverageDistance(matches) {
    if (matches.length === 0) return 0;
    const totalDistance = matches.reduce((sum, match) => sum + (match.distance || 0), 0);
    return totalDistance / matches.length;
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

  // Clean up old matches (should be called periodically)
  async cleanupOldMatches(daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const q = query(
        collection(db, this.collection),
        where('createdAt', '<', cutoffDate),
        where('status', 'in', ['rejected', 'cancelled', 'expired'])
      );
      const snapshot = await getDocs(q);
      
      // In a real implementation, you might want to archive these instead of deleting
      console.log(`Found ${snapshot.docs.length} old matches to clean up`);
      return { success: true, count: snapshot.docs.length };
    } catch (error) {
      console.error('Error cleaning up old matches:', error);
      return { success: false, error: error.message };
    }
  }
}

const rideMatchingService = new RideMatchingService();
export default rideMatchingService;
