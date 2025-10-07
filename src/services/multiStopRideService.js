import { 
  collection, 
  doc, 
  addDoc,
  updateDoc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import routeOptimizationService from './routeOptimizationService';

/**
 * MultiStopRideService
 * Handles multi-stop ride creation, pricing, and management
 * Implements the "Hybrid Auto-Adjust with Guardrails" compensation model
 */
class MultiStopRideService {
  constructor() {
    // Pricing defaults from compensation model
    this.pricingDefaults = {
      addStopFee: 3.00,                    // Flat fee per additional stop
      waitGraceMinutes: 5,                 // Free wait time per stop
      waitPerMinute: 0.40,                 // After grace period
      autoAcceptThresholds: {
        driver: { amount: 5.00, percent: 15 },  // Driver auto-accept up to $5 or 15%
        rider: { amount: 5.00, percent: 10 }    // Rider auto-accept up to $5 or 10%
      },
      largeChangeThreshold: 0.30,          // 30% change triggers new bid
      preAuthBuffer: 1.40,                  // 140% of estimate
      preAuthTopUpAt: 1.15,                 // Top-up at 115% of estimate
      minChangeDollar: 2.00,                // Ignore micro-deltas < $2
      minChangeMiles: 0.3,                  // Ignore micro-deltas < 0.3 miles
      minChangeMinutes: 2                   // Ignore micro-deltas < 2 minutes
    };
  }

  /**
   * Create multi-stop ride request
   * @param {Object} rideData - Ride request data
   * @returns {Object} Created ride request with ID
   */
  async createMultiStopRequest(rideData) {
    try {
      const {
        customerId,
        pickup,
        stops = [],
        finalDestination = null,
        rideType = 'standard',
        specialRequests = [],
        scheduledTime = null,
        paymentMethod = 'card',
        driverPreferences = {}
      } = rideData;

      // Validate stops
      if (!stops || stops.length === 0) {
        throw new Error('At least one stop is required for multi-stop rides');
      }

      if (stops.length > 5) {
        throw new Error('Maximum 5 stops allowed per ride');
      }

      // Optimize route
      console.log('🔄 Optimizing multi-stop route...');
      const routeOptimization = await routeOptimizationService.optimizeRoute(
        pickup,
        stops,
        finalDestination,
        {
          departureTime: scheduledTime ? new Date(scheduledTime) : new Date(),
          optimizeOrder: true
        }
      );

      if (!routeOptimization.success) {
        console.warn('⚠️ Route optimization failed, using fallback');
      }

      // Calculate estimated fare using multi-stop pricing
      const pricingBreakdown = await this.calculateMultiStopFare(
        routeOptimization,
        rideType,
        driverPreferences
      );

      // Build multi-stop ride request
      const multiStopRequest = {
        customerId,
        
        // Location data
        pickup: {
          address: pickup.address,
          coordinates: pickup.coordinates,
          placeId: pickup.placeId
        },
        
        // Stops array with optimized order
        stops: routeOptimization.stops,
        
        // Final destination (optional)
        finalDestination: routeOptimization.finalDestination,
        
        // Route optimization data
        routeOptimization: {
          optimizedOrder: routeOptimization.optimizedOrder,
          totalDistance: routeOptimization.totalDistance,
          totalDuration: routeOptimization.totalDuration,
          totalDurationWithWait: routeOptimization.totalDurationWithWait,
          routePolyline: routeOptimization.routePolyline,
          bounds: routeOptimization.bounds,
          warnings: routeOptimization.warnings
        },
        
        // Multi-stop settings
        multiStopSettings: {
          allowReorder: false, // Lock order once optimized
          maxWaitTime: this.pricingDefaults.waitGraceMinutes * 60, // seconds
          graceWaitPerStop: this.pricingDefaults.waitGraceMinutes,
          waitChargePerMinute: this.pricingDefaults.waitPerMinute,
          estimatedTotalDuration: routeOptimization.totalDurationWithWait
        },
        
        // Pricing data
        pricing: {
          mode: 'bid_fixed', // As per compensation model
          baseBid: null, // Will be set when driver bids
          estimatedFare: pricingBreakdown.totalFare,
          breakdown: pricingBreakdown,
          
          // Dynamic adjustments tracking
          adjustments: [],
          
          // Auto-accept thresholds
          caps: {
            driverAutoApprove: this.pricingDefaults.autoAcceptThresholds.driver,
            riderAutoApprove: this.pricingDefaults.autoAcceptThresholds.rider
          },
          
          // Pre-authorization
          preAuth: {
            amount: Math.ceil(pricingBreakdown.totalFare * this.pricingDefaults.preAuthBuffer),
            buffer: this.pricingDefaults.preAuthBuffer,
            topUpThreshold: this.pricingDefaults.preAuthTopUpAt
          }
        },
        
        // Ride metadata
        rideType,
        specialRequests,
        scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : null,
        paymentMethod,
        isMultiStop: true,
        stopCount: stops.length,
        
        // Status tracking
        status: 'pending', // pending -> bidding -> matched -> active -> completed/cancelled
        driverBids: [],
        selectedDriverId: null,
        
        // Progress tracking (for active ride)
        currentStopIndex: 0,
        stopProgress: [],
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        biddingExpiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 min bidding
      };

      // Create ride request in Firestore
      const docRef = await addDoc(collection(db, 'rideRequests'), multiStopRequest);
      
      console.log('✅ Multi-stop ride request created:', docRef.id);
      
      return {
        success: true,
        rideRequestId: docRef.id,
        rideRequest: { ...multiStopRequest, id: docRef.id }
      };

    } catch (error) {
      console.error('❌ Failed to create multi-stop ride request:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate multi-stop fare with pricing breakdown
   * Implements the compensation model from documentation
   */
  async calculateMultiStopFare(routeOptimization, rideType = 'standard', driverPreferences = {}) {
    try {
      // Base rates (can be driver-specific or system defaults)
      const baseRates = {
        perMile: driverPreferences.perMile || 1.50,
        perMinute: driverPreferences.perMinute || 0.30,
        waitPerMinute: driverPreferences.waitPerMinute || this.pricingDefaults.waitPerMinute,
        addStopFee: driverPreferences.addStopFee || this.pricingDefaults.addStopFee,
        baseFare: driverPreferences.baseFare || 5.00
      };

      // Distance-based fare
      const distanceFare = routeOptimization.totalDistance * baseRates.perMile;

      // Time-based fare (driving time only, not wait time)
      const timeFare = routeOptimization.totalDuration * baseRates.perMinute;

      // Additional stop fees (N stops = N * addStopFee)
      const stopCount = routeOptimization.stops.length;
      const stopFees = stopCount * baseRates.addStopFee;

      // Wait time allowance (grace period, included in estimate)
      const waitTimeAllowance = stopCount * this.pricingDefaults.waitGraceMinutes;
      const waitTimeFare = 0; // Grace period is free, metered after

      // Subtotal
      const subtotal = baseRates.baseFare + distanceFare + timeFare + stopFees + waitTimeFare;

      // Service fee / commission (platform commission)
      const serviceFeePercent = 0.15; // 15% platform fee
      const serviceFee = subtotal * serviceFeePercent;

      // Total fare
      const totalFare = Math.round((subtotal + serviceFee) * 100) / 100;

      // Build pricing breakdown
      const breakdown = {
        baseFare: baseRates.baseFare,
        distanceFare: Math.round(distanceFare * 100) / 100,
        timeFare: Math.round(timeFare * 100) / 100,
        stopFees: Math.round(stopFees * 100) / 100,
        waitTimeFare: waitTimeFare,
        subtotal: Math.round(subtotal * 100) / 100,
        serviceFee: Math.round(serviceFee * 100) / 100,
        totalFare: totalFare,
        
        // Additional details
        details: {
          distance: routeOptimization.totalDistance,
          duration: routeOptimization.totalDuration,
          stopCount: stopCount,
          waitTimeAllowance: waitTimeAllowance,
          rates: baseRates
        },
        
        timestamp: new Date().toISOString()
      };

      console.log('💰 Multi-stop fare calculated:', breakdown);
      return breakdown;

    } catch (error) {
      console.error('❌ Failed to calculate multi-stop fare:', error);
      throw error;
    }
  }

  /**
   * Calculate delta fare for added stop (in-ride or pre-ride)
   * Implements the "Auto-Adjust with Guardrails" model
   */
  async calculateStopDelta(rideId, newStop, currentRoute) {
    try {
      console.log('🔄 Calculating delta for new stop...');

      // Re-optimize route with new stop
      const allStops = [...currentRoute.stops, newStop];
      const newRouteOptimization = await routeOptimizationService.optimizeRoute(
        currentRoute.pickup,
        allStops,
        currentRoute.finalDestination
      );

      // Calculate deltas
      const deltaDistance = newRouteOptimization.totalDistance - currentRoute.routeOptimization.totalDistance;
      const deltaDuration = newRouteOptimization.totalDuration - currentRoute.routeOptimization.totalDuration;

      // Check if change is significant enough to charge
      if (
        Math.abs(deltaDistance) < this.pricingDefaults.minChangeMiles &&
        Math.abs(deltaDuration) < this.pricingDefaults.minChangeMinutes
      ) {
        console.log('ℹ️ Change is below minimum threshold, no delta charge');
        return {
          deltaFare: 0,
          isAutoApproved: true,
          reason: 'below_minimum_threshold'
        };
      }

      // Get driver's pricing rates (would fetch from driver profile)
      const driverRates = {
        perMile: 1.50,
        perMinute: 0.30,
        waitPerMinute: this.pricingDefaults.waitPerMinute,
        addStopFee: this.pricingDefaults.addStopFee
      };

      // Calculate delta fare using the formula from compensation model
      const deltaFare = 
        (deltaDistance * driverRates.perMile) +
        (deltaDuration * driverRates.perMinute) +
        (this.pricingDefaults.waitGraceMinutes * driverRates.waitPerMinute) + // Wait time for new stop
        driverRates.addStopFee; // Flat fee for added stop

      const roundedDeltaFare = Math.round(deltaFare * 100) / 100;

      // Check auto-accept thresholds
      const originalFare = currentRoute.pricing.estimatedFare;
      const percentChange = (roundedDeltaFare / originalFare) * 100;

      const driverAutoAccept = 
        roundedDeltaFare <= this.pricingDefaults.autoAcceptThresholds.driver.amount ||
        percentChange <= this.pricingDefaults.autoAcceptThresholds.driver.percent;

      const riderAutoAccept =
        roundedDeltaFare <= this.pricingDefaults.autoAcceptThresholds.rider.amount ||
        percentChange <= this.pricingDefaults.autoAcceptThresholds.rider.percent;

      // Check if it's a "large change" requiring new bid
      const isLargeChange = percentChange > (this.pricingDefaults.largeChangeThreshold * 100);

      return {
        success: true,
        deltaFare: roundedDeltaFare,
        deltaDistance: Math.round(deltaDistance * 100) / 100,
        deltaDuration: Math.round(deltaDuration),
        percentChange: Math.round(percentChange * 100) / 100,
        breakdown: {
          distanceCost: Math.round(deltaDistance * driverRates.perMile * 100) / 100,
          timeCost: Math.round(deltaDuration * driverRates.perMinute * 100) / 100,
          waitCost: Math.round(this.pricingDefaults.waitGraceMinutes * driverRates.waitPerMinute * 100) / 100,
          stopFee: driverRates.addStopFee
        },
        driverAutoAccept,
        riderAutoAccept,
        requiresApproval: !driverAutoAccept || !riderAutoAccept,
        isLargeChange,
        suggestedAction: isLargeChange ? 'request_new_bid' : (driverAutoAccept && riderAutoAccept ? 'auto_apply' : 'request_approval'),
        newRoute: newRouteOptimization
      };

    } catch (error) {
      console.error('❌ Failed to calculate stop delta:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update stop progress (driver marks stop as complete)
   */
  async updateStopProgress(rideId, stopId, status, actualWaitTime = 0) {
    try {
      const rideRef = doc(db, 'rides', rideId);
      const rideDoc = await getDoc(rideRef);

      if (!rideDoc.exists()) {
        throw new Error('Ride not found');
      }

      const rideData = rideDoc.data();
      const stopIndex = rideData.stops.findIndex(s => s.id === stopId);

      if (stopIndex === -1) {
        throw new Error('Stop not found');
      }

      // Calculate wait time charges if exceeded grace period
      let waitCharge = 0;
      const graceMinutes = this.pricingDefaults.waitGraceMinutes;
      const actualWaitMinutes = actualWaitTime / 60;

      if (actualWaitMinutes > graceMinutes) {
        const chargeableMinutes = actualWaitMinutes - graceMinutes;
        waitCharge = chargeableMinutes * this.pricingDefaults.waitPerMinute;
      }

      // Build stop progress entry
      const progressEntry = {
        stopId,
        stopIndex,
        status, // 'arrived', 'completed', 'skipped'
        timestamp: new Date().toISOString(),
        actualArrival: new Date().toISOString(),
        waitTime: actualWaitTime, // seconds
        waitCharge: Math.round(waitCharge * 100) / 100
      };

      // Update ride document
      const stopProgress = [...(rideData.stopProgress || []), progressEntry];
      const currentStopIndex = status === 'completed' 
        ? stopIndex + 1 
        : stopIndex;

      const updates = {
        stopProgress,
        currentStopIndex,
        [`stops.${stopIndex}.completed`]: status === 'completed',
        [`stops.${stopIndex}.actualArrival`]: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };

      // Add wait charge to pricing adjustments if applicable
      if (waitCharge > 0) {
        const adjustment = {
          kind: 'wait',
          stopId,
          calc: {
            dWaitMins: Math.round((actualWaitMinutes - graceMinutes) * 10) / 10,
            graceMinutes,
            actualMinutes: Math.round(actualWaitMinutes * 10) / 10
          },
          suggested: waitCharge,
          driverEdited: null,
          riderApproved: waitCharge <= this.pricingDefaults.autoAcceptThresholds.rider.amount,
          timestamp: new Date().toISOString()
        };

        updates['pricing.adjustments'] = [...(rideData.pricing?.adjustments || []), adjustment];
      }

      await updateDoc(rideRef, updates);

      console.log('✅ Stop progress updated:', progressEntry);

      // Check if all stops are complete
      const allStopsComplete = stopProgress.filter(p => p.status === 'completed').length === rideData.stops.length;

      return {
        success: true,
        progressEntry,
        waitCharge,
        allStopsComplete,
        nextStop: allStopsComplete ? null : rideData.stops[currentStopIndex]
      };

    } catch (error) {
      console.error('❌ Failed to update stop progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get multi-stop ride details
   */
  async getMultiStopRide(rideId) {
    try {
      const rideRef = doc(db, 'rides', rideId);
      const rideDoc = await getDoc(rideRef);

      if (!rideDoc.exists()) {
        return {
          success: false,
          error: 'Ride not found'
        };
      }

      return {
        success: true,
        ride: {
          id: rideDoc.id,
          ...rideDoc.data()
        }
      };

    } catch (error) {
      console.error('❌ Failed to get multi-stop ride:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const multiStopRideService = new MultiStopRideService();
export default multiStopRideService;

