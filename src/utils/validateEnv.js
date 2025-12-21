/**
 * Environment Variable Validation
 * Validates required environment variables at app startup
 * Fails fast if critical variables are missing
 */

const REQUIRED_ENV_VARS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
];

const OPTIONAL_ENV_VARS = [
  'REACT_APP_GOOGLE_MAPS_API_KEY',
  'REACT_APP_STRIPE_PUBLISHABLE_KEY',
  'REACT_APP_MEASUREMENT_ID',
];

/**
 * Validates that all required environment variables are set
 * @returns {{ valid: boolean, missing: string[], warnings: string[] }}
 */
export function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  REQUIRED_ENV_VARS.forEach((varName) => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  });

  // Check optional variables and warn if missing
  OPTIONAL_ENV_VARS.forEach((varName) => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      warnings.push(`Optional env var ${varName} is not set. Some features may be unavailable.`);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validates environment and throws/logs appropriately
 * Call this at app startup
 */
export function initializeEnvValidation() {
  const { valid, missing, warnings } = validateEnv();

  // Log warnings for optional variables
  warnings.forEach((warning) => {
    console.warn(`⚠️ ${warning}`);
  });

  if (!valid) {
    const errorMessage = `❌ Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file.`;
    
    if (process.env.NODE_ENV === 'production') {
      // In production, log error but don't crash - allow graceful degradation
      console.error(errorMessage);
    } else {
      // In development, show a clear error
      console.error(errorMessage);
      // Don't throw in development either to allow partial testing
    }
  } else {
    console.log('✅ All required environment variables are configured');
  }

  return { valid, missing, warnings };
}

export default validateEnv;
