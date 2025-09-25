import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Profile Validation Service
 * Validates that users have completed their profile before booking rides
 */

export const validateProfileCompletion = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return {
        success: false,
        isComplete: false,
        missingFields: ['User not found'],
        error: 'User profile not found'
      };
    }

    const userData = userDoc.data();
    const missingFields = [];
    const warnings = [];

    // Required fields for ride booking
    const requiredFields = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email address',
      phone: 'Phone number',
      profilePicture: 'Profile picture',
      emergencyContact: 'Emergency contact information'
    };

    // Check basic profile information
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (field === 'emergencyContact') {
        if (!userData.emergencyContact || 
            !userData.emergencyContact.name || 
            !userData.emergencyContact.phone) {
          missingFields.push(label);
        }
      } else if (!userData[field]) {
        missingFields.push(label);
      }
    });

    // Check payment method (required for ride booking)
    if (!userData.paymentMethod || !userData.paymentMethod.type) {
      missingFields.push('Payment method');
    } else if (userData.paymentMethod.type === 'credit_card' || userData.paymentMethod.type === 'debit_card') {
      // Validate credit card details
      const cardFields = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'];
      const missingCardFields = cardFields.filter(field => !userData.paymentMethod[field]);
      if (missingCardFields.length > 0) {
        missingFields.push('Complete payment method details');
      }
    }

    // Check terms acceptance
    if (!userData.termsAccepted) {
      missingFields.push('Terms and conditions acceptance');
    }

    // Check email verification
    if (!userData.emailVerified) {
      warnings.push('Email verification pending');
    }

    const isComplete = missingFields.length === 0;
    
    return {
      success: true,
      isComplete,
      missingFields,
      warnings,
      userData: {
        hasProfilePicture: !!userData.profilePicture,
        hasPaymentMethod: !!(userData.paymentMethod && userData.paymentMethod.type),
        hasEmergencyContact: !!(userData.emergencyContact && userData.emergencyContact.name),
        termsAccepted: !!userData.termsAccepted,
        emailVerified: !!userData.emailVerified
      }
    };
  } catch (error) {
    console.error('Error validating profile completion:', error);
    return {
      success: false,
      isComplete: false,
      missingFields: ['Profile validation failed'],
      error: error.message
    };
  }
};

export const getProfileCompletionPercentage = (validationResult) => {
  if (!validationResult.success) return 0;
  
  const totalFields = 6; // firstName, lastName, email, phone, profilePicture, emergencyContact
  const completedFields = totalFields - validationResult.missingFields.length;
  
  return Math.round((completedFields / totalFields) * 100);
};

export const getProfileCompletionMessage = (validationResult) => {
  if (validationResult.isComplete) {
    return 'Your profile is complete and ready for ride booking!';
  }
  
  const missingCount = validationResult.missingFields.length;
  const percentage = getProfileCompletionPercentage(validationResult);
  
  return `Complete your profile (${percentage}% done) - ${missingCount} field${missingCount > 1 ? 's' : ''} remaining`;
};
