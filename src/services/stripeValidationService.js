// Stripe API Key Validation Service
// This service validates Stripe API keys and provides fallback behavior

// Default invalid key pattern
const INVALID_KEY_PATTERN = /^-?\d+$/; // Matches numbers like -99999, 12345, etc.

// Stripe publishable key pattern (starts with pk_)
const STRIPE_PUBLISHABLE_KEY_PATTERN = /^pk_(test|live)_[a-zA-Z0-9]{24}$/;

// Stripe secret key pattern (starts with sk_)
const STRIPE_SECRET_KEY_PATTERN = /^sk_(test|live)_[a-zA-Z0-9]{24}$/;

/**
 * Validates if a Stripe API key is properly formatted
 * @param {string} key - The API key to validate
 * @param {string} type - 'publishable' or 'secret'
 * @returns {boolean} - True if key is valid, false otherwise
 */
export const validateStripeKey = (key, type = 'publishable') => {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Check if it's a placeholder/invalid key
  if (INVALID_KEY_PATTERN.test(key)) {
    return false;
  }

  // Check if it's an empty string or just whitespace
  if (key.trim() === '') {
    return false;
  }

  // Validate against Stripe key patterns
  const pattern = type === 'publishable' 
    ? STRIPE_PUBLISHABLE_KEY_PATTERN 
    : STRIPE_SECRET_KEY_PATTERN;
  
  return pattern.test(key);
};

/**
 * Gets the Stripe publishable key from environment variables
 * @returns {string} - The publishable key or null if invalid
 */
export const getStripePublishableKey = () => {
  const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  
  if (validateStripeKey(key, 'publishable')) {
    return key;
  }
  
  console.warn('Invalid or missing Stripe publishable key. Payment functionality will be disabled.');
  return null;
};

/**
 * Gets the Stripe secret key from environment variables
 * @returns {string} - The secret key or null if invalid
 */
export const getStripeSecretKey = () => {
  const key = process.env.REACT_APP_STRIPE_SECRET_KEY;
  
  if (validateStripeKey(key, 'secret')) {
    return key;
  }
  
  console.warn('Invalid or missing Stripe secret key. Payment functionality will be disabled.');
  return null;
};

/**
 * Checks if Stripe is properly configured and available
 * @returns {object} - Object with isAvailable flag and details
 */
export const checkStripeAvailability = () => {
  const publishableKey = getStripePublishableKey();
  const secretKey = getStripeSecretKey();
  
  const isAvailable = !!(publishableKey && secretKey);
  
  return {
    isAvailable,
    publishableKey: !!publishableKey,
    secretKey: !!secretKey,
    reason: !isAvailable ? getUnavailableReason(publishableKey, secretKey) : null
  };
};

/**
 * Gets the reason why Stripe is unavailable
 * @param {string|null} publishableKey - The publishable key
 * @param {string|null} secretKey - The secret key
 * @returns {string} - The reason for unavailability
 */
const getUnavailableReason = (publishableKey, secretKey) => {
  if (!publishableKey && !secretKey) {
    return 'Both Stripe publishable and secret keys are missing or invalid';
  } else if (!publishableKey) {
    return 'Stripe publishable key is missing or invalid';
  } else if (!secretKey) {
    return 'Stripe secret key is missing or invalid';
  }
  return 'Unknown reason';
};

/**
 * Creates a mock Stripe instance for development/testing
 * @returns {object} - Mock Stripe object with basic methods
 */
export const createMockStripe = () => {
  console.warn('Using mock Stripe instance. Payment functionality is disabled.');
  
  return {
    paymentIntents: {
      create: async () => {
        throw new Error('Stripe is not configured. Please add valid API keys to enable payments.');
      }
    },
    confirmCardPayment: async () => {
      throw new Error('Stripe is not configured. Please add valid API keys to enable payments.');
    },
    loadStripe: async () => {
      throw new Error('Stripe is not configured. Please add valid API keys to enable payments.');
    }
  };
};

/**
 * Safely loads Stripe with error handling
 * @returns {Promise<object|null>} - Stripe instance or null if unavailable
 */
export const loadStripeSafely = async () => {
  try {
    const publishableKey = getStripePublishableKey();
    
    if (!publishableKey) {
      return null;
    }

    // Dynamically import Stripe
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripe = await loadStripe(publishableKey);
    
    if (!stripe) {
      console.error('Failed to load Stripe instance');
      return null;
    }
    
    return stripe;
  } catch (error) {
    console.error('Error loading Stripe:', error);
    return null;
  }
};

/**
 * Validates environment configuration
 * @returns {object} - Configuration status
 */
export const validateEnvironment = () => {
  const stripeStatus = checkStripeAvailability();
  
  return {
    stripe: stripeStatus,
    paymentEnabled: stripeStatus.isAvailable,
    warnings: stripeStatus.isAvailable ? [] : [stripeStatus.reason],
    recommendations: getRecommendations(stripeStatus)
  };
};

/**
 * Gets recommendations for fixing configuration issues
 * @param {object} stripeStatus - Stripe availability status
 * @returns {string[]} - Array of recommendations
 */
const getRecommendations = (stripeStatus) => {
  const recommendations = [];
  
  if (!stripeStatus.publishableKey) {
    recommendations.push(
      'Add REACT_APP_STRIPE_PUBLISHABLE_KEY to your .env file',
      'Get your publishable key from the Stripe Dashboard',
      'Use format: pk_test_... or pk_live_...'
    );
  }
  
  if (!stripeStatus.secretKey) {
    recommendations.push(
      'Add REACT_APP_STRIPE_SECRET_KEY to your .env file',
      'Get your secret key from the Stripe Dashboard',
      'Use format: sk_test_... or sk_live_...'
    );
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Stripe is properly configured!');
  }
  
  return recommendations;
};

// Assign object to a variable before exporting as module default
const stripeValidationService = {
  validateStripeKey,
  getStripePublishableKey,
  getStripeSecretKey,
  checkStripeAvailability,
  loadStripeSafely,
  validateEnvironment,
  createMockStripe
};

export default stripeValidationService; 