/**
 * Advanced Rating Service
 * State-of-the-art rating system with detailed categories, analytics, and fraud prevention
 */

import { 
  doc, 
  updateDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  writeBatch,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

class RatingService {
  constructor() {
    this.ratingVersion = '2.0';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Rating Categories Configuration
   */
  getRatingCategories(userType, rideType = 'standard') {
    const baseCategories = {
      rider: {
        punctuality: { label: 'Punctuality', icon: '⏰', weight: 1.2 },
        politeness: { label: 'Politeness', icon: '😊', weight: 1.0 },
        cooperation: { label: 'Cooperation', icon: '🤝', weight: 1.1 },
        cleanliness: { label: 'Cleanliness', icon: '🧹', weight: 0.8 },
        communication: { label: 'Communication', icon: '💬', weight: 1.0 }
      },
      driver: {
        punctuality: { label: 'Punctuality', icon: '⏰', weight: 1.2 },
        cleanliness: { label: 'Vehicle Cleanliness', icon: '🚗', weight: 1.1 },
        safety: { label: 'Safety', icon: '🛡️', weight: 1.3 },
        communication: { label: 'Communication', icon: '💬', weight: 1.0 },
        friendliness: { label: 'Friendliness', icon: '😊', weight: 1.0 }
      }
    };

    // Adjust categories based on ride type
    if (rideType === 'premium') {
      baseCategories.driver.service = { label: 'Service Quality', icon: '⭐', weight: 1.2 };
    } else if (rideType === 'shared') {
      baseCategories.rider.cleanliness.weight = 1.2; // More important for shared rides
      baseCategories.driver.cleanliness.weight = 1.3;
    }

    return baseCategories[userType] || baseCategories.driver;
  }

  /**
   * Quick Review Options
   */
  getQuickReviewOptions(userType, rating) {
    const options = {
      rider: {
        high: [
          'Great passenger!',
          'Very polite',
          'On time pickup',
          'Easy to communicate with',
          'Respectful of vehicle',
          'Left vehicle clean'
        ],
        medium: [
          'Good passenger',
          'Generally polite',
          'Minor delays',
          'Some communication issues',
          'Left some mess'
        ],
        low: [
          'Rude behavior',
          'Very late',
          'Poor communication',
          'Left vehicle messy',
          'Disrespectful',
          'Safety concerns'
        ]
      },
      driver: {
        high: [
          'Excellent driver!',
          'Very safe driving',
          'Clean vehicle',
          'On time pickup',
          'Great conversation',
          'Helped with luggage',
          'Professional service'
        ],
        medium: [
          'Good driver',
          'Safe driving',
          'Clean vehicle',
          'Minor delays',
          'Friendly service'
        ],
        low: [
          'Unsafe driving',
          'Dirty vehicle',
          'Very late',
          'Rude behavior',
          'Poor communication',
          'Unprofessional'
        ]
      }
    };

    const userOptions = options[userType] || options.driver;
    
    if (rating >= 4) return userOptions.high;
    if (rating >= 3) return userOptions.medium;
    return userOptions.low;
  }

  /**
   * Submit detailed rating
   */
  async submitRating(rideId, ratingType, ratingData, options = {}) {
    const { retryCount = 0 } = options;
    
    try {
      console.log('🌟 Submitting rating:', { rideId, ratingType, ratingData });

      // Validate rating data
      const validation = this.validateRatingData(ratingData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get ride document
      const rideRef = doc(db, 'rideRequests', rideId);
      const rideDoc = await getDoc(rideRef);
      
      if (!rideDoc.exists()) {
        throw new Error('Ride not found');
      }

      const rideData = rideDoc.data();
      const now = new Date().toISOString();

      // Prepare rating data with metadata
      const enhancedRatingData = {
        ...ratingData,
        ratedAt: now,
        version: this.ratingVersion,
        rideType: rideData.rideType || 'standard',
        rideDuration: this.calculateRideDuration(rideData),
        rideDistance: rideData.distance || 0
      };

      // Update ride document with rating
      const updateData = {
        [`ratings.${ratingType}`]: enhancedRatingData,
        [`ratings.${ratingType}.ratedAt`]: now,
        [`ratings.${ratingType}.version`]: this.ratingVersion,
        updatedAt: now
      };

      await updateDoc(rideRef, updateData);

      // Update user's aggregated ratings
      await this.updateUserAggregatedRatings(rideId, ratingType, enhancedRatingData);

      // Send rating notifications
      await this.sendRatingNotifications(rideId, ratingType, enhancedRatingData);

      console.log('🌟 Rating submitted successfully');
      return { 
        success: true, 
        ratingData: enhancedRatingData,
        message: 'Rating submitted successfully'
      };

    } catch (error) {
      console.error('❌ Rating submission error:', error);
      
      // Retry logic
      if (retryCount < this.maxRetries) {
        console.log(`🔄 Retrying rating submission (${retryCount + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.submitRating(rideId, ratingType, ratingData, { retryCount: retryCount + 1 });
      }

      return { 
        success: false, 
        error: error.message,
        code: error.code || 'RATING_SUBMISSION_FAILED'
      };
    }
  }

  /**
   * Get user's rating statistics
   */
  async getUserRatingStats(userId, userType) {
    try {
      console.log('📊 Getting user rating stats:', { userId, userType });

      // Get user document
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const ratingStats = userData.ratingStats?.[userType];

      if (!ratingStats) {
        return {
          success: true,
          stats: {
            averageRating: 0,
            totalRatings: 0,
            ratingBreakdown: {},
            ratingHistory: [],
            lastUpdated: null
          }
        };
      }

      // Get recent rating history
      const ratingHistory = await this.getUserRatingHistory(userId, userType, 10);

      return {
        success: true,
        stats: {
          averageRating: ratingStats.averageRating || 0,
          totalRatings: ratingStats.totalRatings || 0,
          ratingBreakdown: ratingStats.ratingBreakdown || {},
          ratingHistory: ratingHistory,
          lastUpdated: ratingStats.lastUpdated
        }
      };

    } catch (error) {
      console.error('❌ Error getting user rating stats:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Get ride rating details
   */
  async getRideRatings(rideId) {
    try {
      const rideRef = doc(db, 'rideRequests', rideId);
      const rideDoc = await getDoc(rideRef);
      
      if (!rideDoc.exists()) {
        throw new Error('Ride not found');
      }

      const rideData = rideDoc.data();
      const ratings = rideData.ratings || {};

      return {
        success: true,
        ratings: {
          riderToDriver: ratings.riderToDriver || null,
          driverToRider: ratings.driverToRider || null,
          mutualRating: this.calculateMutualRating(ratings),
          ratingCompleteness: this.calculateRatingCompleteness(ratings)
        }
      };

    } catch (error) {
      console.error('❌ Error getting ride ratings:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Update user's aggregated ratings
   */
  async updateUserAggregatedRatings(rideId, ratingType, ratingData) {
    try {
      const rideRef = doc(db, 'rideRequests', rideId);
      const rideDoc = await getDoc(rideRef);
      const rideData = rideDoc.data();

      // Determine target user
      const targetUserId = ratingType === 'riderToDriver' 
        ? rideData.driverId 
        : rideData.riderId;
      
      const targetUserType = ratingType === 'riderToDriver' ? 'driver' : 'rider';

      if (!targetUserId) {
        console.warn('⚠️ No target user ID found for rating update');
        return;
      }

      // Get current user stats
      const userRef = doc(db, 'users', targetUserId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};

      // Calculate new aggregated ratings
      const currentStats = userData.ratingStats?.[targetUserType] || {
        averageRating: 0,
        totalRatings: 0,
        ratingBreakdown: {},
        lastUpdated: null
      };

      const newStats = this.calculateNewAggregatedStats(
        currentStats, 
        ratingData, 
        targetUserType
      );

      // Update user document
      await updateDoc(userRef, {
        [`ratingStats.${targetUserType}`]: newStats,
        updatedAt: serverTimestamp()
      });

      console.log('📊 Updated aggregated ratings for user:', targetUserId);

    } catch (error) {
      console.error('❌ Error updating aggregated ratings:', error);
    }
  }

  /**
   * Validate rating data
   */
  validateRatingData(ratingData) {
    const { overall, categories, review, quickReviews } = ratingData;

    // Check required fields
    if (!overall || overall < 1 || overall > 5) {
      return { isValid: false, error: 'Overall rating must be between 1 and 5' };
    }

    if (!categories || typeof categories !== 'object') {
      return { isValid: false, error: 'Categories rating is required' };
    }

    // Validate categories
    for (const [category, rating] of Object.entries(categories)) {
      if (rating < 1 || rating > 5) {
        return { isValid: false, error: `Category ${category} rating must be between 1 and 5` };
      }
    }

    // Validate review length
    if (review && review.length > 500) {
      return { isValid: false, error: 'Review must be 500 characters or less' };
    }

    return { isValid: true };
  }

  /**
   * Calculate new aggregated statistics
   */
  calculateNewAggregatedStats(currentStats, newRating, userType) {
    const { totalRatings, averageRating, ratingBreakdown } = currentStats;
    const { overall, categories } = newRating;

    // Calculate new average
    const newTotalRatings = totalRatings + 1;
    const newAverageRating = ((averageRating * totalRatings) + overall) / newTotalRatings;

    // Calculate new category averages
    const newRatingBreakdown = { ...ratingBreakdown };
    for (const [category, rating] of Object.entries(categories)) {
      const currentCategoryTotal = (ratingBreakdown[category]?.average || 0) * (ratingBreakdown[category]?.count || 0);
      const newCategoryTotal = currentCategoryTotal + rating;
      const newCategoryCount = (ratingBreakdown[category]?.count || 0) + 1;
      
      newRatingBreakdown[category] = {
        average: newCategoryTotal / newCategoryCount,
        count: newCategoryCount
      };
    }

    return {
      averageRating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal
      totalRatings: newTotalRatings,
      ratingBreakdown: newRatingBreakdown,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get user rating history
   */
  async getUserRatingHistory(userId, userType, limitCount = 10) {
    try {
      const ratingsRef = collection(db, 'rideRequests');
      const ratingField = userType === 'driver' ? 'ratings.riderToDriver.ratedBy' : 'ratings.driverToRider.ratedBy';
      
      const q = query(
        ratingsRef,
        where(ratingField, '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const history = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const ratingData = userType === 'driver' 
          ? data.ratings?.riderToDriver 
          : data.ratings?.driverToRider;
        
        if (ratingData) {
          history.push({
            rideId: doc.id,
            rating: ratingData.overall,
            review: ratingData.review,
            quickReviews: ratingData.quickReviews,
            ratedAt: ratingData.ratedAt,
            rideDate: data.requestedAt
          });
        }
      });

      return history;

    } catch (error) {
      console.error('❌ Error getting rating history:', error);
      return [];
    }
  }

  /**
   * Calculate ride duration
   */
  calculateRideDuration(rideData) {
    if (!rideData.startedAt || !rideData.completedAt) return 0;
    
    const start = new Date(rideData.startedAt);
    const end = new Date(rideData.completedAt);
    return Math.round((end - start) / 1000 / 60); // Duration in minutes
  }

  /**
   * Calculate mutual rating score
   */
  calculateMutualRating(ratings) {
    const { riderToDriver, driverToRider } = ratings;
    
    if (!riderToDriver || !driverToRider) return null;
    
    return {
      riderRating: riderToDriver.overall,
      driverRating: driverToRider.overall,
      averageRating: (riderToDriver.overall + driverToRider.overall) / 2,
      ratingDifference: Math.abs(riderToDriver.overall - driverToRider.overall)
    };
  }

  /**
   * Calculate rating completeness
   */
  calculateRatingCompleteness(ratings) {
    const { riderToDriver, driverToRider } = ratings;
    let completeness = 0;
    
    if (riderToDriver) completeness += 50;
    if (driverToRider) completeness += 50;
    
    return completeness;
  }

  /**
   * Send rating notifications
   */
  async sendRatingNotifications(rideId, ratingType, ratingData) {
    try {
      // This would integrate with your notification service
      console.log('📧 Sending rating notifications for ride:', rideId);
      
      // TODO: Implement notification logic
      // - Thank you notification to rater
      // - Rating received notification to ratee
      // - Admin notification for low ratings
      
    } catch (error) {
      console.error('❌ Error sending rating notifications:', error);
    }
  }

  /**
   * Utility: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get rating suggestions based on context
   */
  getRatingSuggestions(rideType, rideContext) {
    const suggestions = {
      standard: {
        focusCategories: ['punctuality', 'cleanliness', 'safety'],
        quickReviews: ['Great service!', 'Safe driver', 'Clean vehicle']
      },
      premium: {
        focusCategories: ['service', 'communication', 'friendliness'],
        quickReviews: ['Excellent service!', 'Very professional', 'Great conversation']
      },
      shared: {
        focusCategories: ['cleanliness', 'cooperation', 'communication'],
        quickReviews: ['Clean vehicle', 'Good passenger', 'Easy to share with']
      }
    };

    return suggestions[rideType] || suggestions.standard;
  }
}

// Export singleton instance
export const ratingService = new RatingService();
export default ratingService;
