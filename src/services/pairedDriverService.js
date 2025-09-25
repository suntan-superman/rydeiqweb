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
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

class PairedDriverService {
  constructor() {
    this.collection = 'pairedDrivers';
  }

  // Create a driver pair
  async createPair(primaryDriverId, secondaryDriverId, rideId, pairingReason) {
    try {
      const pair = {
        primaryDriverId,
        secondaryDriverId,
        rideId,
        status: 'active',
        pairingReason,
        startTime: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, this.collection), pair);
      return { success: true, pairId: docRef.id };
    } catch (error) {
      console.error('Error creating driver pair:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active pairs for a driver
  async getActivePairsForDriver(driverId) {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', '==', 'active'),
        where('primaryDriverId', '==', driverId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching active pairs for driver:', error);
      return [];
    }
  }

  // Get pairs where driver is secondary
  async getSecondaryPairsForDriver(driverId) {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', '==', 'active'),
        where('secondaryDriverId', '==', driverId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching secondary pairs for driver:', error);
      return [];
    }
  }

  // Get all pairs for a driver (primary or secondary)
  async getAllPairsForDriver(driverId) {
    try {
      const primaryQuery = query(
        collection(db, this.collection),
        where('primaryDriverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );
      const secondaryQuery = query(
        collection(db, this.collection),
        where('secondaryDriverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );

      const [primarySnapshot, secondarySnapshot] = await Promise.all([
        getDocs(primaryQuery),
        getDocs(secondaryQuery)
      ]);

      const primaryPairs = primarySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        role: 'primary' 
      }));
      const secondaryPairs = secondarySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        role: 'secondary' 
      }));

      return [...primaryPairs, ...secondaryPairs].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error('Error fetching all pairs for driver:', error);
      return [];
    }
  }

  // Get all active pairs (for admin dashboard)
  async getAllActivePairs() {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching all active pairs:', error);
      return [];
    }
  }

  // Join as secondary driver
  async joinAsSecondaryDriver(pairId, driverId) {
    try {
      await updateDoc(doc(db, this.collection, pairId), {
        secondaryDriverId: driverId,
        joinedAt: serverTimestamp(),
        status: 'active'
      });
      return { success: true };
    } catch (error) {
      console.error('Error joining as secondary driver:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete pair coordination
  async completePair(pairId, completionData = {}) {
    try {
      await updateDoc(doc(db, this.collection, pairId), {
        status: 'completed',
        endTime: serverTimestamp(),
        completedAt: serverTimestamp(),
        ...completionData
      });
      return { success: true };
    } catch (error) {
      console.error('Error completing pair:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel pair coordination
  async cancelPair(pairId, reason = '') {
    try {
      await updateDoc(doc(db, this.collection, pairId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancellationReason: reason
      });
      return { success: true };
    } catch (error) {
      console.error('Error cancelling pair:', error);
      return { success: false, error: error.message };
    }
  }

  // Update pair status
  async updatePairStatus(pairId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData
      };
      await updateDoc(doc(db, this.collection, pairId), updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating pair status:', error);
      return { success: false, error: error.message };
    }
  }

  // Get pair statistics
  async getPairStatistics(timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);
      const q = query(
        collection(db, this.collection),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const pairs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const stats = {
        totalPairs: pairs.length,
        activePairs: pairs.filter(pair => pair.status === 'active').length,
        completedPairs: pairs.filter(pair => pair.status === 'completed').length,
        cancelledPairs: pairs.filter(pair => pair.status === 'cancelled').length,
        averagePairDuration: this.calculateAveragePairDuration(pairs),
        mostCommonReason: this.getMostCommonPairingReason(pairs),
        completionRate: this.calculateCompletionRate(pairs)
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching pair statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time listener for pairs (for admin dashboard)
  subscribeToPairs(callback) {
    const q = query(
      collection(db, this.collection),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const pairs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(pairs);
    });
  }

  // Search pairs by criteria
  async searchPairs(criteria = {}) {
    try {
      let q = query(collection(db, this.collection));

      // Add filters based on criteria
      if (criteria.primaryDriverId) {
        q = query(q, where('primaryDriverId', '==', criteria.primaryDriverId));
      }
      if (criteria.secondaryDriverId) {
        q = query(q, where('secondaryDriverId', '==', criteria.secondaryDriverId));
      }
      if (criteria.status) {
        q = query(q, where('status', '==', criteria.status));
      }
      if (criteria.rideId) {
        q = query(q, where('rideId', '==', criteria.rideId));
      }
      if (criteria.pairingReason) {
        q = query(q, where('pairingReason', '==', criteria.pairingReason));
      }
      if (criteria.startDate) {
        q = query(q, where('createdAt', '>=', criteria.startDate));
      }
      if (criteria.endDate) {
        q = query(q, where('createdAt', '<=', criteria.endDate));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      if (criteria.limit) {
        q = query(q, limit(criteria.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error searching pairs:', error);
      return [];
    }
  }

  // Get available drivers for pairing
  async getAvailableDriversForPairing(excludeDriverId = null) {
    try {
      // This would typically query the drivers collection
      // For now, return a mock implementation
      // In production, this would check driver availability, location, etc.
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        data: [
          { id: 'driver1', name: 'John Doe', rating: 4.8, location: 'Downtown' },
          { id: 'driver2', name: 'Jane Smith', rating: 4.9, location: 'Uptown' },
          { id: 'driver3', name: 'Mike Johnson', rating: 4.7, location: 'Midtown' }
        ]
      };
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to calculate average pair duration
  calculateAveragePairDuration(pairs) {
    const completedPairs = pairs.filter(pair => 
      pair.status === 'completed' && pair.startTime && pair.endTime
    );
    
    if (completedPairs.length === 0) return 0;
    
    const totalDuration = completedPairs.reduce((sum, pair) => {
      const start = pair.startTime.toDate ? pair.startTime.toDate() : new Date(pair.startTime);
      const end = pair.endTime.toDate ? pair.endTime.toDate() : new Date(pair.endTime);
      return sum + (end - start);
    }, 0);
    
    return totalDuration / completedPairs.length / (1000 * 60); // Convert to minutes
  }

  // Helper method to get most common pairing reason
  getMostCommonPairingReason(pairs) {
    const reasons = {};
    pairs.forEach(pair => {
      const reason = pair.pairingReason || 'Unknown';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });
    
    return Object.keys(reasons).reduce((a, b) => reasons[a] > reasons[b] ? a : b, 'Unknown');
  }

  // Helper method to calculate completion rate
  calculateCompletionRate(pairs) {
    if (pairs.length === 0) return 0;
    const completedCount = pairs.filter(pair => pair.status === 'completed').length;
    return (completedCount / pairs.length) * 100;
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

  // Format pair data for display
  formatPairForDisplay(pair) {
    return {
      ...pair,
      formattedStartTime: pair.startTime ? 
        new Date(pair.startTime).toLocaleString() : 'N/A',
      formattedEndTime: pair.endTime ? 
        new Date(pair.endTime).toLocaleString() : 'N/A',
      duration: pair.startTime && pair.endTime ? 
        this.calculateDuration(pair.startTime, pair.endTime) : null
    };
  }

  // Calculate duration between two timestamps
  calculateDuration(startTime, endTime) {
    const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
    const end = endTime.toDate ? endTime.toDate() : new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours}h ${minutes}m`;
  }
}

const pairedDriverService = new PairedDriverService();
export default pairedDriverService;
