/**
 * Stripe Payment Service
 * Handles all Stripe payment processing, customer management, and payouts
 */

const admin = require('firebase-admin');

// Lazy initialize Stripe to avoid deployment timeouts
let stripe = null;
const getStripeClient = () => {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripe = require('stripe')(apiKey);
  }
  return stripe;
};

// AnyRyde platform commission rates
const COMMISSION_RATES = {
  standard: 0.15,     // 15% for standard drivers
  premium: 0.12,      // 12% for premium drivers
  medical: 0.10,      // 10% for medical transport drivers
  business: 0.08      // 8% for business/fleet accounts
};

// Minimum payout amount
const MINIMUM_PAYOUT = 25.00;

/**
 * Get or create a Stripe customer for a user
 */
async function getOrCreateCustomer(userId, userEmail, userName) {
  try {
    const stripe = getStripeClient();
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Check if customer already exists
    if (userData?.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(userData.stripeCustomerId);
        if (!customer.deleted) {
          return customer;
        }
      } catch (error) {
        console.log('Existing customer not found, creating new one...');
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: userEmail,
      name: userName,
      metadata: {
        userId,
        platform: 'AnyRyde',
        userType: 'rider'
      }
    });

    // Save customer ID to Firestore
    await userRef.update({
      stripeCustomerId: customer.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Created Stripe customer:', customer.id);
    return customer;

  } catch (error) {
    console.error('❌ Error getting/creating customer:', error);
    throw error;
  }
}

/**
 * Create a Stripe Connect account for a driver
 */
async function createConnectAccount(driverId, driverEmail, driverData) {
  try {
    const stripe = getStripeClient();
    const db = admin.firestore();
    const driverRef = db.collection('drivers').doc(driverId);

    // Check if account already exists
    const driverDoc = await driverRef.get();
    const existingData = driverDoc.data();
    
    if (existingData?.stripeConnectAccountId) {
      const account = await stripe.accounts.retrieve(existingData.stripeConnectAccountId);
      return account;
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: driverEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual',
      metadata: {
        driverId,
        platform: 'AnyRyde',
        userType: 'driver'
      }
    });

    // Save account ID to Firestore
    await driverRef.update({
      stripeConnectAccountId: account.id,
      paymentStatus: 'pending_verification',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Created Stripe Connect account:', account.id);
    return account;

  } catch (error) {
    console.error('❌ Error creating Connect account:', error);
    throw error;
  }
}

/**
 * Create onboarding link for driver to complete Stripe Connect setup
 */
async function createConnectOnboardingLink(accountId, refreshUrl, returnUrl) {
  try {
    const stripe = getStripeClient();
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink.url;
  } catch (error) {
    console.error('❌ Error creating onboarding link:', error);
    throw error;
  }
}

/**
 * Create a payment intent for a ride
 */
async function createPaymentIntent(rideData) {
  try {
    const stripe = getStripeClient();
    const {
      amount,
      currency = 'usd',
      customerId,
      rideId,
      riderId,
      driverId,
      metadata = {}
    } = rideData;

    if (amount < 1) {
      throw new Error('Payment amount must be at least $1.00');
    }

    // Get driver's commission rate
    const db = admin.firestore();
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    const driverData = driverDoc.data();
    
    let commissionRate = COMMISSION_RATES.standard;
    if (driverData?.accountType === 'premium') {
      commissionRate = COMMISSION_RATES.premium;
    } else if (driverData?.specializations?.includes('medical')) {
      commissionRate = COMMISSION_RATES.medical;
    } else if (driverData?.accountType === 'business') {
      commissionRate = COMMISSION_RATES.business;
    }

    const platformFee = Math.round(amount * commissionRate * 100); // In cents
    const amountInCents = Math.round(amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      customer: customerId,
      application_fee_amount: platformFee,
      transfer_data: {
        destination: driverData.stripeConnectAccountId,
      },
      metadata: {
        rideId,
        riderId,
        driverId,
        platform: 'AnyRyde',
        commissionRate: (commissionRate * 100).toString(),
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
      description: `AnyRyde Ride #${rideId.slice(0, 8)}`,
    });

    // Store payment intent in Firestore
    await db.collection('payments').add({
      paymentIntentId: paymentIntent.id,
      rideId,
      riderId,
      driverId,
      amount,
      currency,
      platformFee: platformFee / 100,
      driverAmount: (amountInCents - platformFee) / 100,
      commissionRate,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Created payment intent:', paymentIntent.id);
    return paymentIntent;

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Confirm a payment intent (for server-side confirmation)
 */
async function confirmPaymentIntent(paymentIntentId) {
  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    
    console.log('✅ Confirmed payment intent:', paymentIntentId);
    return paymentIntent;

  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    throw error;
  }
}

/**
 * Process a refund
 */
async function createRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
  try {
    const stripe = getStripeClient();
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
      reason,
      metadata: {
        platform: 'AnyRyde',
        refundedAt: new Date().toISOString()
      }
    });

    // Update payment record in Firestore
    const db = admin.firestore();
    const paymentsSnapshot = await db.collection('payments')
      .where('paymentIntentId', '==', paymentIntentId)
      .limit(1)
      .get();

    if (!paymentsSnapshot.empty) {
      const paymentDoc = paymentsSnapshot.docs[0];
      await paymentDoc.ref.update({
        refundId: refund.id,
        refundAmount: refund.amount / 100,
        refundStatus: refund.status,
        refundReason: reason,
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log('✅ Created refund:', refund.id);
    return refund;

  } catch (error) {
    console.error('❌ Error creating refund:', error);
    throw error;
  }
}

/**
 * Create a payout to driver (manual payout, not automatic transfer)
 */
async function createPayout(driverId, amount) {
  try {
    const stripe = getStripeClient();
    if (amount < MINIMUM_PAYOUT) {
      throw new Error(`Minimum payout amount is $${MINIMUM_PAYOUT}`);
    }

    const db = admin.firestore();
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    const driverData = driverDoc.data();

    if (!driverData?.stripeConnectAccountId) {
      throw new Error('Driver does not have a Stripe Connect account');
    }

    // Create payout to driver's connected account
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: {
          driverId,
          platform: 'AnyRyde'
        }
      },
      {
        stripeAccount: driverData.stripeConnectAccountId
      }
    );

    // Record payout in Firestore
    await db.collection('payouts').add({
      payoutId: payout.id,
      driverId,
      amount,
      status: payout.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Created payout:', payout.id);
    return payout;

  } catch (error) {
    console.error('❌ Error creating payout:', error);
    throw error;
  }
}

/**
 * Get payment methods for a customer
 */
async function getPaymentMethods(customerId) {
  try {
    const stripe = getStripeClient();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;

  } catch (error) {
    console.error('❌ Error getting payment methods:', error);
    throw error;
  }
}

/**
 * Attach a payment method to a customer
 */
async function attachPaymentMethod(paymentMethodId, customerId) {
  try {
    const stripe = getStripeClient();
    const paymentMethod = await stripe.paymentMethods.attach(
      paymentMethodId,
      { customer: customerId }
    );

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    console.log('✅ Attached payment method:', paymentMethodId);
    return paymentMethod;

  } catch (error) {
    console.error('❌ Error attaching payment method:', error);
    throw error;
  }
}

/**
 * Get driver earnings summary
 */
async function getDriverEarnings(driverId, startDate, endDate) {
  try {
    const db = admin.firestore();
    let query = db.collection('payments')
      .where('driverId', '==', driverId)
      .where('status', '==', 'succeeded');

    if (startDate) {
      query = query.where('createdAt', '>=', startDate);
    }
    if (endDate) {
      query = query.where('createdAt', '<=', endDate);
    }

    const paymentsSnapshot = await query.get();

    let totalEarnings = 0;
    let totalRides = 0;
    let totalPlatformFees = 0;

    paymentsSnapshot.forEach(doc => {
      const payment = doc.data();
      totalEarnings += payment.driverAmount || 0;
      totalPlatformFees += payment.platformFee || 0;
      totalRides += 1;
    });

    return {
      totalEarnings,
      totalRides,
      totalPlatformFees,
      averageEarningPerRide: totalRides > 0 ? totalEarnings / totalRides : 0
    };

  } catch (error) {
    console.error('❌ Error getting driver earnings:', error);
    throw error;
  }
}

module.exports = {
  COMMISSION_RATES,
  MINIMUM_PAYOUT,
  getOrCreateCustomer,
  createConnectAccount,
  createConnectOnboardingLink,
  createPaymentIntent,
  confirmPaymentIntent,
  createRefund,
  createPayout,
  getPaymentMethods,
  attachPaymentMethod,
  getDriverEarnings
};

