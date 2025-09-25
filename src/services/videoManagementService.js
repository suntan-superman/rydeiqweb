import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

class VideoManagementService {
  constructor() {
    this.collection = 'videoRecordings';
    this.storagePath = 'videos';
  }

  // Get video recordings for a specific ride
  async getVideosForRide(rideId) {
    try {
      const q = query(
        collection(db, this.collection),
        where('rideId', '==', rideId),
        orderBy('startTime', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching videos for ride:', error);
      return [];
    }
  }

  // Get all video recordings (for admin dashboard)
  async getAllVideos(limitCount = 100) {
    try {
      const q = query(
        collection(db, this.collection),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching all videos:', error);
      return [];
    }
  }

  // Get recent videos (for admin dashboard)
  async getRecentVideos(limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching recent videos:', error);
      return [];
    }
  }

  // Get videos by driver
  async getVideosByDriver(driverId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collection),
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching videos by driver:', error);
      return [];
    }
  }

  // Get video download URL
  async getVideoUrl(recordingId, storagePath) {
    try {
      const videoRef = ref(storage, storagePath);
      const url = await getDownloadURL(videoRef);
      return { success: true, url };
    } catch (error) {
      console.error('Error getting video URL:', error);
      return { success: false, error: error.message };
    }
  }

  // Get thumbnail URL
  async getThumbnailUrl(recordingId, thumbnailPath) {
    try {
      if (!thumbnailPath) {
        return { success: false, error: 'No thumbnail path provided' };
      }
      const thumbnailRef = ref(storage, thumbnailPath);
      const url = await getDownloadURL(thumbnailRef);
      return { success: true, url };
    } catch (error) {
      console.error('Error getting thumbnail URL:', error);
      return { success: false, error: error.message };
    }
  }

  // Update video status
  async updateVideoStatus(recordingId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData
      };
      await updateDoc(doc(db, this.collection, recordingId), updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating video status:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete video recording
  async deleteVideo(recordingId, storagePath) {
    try {
      // Delete from Firestore
      await updateDoc(doc(db, this.collection, recordingId), {
        status: 'deleted',
        deletedAt: serverTimestamp()
      });

      // Delete from Storage
      if (storagePath) {
        const videoRef = ref(storage, storagePath);
        await deleteObject(videoRef);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting video:', error);
      return { success: false, error: error.message };
    }
  }

  // Get video statistics for admin dashboard
  async getVideoStatistics(timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);
      const q = query(
        collection(db, this.collection),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const stats = {
        totalVideos: videos.length,
        completedVideos: videos.filter(video => video.status === 'completed').length,
        processingVideos: videos.filter(video => video.status === 'processing').length,
        failedVideos: videos.filter(video => video.status === 'failed').length,
        deletedVideos: videos.filter(video => video.status === 'deleted').length,
        totalStorageUsed: this.calculateTotalStorageUsed(videos),
        averageVideoSize: this.calculateAverageVideoSize(videos),
        averageDuration: this.calculateAverageDuration(videos)
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching video statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Search videos by criteria
  async searchVideos(criteria = {}) {
    try {
      let q = query(collection(db, this.collection));

      // Add filters based on criteria
      if (criteria.driverId) {
        q = query(q, where('driverId', '==', criteria.driverId));
      }
      if (criteria.rideId) {
        q = query(q, where('rideId', '==', criteria.rideId));
      }
      if (criteria.status) {
        q = query(q, where('status', '==', criteria.status));
      }
      if (criteria.recordingType) {
        q = query(q, where('recordingType', '==', criteria.recordingType));
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
      console.error('Error searching videos:', error);
      return [];
    }
  }

  // Get storage usage by driver
  async getStorageUsageByDriver(driverId) {
    try {
      const videos = await this.getVideosByDriver(driverId);
      const totalSize = videos.reduce((sum, video) => sum + (video.fileSize || 0), 0);
      const videoCount = videos.length;
      
      return {
        success: true,
        data: {
          driverId,
          totalSize,
          videoCount,
          averageSize: videoCount > 0 ? totalSize / videoCount : 0
        }
      };
    } catch (error) {
      console.error('Error getting storage usage by driver:', error);
      return { success: false, error: error.message };
    }
  }

  // Clean up old videos (should be called periodically)
  async cleanupOldVideos(daysOld = 90) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const q = query(
        collection(db, this.collection),
        where('createdAt', '<', cutoffDate),
        where('status', 'in', ['completed', 'failed'])
      );
      const snapshot = await getDocs(q);
      
      console.log(`Found ${snapshot.docs.length} old videos to clean up`);
      return { success: true, count: snapshot.docs.length };
    } catch (error) {
      console.error('Error cleaning up old videos:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to calculate total storage used
  calculateTotalStorageUsed(videos) {
    return videos.reduce((sum, video) => sum + (video.fileSize || 0), 0);
  }

  // Helper method to calculate average video size
  calculateAverageVideoSize(videos) {
    if (videos.length === 0) return 0;
    const totalSize = this.calculateTotalStorageUsed(videos);
    return totalSize / videos.length;
  }

  // Helper method to calculate average duration
  calculateAverageDuration(videos) {
    if (videos.length === 0) return 0;
    const totalDuration = videos.reduce((sum, video) => sum + (video.duration || 0), 0);
    return totalDuration / videos.length;
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

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format duration for display
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}

const videoManagementService = new VideoManagementService();
export default videoManagementService;
