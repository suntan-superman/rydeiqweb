// Phone number validation utilities

/**
 * Validates if a phone number is in the correct format
 * @param {string} phoneNumber - The phone number to validate (digits only)
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  
  // Remove any non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // US phone numbers should be exactly 10 digits
  return cleanNumber.length === 10;
};

/**
 * Formats a phone number for display
 * @param {string} phoneNumber - The phone number to format (digits only)
 * @returns {string} - Formatted phone number like (555) 123-4567
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.length === 0) return '';
  if (cleanNumber.length <= 3) return `(${cleanNumber}`;
  if (cleanNumber.length <= 6) return `(${cleanNumber.slice(0, 3)}) ${cleanNumber.slice(3)}`;
  if (cleanNumber.length <= 10) return `(${cleanNumber.slice(0, 3)}) ${cleanNumber.slice(3, 6)}-${cleanNumber.slice(6)}`;
  
  // If more than 10 digits, truncate to 10
  return `(${cleanNumber.slice(0, 3)}) ${cleanNumber.slice(3, 6)}-${cleanNumber.slice(6, 10)}`;
};

/**
 * Gets a clean phone number (digits only) from various formats
 * @param {string} phoneNumber - The phone number in any format
 * @returns {string} - Clean phone number with only digits
 */
export const cleanPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  return phoneNumber.replace(/\D/g, '');
};

/**
 * React Hook Form validation rules for phone numbers
 */
export const phoneValidationRules = {
  required: 'Phone number is required',
  validate: {
    isValid: (value) => {
      const cleanValue = cleanPhoneNumber(value);
      return isValidPhoneNumber(cleanValue) || 'Please enter a valid 10-digit phone number';
    }
  }
};

/**
 * React Hook Form validation rules for emergency contact phone numbers
 */
export const emergencyPhoneValidationRules = {
  required: 'Emergency contact phone is required',
  validate: {
    isValid: (value) => {
      const cleanValue = cleanPhoneNumber(value);
      return isValidPhoneNumber(cleanValue) || 'Please enter a valid 10-digit phone number';
    }
  }
};
