/**
 * Global cleanup service for managing Firebase listeners and subscriptions
 * This service helps prevent permission errors during logout by ensuring
 * all active listeners are properly cleaned up.
 */

class CleanupService {
  constructor() {
    this.activeListeners = new Map();
    this.isCleaningUp = false;
  }

  /**
   * Register a listener for cleanup
   * @param {string} id - Unique identifier for the listener
   * @param {Function} unsubscribe - Function to call to unsubscribe
   */
  registerListener(id, unsubscribe) {
    if (typeof unsubscribe !== 'function') {
      console.warn(`CleanupService: Invalid unsubscribe function for listener ${id}`);
      return;
    }
    
    this.activeListeners.set(id, unsubscribe);
    console.log(`CleanupService: Registered listener ${id}`);
  }

  /**
   * Unregister a specific listener
   * @param {string} id - Unique identifier for the listener
   */
  unregisterListener(id) {
    const unsubscribe = this.activeListeners.get(id);
    if (unsubscribe) {
      try {
        unsubscribe();
        this.activeListeners.delete(id);
        console.log(`CleanupService: Unregistered listener ${id}`);
      } catch (error) {
        console.error(`CleanupService: Error unregistering listener ${id}:`, error);
      }
    }
  }

  /**
   * Clean up all registered listeners
   */
  cleanupAllListeners() {
    if (this.isCleaningUp) {
      console.log('CleanupService: Already cleaning up, skipping...');
      return;
    }

    this.isCleaningUp = true;
    console.log(`CleanupService: Cleaning up ${this.activeListeners.size} listeners...`);

    const errors = [];
    
    this.activeListeners.forEach((unsubscribe, id) => {
      try {
        unsubscribe();
        console.log(`CleanupService: Cleaned up listener ${id}`);
      } catch (error) {
        console.error(`CleanupService: Error cleaning up listener ${id}:`, error);
        errors.push({ id, error: error.message });
      }
    });

    this.activeListeners.clear();
    this.isCleaningUp = false;

    if (errors.length > 0) {
      console.warn(`CleanupService: ${errors.length} listeners had errors during cleanup:`, errors);
    } else {
      console.log('CleanupService: All listeners cleaned up successfully');
    }
  }

  /**
   * Get the number of active listeners
   * @returns {number} Number of active listeners
   */
  getActiveListenerCount() {
    return this.activeListeners.size;
  }

  /**
   * Check if cleanup is in progress
   * @returns {boolean} True if cleanup is in progress
   */
  isCleaningUpInProgress() {
    return this.isCleaningUp;
  }
}

// Create and export a singleton instance
export const cleanupService = new CleanupService();

// Export the class for testing
export default CleanupService;
