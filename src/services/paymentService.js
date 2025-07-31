import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';

// Payment configuration
const PAYMENT_CONFIG = {
  defaultCurrency: 'usd',
  commissionRates: {
    standard: 0.15, // 15% platform commission
    premium: 0.12,  // 12% for premium drivers
    business: 0.10  // 10% for business accounts
  },
  minimumPayout: 25.00,
  processingFee: 0.30,
  processingPercentage: 0.029
};

// Create payment intent for ride
export const createPaymentIntent = async (rideData) => {
  try {
    const {
      amount,
      currency = PAYMENT_CONFIG.defaultCurrency,
      customerId,
      rideId,
      paymentMethod = 'card',
      metadata = {}
    } = rideData;

    // Validate amount
    if (amount < 1) {
      throw new Error('Payment amount must be at least $1.00');
    }

    // Create payment intent data
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        rideId,
        paymentMethod,
        platform: 'AnyRyde',
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
      capture_method: 'automatic',
      description: `AnyRyde ride - ${rideId}`,
      receipt_email: metadata.customerEmail,
      application_fee_amount: Math.round(amount * PAYMENT_CONFIG.commissionRates.standard * 100)
    };

    // In production, this would call your backend API
    // For now, we'll simulate the payment intent creation
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: paymentIntentData.amount,
      currency: paymentIntentData.currency,
      status: 'requires_payment_method',
      ...paymentIntentData
    };

    // Store payment intent in Firestore
    await addDoc(collection(db, 'paymentIntents'), {
      ...paymentIntent,
      rideId,
      customerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      data: paymentIntent
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: {
        code: error.code || 'PAYMENT_INTENT_ERROR',
        message: error.message
      }
    };
  }
};

// Process payment for a ride
export const processPayment = async (rideRequestId, paymentData) => {
  try {
    const {
      paymentIntentId,
      amount,
      currency = PAYMENT_CONFIG.defaultCurrency,
      paymentMethod,
      customerId,
      driverId,
      metadata = {}
    } = paymentData;

    // Calculate commission
    const commissionRate = PAYMENT_CONFIG.commissionRates.standard;
    const commissionAmount = amount * commissionRate;
    const driverAmount = amount - commissionAmount;

    // Create payment record
    const paymentRecord = {
      paymentIntentId,
      rideRequestId,
      customerId,
      driverId,
      amount,
      currency,
      commissionAmount,
      driverAmount,
      commissionRate,
      paymentMethod,
      status: 'processing',
      metadata,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Store payment in Firestore
    const paymentRef = await addDoc(collection(db, 'payments'), paymentRecord);

    // Update ride request with payment information
    const rideRef = doc(db, 'rideRequests', rideRequestId);
    await updateDoc(rideRef, {
      payment: {
        id: paymentRef.id,
        status: 'processing',
        amount,
        commissionAmount,
        driverAmount
      },
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Simulate payment processing (in production, this would integrate with Stripe)
    setTimeout(async () => {
      // Update payment status to succeeded
      await updateDoc(paymentRef, {
        status: 'succeeded',
        processedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update ride request
      await updateDoc(rideRef, {
        'payment.status': 'succeeded',
        'payment.processedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create driver payout record
      await createDriverPayout(driverId, driverAmount, rideRequestId);
    }, 2000);

    return {
      success: true,
      data: {
        paymentId: paymentRef.id,
        amount,
        commissionAmount,
        driverAmount,
        status: 'processing'
      }
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: {
        code: error.code || 'PAYMENT_PROCESSING_ERROR',
        message: error.message
      }
    };
  }
};

// ===== DRIVER PAYOUT SYSTEM =====

// Create driver payout record
export const createDriverPayout = async (driverId, amount, rideId) => {
  try {
    const payoutRecord = {
      driverId,
      amount,
      rideId,
      status: 'pending',
      payoutMethod: 'automatic', // or 'manual'
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const payoutRef = await addDoc(collection(db, 'driverPayouts'), payoutRecord);

    return {
      success: true,
      data: {
        payoutId: payoutRef.id,
        ...payoutRecord
      }
    };
  } catch (error) {
    console.error('Error creating driver payout:', error);
    return {
      success: false,
      error: {
        code: error.code || 'PAYOUT_CREATION_ERROR',
        message: error.message
      }
    };
  }
};

// Process driver payout
export const processDriverPayout = async (payoutId, payoutMethod = 'weekly') => {
  try {
    const payoutRef = doc(db, 'driverPayouts', payoutId);
    const payoutDoc = await getDoc(payoutRef);

    if (!payoutDoc.exists()) {
      throw new Error('Payout not found');
    }

    const payoutData = payoutDoc.data();
    const payoutConfig = PAYMENT_CONFIG.payoutOptions[payoutMethod];

    // Check minimum amount
    if (payoutData.amount < payoutConfig.minimumAmount) {
      throw new Error(`Minimum payout amount is $${payoutConfig.minimumAmount}`);
    }

    // Calculate fees
    const feeAmount = payoutConfig.fee;
    const netAmount = payoutData.amount - feeAmount;

    // Update payout record
    await updateDoc(payoutRef, {
      status: 'processing',
      payoutMethod,
      feeAmount,
      netAmount,
      processingTime: payoutConfig.processingTime,
      updatedAt: serverTimestamp()
    });

    // In production, this would integrate with Stripe Connect for driver payouts
    // For now, we'll simulate the payout processing
    setTimeout(async () => {
      await updateDoc(payoutRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }, 5000);

    return {
      success: true,
      data: {
        payoutId,
        amount: payoutData.amount,
        feeAmount,
        netAmount,
        status: 'processing',
        processingTime: payoutConfig.processingTime
      }
    };
  } catch (error) {
    console.error('Error processing driver payout:', error);
    return {
      success: false,
      error: {
        code: error.code || 'PAYOUT_PROCESSING_ERROR',
        message: error.message
      }
    };
  }
};

// Get driver earnings summary
export const getDriverEarnings = async (driverId, period = 'week') => {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get completed rides for driver
    const ridesQuery = query(
      collection(db, 'rideRequests'),
      where('selectedDriverId', '==', driverId),
      where('status', '==', 'completed'),
      where('paidAt', '>=', startDate),
      orderBy('paidAt', 'desc')
    );

    const ridesSnapshot = await getDocs(ridesQuery);
    let totalEarnings = 0;
    let totalRides = 0;
    let totalCommission = 0;

    ridesSnapshot.forEach((doc) => {
      const ride = doc.data();
      if (ride.payment && ride.payment.driverAmount) {
        totalEarnings += ride.payment.driverAmount;
        totalCommission += ride.payment.commissionAmount;
        totalRides++;
      }
    });

    // Get pending payouts
    const payoutsQuery = query(
      collection(db, 'driverPayouts'),
      where('driverId', '==', driverId),
      where('status', 'in', ['pending', 'processing'])
    );

    const payoutsSnapshot = await getDocs(payoutsQuery);
    let pendingPayouts = 0;

    payoutsSnapshot.forEach((doc) => {
      const payout = doc.data();
      pendingPayouts += payout.amount;
    });

    return {
      success: true,
      data: {
        period,
        totalEarnings,
        totalRides,
        totalCommission,
        pendingPayouts,
        averagePerRide: totalRides > 0 ? totalEarnings / totalRides : 0,
        commissionRate: PAYMENT_CONFIG.commissionRates.standard
      }
    };
  } catch (error) {
    console.error('Error getting driver earnings:', error);
    return {
      success: false,
      error: {
        code: error.code || 'EARNINGS_FETCH_ERROR',
        message: error.message
      }
    };
  }
};

// ===== PAYMENT DISPUTE HANDLING =====

// Create payment dispute
export const createPaymentDispute = async (paymentId, disputeData) => {
  try {
    const {
      reason,
      description,
      evidence = [],
      customerId,
      driverId
    } = disputeData;

    const disputeRecord = {
      paymentId,
      customerId,
      driverId,
      reason,
      description,
      evidence,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const disputeRef = await addDoc(collection(db, 'paymentDisputes'), disputeRecord);

    return {
      success: true,
      data: {
        disputeId: disputeRef.id,
        ...disputeRecord
      }
    };
  } catch (error) {
    console.error('Error creating payment dispute:', error);
    return {
      success: false,
      error: {
        code: error.code || 'DISPUTE_CREATION_ERROR',
        message: error.message
      }
    };
  }
};

// Resolve payment dispute
export const resolvePaymentDispute = async (disputeId, resolution) => {
  try {
    const {
      outcome,
      refundAmount = 0,
      notes,
      resolvedBy
    } = resolution;

    const disputeRef = doc(db, 'paymentDisputes', disputeId);
    await updateDoc(disputeRef, {
      status: 'resolved',
      outcome,
      refundAmount,
      notes,
      resolvedBy,
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      data: {
        disputeId,
        outcome,
        refundAmount,
        status: 'resolved'
      }
    };
  } catch (error) {
    console.error('Error resolving payment dispute:', error);
    return {
      success: false,
      error: {
        code: error.code || 'DISPUTE_RESOLUTION_ERROR',
        message: error.message
      }
    };
  }
};

// ===== TAX REPORTING =====

// Generate tax report for driver
export const generateTaxReport = async (driverId, year) => {
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Get all completed rides for the year
    const ridesQuery = query(
      collection(db, 'rideRequests'),
      where('selectedDriverId', '==', driverId),
      where('status', '==', 'completed'),
      where('paidAt', '>=', startDate),
      where('paidAt', '<=', endDate)
    );

    const ridesSnapshot = await getDocs(ridesQuery);
    let totalEarnings = 0;
    let totalRides = 0;
    let totalCommission = 0;
    const monthlyBreakdown = {};

    ridesSnapshot.forEach((doc) => {
      const ride = doc.data();
      if (ride.payment && ride.payment.driverAmount) {
        totalEarnings += ride.payment.driverAmount;
        totalCommission += ride.payment.commissionAmount;
        totalRides++;

        // Monthly breakdown
        const month = new Date(ride.paidAt.toDate()).getMonth();
        if (!monthlyBreakdown[month]) {
          monthlyBreakdown[month] = {
            earnings: 0,
            rides: 0,
            commission: 0
          };
        }
        monthlyBreakdown[month].earnings += ride.payment.driverAmount;
        monthlyBreakdown[month].rides += 1;
        monthlyBreakdown[month].commission += ride.payment.commissionAmount;
      }
    });

    const taxReport = {
      driverId,
      year,
      totalEarnings,
      totalRides,
      totalCommission,
      monthlyBreakdown,
      generatedAt: serverTimestamp()
    };

    // Store tax report
    const reportRef = await addDoc(collection(db, 'taxReports'), taxReport);

    return {
      success: true,
      data: {
        reportId: reportRef.id,
        ...taxReport
      }
    };
  } catch (error) {
    console.error('Error generating tax report:', error);
    return {
      success: false,
      error: {
        code: error.code || 'TAX_REPORT_ERROR',
        message: error.message
      }
    };
  }
};

// ===== PAYMENT ANALYTICS =====

// Get payment analytics for admin dashboard
export const getPaymentAnalytics = async (period = 'month') => {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all payments in period
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('createdAt', '>=', startDate),
      where('status', '==', 'succeeded')
    );

    const paymentsSnapshot = await getDocs(paymentsQuery);
    let totalRevenue = 0;
    let totalCommission = 0;
    let totalRides = 0;
    let averageRideValue = 0;

    paymentsSnapshot.forEach((doc) => {
      const payment = doc.data();
      totalRevenue += payment.amount;
      totalCommission += payment.commissionAmount;
      totalRides++;
    });

    averageRideValue = totalRides > 0 ? totalRevenue / totalRides : 0;

    return {
      success: true,
      data: {
        period,
        totalRevenue,
        totalCommission,
        totalRides,
        averageRideValue,
        commissionRate: PAYMENT_CONFIG.commissionRates.standard,
        platformRevenue: totalCommission,
        driverPayouts: totalRevenue - totalCommission
      }
    };
  } catch (error) {
    console.error('Error getting payment analytics:', error);
    return {
      success: false,
      error: {
        code: error.code || 'ANALYTICS_ERROR',
        message: error.message
      }
    };
  }
};

// ===== SUBSCRIPTION MANAGEMENT =====

// Create driver subscription
export const createDriverSubscription = async (driverId, planType = 'premium') => {
  try {
    const subscriptionData = {
      driverId,
      planType,
      status: 'active',
      commissionRate: PAYMENT_CONFIG.commissionRates[planType] || PAYMENT_CONFIG.commissionRates.standard,
      monthlyFee: planType === 'premium' ? 25 : 0,
      startDate: serverTimestamp(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const subscriptionRef = await addDoc(collection(db, 'driverSubscriptions'), subscriptionData);

    return {
      success: true,
      data: {
        subscriptionId: subscriptionRef.id,
        ...subscriptionData
      }
    };
  } catch (error) {
    console.error('Error creating driver subscription:', error);
    return {
      success: false,
      error: {
        code: error.code || 'SUBSCRIPTION_CREATION_ERROR',
        message: error.message
      }
    };
  }
};

// Process subscription billing
export const processSubscriptionBilling = async (subscriptionId) => {
  try {
    const subscriptionRef = doc(db, 'driverSubscriptions', subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      throw new Error('Subscription not found');
    }

    const subscription = subscriptionDoc.data();

    // Create billing record
    const billingRecord = {
      subscriptionId,
      driverId: subscription.driverId,
      amount: subscription.monthlyFee,
      status: 'pending',
      billingDate: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    const billingRef = await addDoc(collection(db, 'subscriptionBillings'), billingRecord);

    // Process payment (in production, this would charge the driver's card)
    setTimeout(async () => {
      await updateDoc(billingRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // Update subscription next billing date
      await updateDoc(subscriptionRef, {
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: serverTimestamp()
      });
    }, 2000);

    return {
      success: true,
      data: {
        billingId: billingRef.id,
        amount: subscription.monthlyFee,
        status: 'pending'
      }
    };
  } catch (error) {
    console.error('Error processing subscription billing:', error);
    return {
      success: false,
      error: {
        code: error.code || 'BILLING_ERROR',
        message: error.message
      }
    };
  }
};

const paymentService = {
  PAYMENT_CONFIG,
  createPaymentIntent,
  processPayment,
  createDriverPayout,
  processDriverPayout,
  getDriverEarnings,
  createPaymentDispute,
  resolvePaymentDispute,
  generateTaxReport,
  getPaymentAnalytics,
  createDriverSubscription,
  processSubscriptionBilling
};

export default paymentService; 