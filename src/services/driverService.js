import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  arrayUnion 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

// Driver onboarding status constants
export const DRIVER_STATUS = {
  PENDING: 'pending',
  DOCUMENTS_PENDING: 'documents_pending',
  BACKGROUND_CHECK_PENDING: 'background_check_pending',
  REVIEW_PENDING: 'review_pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  ACTIVE: 'active'
};

export const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  ACCOUNT_CREATION: 'account_creation',
  PERSONAL_INFO: 'personal_info',
  DOCUMENT_UPLOAD: 'document_upload',
  VEHICLE_INFO: 'vehicle_info',
  BACKGROUND_CHECK: 'background_check',
  PAYOUT_SETUP: 'payout_setup',
  AVAILABILITY: 'availability',
  REVIEW: 'review',
  SUBMITTED: 'submitted'
};

export const DOCUMENT_TYPES = {
  DRIVERS_LICENSE_FRONT: 'drivers_license_front',
  DRIVERS_LICENSE_BACK: 'drivers_license_back',
  GOVERNMENT_ID_FRONT: 'government_id_front',
  GOVERNMENT_ID_BACK: 'government_id_back',
  VEHICLE_REGISTRATION: 'vehicle_registration',
  INSURANCE_PROOF: 'insurance_proof',
  PROFILE_PHOTO: 'profile_photo'
};

// Create new driver application
export const createDriverApplication = async (userId, initialData) => {
  try {
    const driverData = {
      userId,
      status: DRIVER_STATUS.PENDING,
      currentStep: ONBOARDING_STEPS.PERSONAL_INFO,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      personalInfo: {},
      vehicleInfo: {},
      documents: {},
      backgroundCheck: {},
      payoutInfo: {},
      availability: {},
      adminNotes: [],
      stepProgress: {
        [ONBOARDING_STEPS.PERSONAL_INFO]: false,
        [ONBOARDING_STEPS.DOCUMENT_UPLOAD]: false,
        [ONBOARDING_STEPS.VEHICLE_INFO]: false,
        [ONBOARDING_STEPS.BACKGROUND_CHECK]: false,
        [ONBOARDING_STEPS.PAYOUT_SETUP]: false,
        [ONBOARDING_STEPS.AVAILABILITY]: false,
        [ONBOARDING_STEPS.REVIEW]: false,
      },
      ...initialData
    };

    await setDoc(doc(db, 'drivers', userId), driverData);
    return { success: true, data: driverData };
  } catch (error) {
    console.error('Error creating driver application:', error);
    return { success: false, error: error.message };
  }
};

// Get driver application by user ID
export const getDriverApplication = async (userId) => {
  try {
    const driverDoc = await getDoc(doc(db, 'drivers', userId));
    
    if (driverDoc.exists()) {
      return { success: true, data: driverDoc.data() };
    } else {
      return { success: false, error: 'Driver application not found' };
    }
  } catch (error) {
    console.error('Error getting driver application:', error);
    return { success: false, error: error.message };
  }
};

// Update driver application step data
export const updateDriverStep = async (userId, stepName, stepData) => {
  try {
    const updateData = {
      [stepName]: stepData,
      [`stepProgress.${stepName}`]: true,
      updatedAt: serverTimestamp()
    };

    // Update current step if moving forward
    const stepOrder = Object.values(ONBOARDING_STEPS);
    const currentStepIndex = stepOrder.indexOf(stepName);
    const nextStep = stepOrder[currentStepIndex + 1];
    
    if (nextStep) {
      updateData.currentStep = nextStep;
    }

    await updateDoc(doc(db, 'drivers', userId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating driver step:', error);
    return { success: false, error: error.message };
  }
};

// Upload driver document
export const uploadDriverDocument = async (userId, documentType, file) => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${documentType}.${fileExtension}`;
    const storageRef = ref(storage, `drivers/${userId}/documents/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update driver document info in Firestore
    const documentData = {
      [`documents.${documentType}`]: {
        url: downloadURL,
        fileName: file.name,
        uploadedAt: serverTimestamp(),
        verified: false
      },
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'drivers', userId), documentData);
    
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { success: false, error: error.message };
  }
};

// Delete driver document
export const deleteDriverDocument = async (userId, documentType) => {
  try {
    // Get current document info
    const driverDoc = await getDoc(doc(db, 'drivers', userId));
    const driverData = driverDoc.data();
    
    if (driverData?.documents?.[documentType]) {
      // Delete from storage
      const fileName = driverData.documents[documentType].fileName;
      const fileExtension = fileName.split('.').pop();
      const storageRef = ref(storage, `drivers/${userId}/documents/${documentType}.${fileExtension}`);
      
      try {
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn('File may not exist in storage:', storageError);
      }
      
      // Remove from Firestore
      const updatedDocuments = { ...driverData.documents };
      delete updatedDocuments[documentType];
      
      await updateDoc(doc(db, 'drivers', userId), {
        documents: updatedDocuments,
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
};

// Submit driver application for review
export const submitDriverApplication = async (userId) => {
  try {
    await updateDoc(doc(db, 'drivers', userId), {
      status: DRIVER_STATUS.REVIEW_PENDING,
      currentStep: ONBOARDING_STEPS.SUBMITTED,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting driver application:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Get all driver applications with filters
export const getDriverApplications = async (filters = {}) => {
  try {
    let q = collection(db, 'drivers');
    
    // Apply filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    const querySnapshot = await getDocs(q);
    const drivers = [];
    
    querySnapshot.forEach((doc) => {
      drivers.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: drivers };
  } catch (error) {
    console.error('Error getting driver applications:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Update driver status
export const updateDriverStatus = async (userId, status, adminNote = '') => {
  try {
    const updateData = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (adminNote) {
      updateData.adminNotes = arrayUnion({
        note: adminNote,
        timestamp: serverTimestamp(),
        action: status
      });
    }
    
    await updateDoc(doc(db, 'drivers', userId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating driver status:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Verify document
export const verifyDriverDocument = async (userId, documentType, isVerified, note = '') => {
  try {
    const updateData = {
      [`documents.${documentType}.verified`]: isVerified,
      [`documents.${documentType}.verifiedAt`]: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    if (note) {
      updateData[`documents.${documentType}.verificationNote`] = note;
    }
    
    await updateDoc(doc(db, 'drivers', userId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Error verifying document:', error);
    return { success: false, error: error.message };
  }
};

// Check if driver application exists
export const checkDriverExists = async (userId) => {
  try {
    const driverDoc = await getDoc(doc(db, 'drivers', userId));
    return { success: true, exists: driverDoc.exists(), data: driverDoc.data() };
  } catch (error) {
    console.error('Error checking driver existence:', error);
    return { success: false, error: error.message };
  }
};

// Get onboarding progress percentage
export const getOnboardingProgress = (stepProgress) => {
  if (!stepProgress) return 0;
  
  const totalSteps = Object.keys(ONBOARDING_STEPS).length - 2; // Exclude WELCOME and SUBMITTED
  const completedSteps = Object.values(stepProgress).filter(Boolean).length;
  
  return Math.round((completedSteps / totalSteps) * 100);
};

// Validate step completion
export const validateStepCompletion = (stepName, data) => {
  const errors = [];
  
  switch (stepName) {
    case ONBOARDING_STEPS.PERSONAL_INFO:
      if (!data.firstName) errors.push('First name is required');
      if (!data.lastName) errors.push('Last name is required');
      if (!data.dateOfBirth) errors.push('Date of birth is required');
      if (!data.phoneNumber) errors.push('Phone number is required');
      if (!data.address) errors.push('Address is required');
      break;
      
    case ONBOARDING_STEPS.VEHICLE_INFO:
      if (!data.make) errors.push('Vehicle make is required');
      if (!data.model) errors.push('Vehicle model is required');
      if (!data.year) errors.push('Vehicle year is required');
      if (!data.licensePlate) errors.push('License plate is required');
      if (!data.color) errors.push('Vehicle color is required');
      if (!data.vehicleType) errors.push('Vehicle type is required');
      if (!data.numberOfSeats) errors.push('Number of seats is required');
      if (!data.condition) errors.push('Vehicle condition is required');
      if (!data.insuranceCompany) errors.push('Insurance company is required');
      if (!data.insurancePolicyNumber) errors.push('Insurance policy number is required');
      if (!data.insuranceExpiration) errors.push('Insurance expiration date is required');
      if (!data.registrationState) errors.push('Registration state is required');
      if (!data.registrationExpiration) errors.push('Registration expiration date is required');
      break;
      
    case ONBOARDING_STEPS.BACKGROUND_CHECK:
      // SSN validation
      const ssnDigits = data.ssn ? data.ssn.replace(/\D/g, '') : '';
      if (!data.ssn) errors.push('Social Security Number is required');
      else if (ssnDigits.length !== 9) errors.push('Valid 9-digit SSN is required');
      
      // Current address validation
      if (!data.currentAddress?.street) errors.push('Current street address is required');
      if (!data.currentAddress?.city) errors.push('Current city is required');
      if (!data.currentAddress?.state) errors.push('Current state is required');
      if (!data.currentAddress?.zipCode) errors.push('Current ZIP code is required');
      if (!data.currentAddress?.yearsAtAddress || data.currentAddress.yearsAtAddress < 0) {
        errors.push('Years at current address is required');
      }
      
      // Previous address validation (if applicable)
      if (data.hasPreviousAddress) {
        if (!data.previousAddress?.street) errors.push('Previous street address is required');
        if (!data.previousAddress?.city) errors.push('Previous city is required');
        if (!data.previousAddress?.state) errors.push('Previous state is required');
        if (!data.previousAddress?.zipCode) errors.push('Previous ZIP code is required');
        if (!data.previousAddress?.yearsAtAddress || data.previousAddress.yearsAtAddress < 0) {
          errors.push('Years at previous address is required');
        }
      }
      
      // Consent validation
      if (!data.consentBackgroundCheck) errors.push('Background check consent is required');
      if (!data.consentCriminalHistory) errors.push('Criminal history consent is required');
      if (!data.consentDrivingRecord) errors.push('Driving record consent is required');
      if (!data.understandTimeline) errors.push('Timeline acknowledgment is required');
      break;
      
    case ONBOARDING_STEPS.PAYOUT_SETUP:
      // Bank account validation
      if (!data.accountHolderName) errors.push('Account holder name is required');
      if (!data.bankName) errors.push('Bank name is required');
      if (!data.routingNumber) errors.push('Routing number is required');
      else if (data.routingNumber.length !== 9) errors.push('Routing number must be 9 digits');
      if (!data.accountNumber) errors.push('Account number is required');
      else if (data.accountNumber.length < 4) errors.push('Account number must be at least 4 digits');
      if (!data.confirmAccountNumber) errors.push('Account number confirmation is required');
      else if (data.accountNumber !== data.confirmAccountNumber) errors.push('Account numbers do not match');
      
      // Tax information validation
      const taxIdDigits = data.taxId ? data.taxId.replace(/\D/g, '') : '';
      if (!data.taxId) errors.push(`${data.taxIdType === 'ssn' ? 'SSN' : 'EIN'} is required`);
      else if (data.taxIdType === 'ssn' && taxIdDigits.length !== 9) errors.push('SSN must be 9 digits');
      else if (data.taxIdType === 'ein' && taxIdDigits.length !== 9) errors.push('EIN must be 9 digits');
      
      if (data.taxIdType === 'ein' && !data.businessName) errors.push('Business name is required for EIN');
      
      // Tax address validation (if not using same as personal)
      if (!data.useSameAddressAsPersonal) {
        if (!data.taxAddress?.street) errors.push('Tax address street is required');
        if (!data.taxAddress?.city) errors.push('Tax address city is required');
        if (!data.taxAddress?.state) errors.push('Tax address state is required');
        if (!data.taxAddress?.zipCode) errors.push('Tax address ZIP code is required');
      }
      
      // Payout preferences validation
      const minAmount = parseFloat(data.minimumPayoutAmount);
      if (!data.minimumPayoutAmount) errors.push('Minimum payout amount is required');
      else if (minAmount < 1 || minAmount > 1000) errors.push('Minimum payout amount must be between $1 and $1000');
      
      // Agreements validation
      if (!data.agreeToPayoutTerms) errors.push('Payout terms agreement is required');
      if (!data.agreeTo1099Reporting) errors.push('Tax reporting agreement is required');
      if (!data.understandFees) errors.push('Fee structure acknowledgment is required');
      if (!data.consentToTaxReporting) errors.push('Tax reporting consent is required');
      break;
      
    case ONBOARDING_STEPS.AVAILABILITY:
      // Check if at least one day is enabled
      const enabledDays = data.weeklySchedule ? Object.values(data.weeklySchedule).filter(day => day.enabled) : [];
      if (enabledDays.length === 0) errors.push('At least one day of availability must be selected');
      
      // Validate time slots for enabled days
      if (data.weeklySchedule) {
        Object.entries(data.weeklySchedule).forEach(([day, schedule]) => {
          if (schedule.enabled && schedule.startTime >= schedule.endTime) {
            errors.push(`${day} start time must be before end time`);
          }
        });
      }
      
      // Coverage area validation
      if (!data.primaryServiceArea) errors.push('Primary service area is required');
      
      const radius = parseFloat(data.serviceRadius);
      if (!data.serviceRadius || radius < 1 || radius > 100) {
        errors.push('Service radius must be between 1 and 100 miles');
      }
      
      // Trip duration validation
      const duration = parseFloat(data.maxTripDuration);
      if (!data.maxTripDuration || duration < 15 || duration > 480) {
        errors.push('Max trip duration must be between 15 and 480 minutes');
      }
      
      // Response time validation
      const responseTime = parseFloat(data.responseTimeLimit);
      if (!data.responseTimeLimit || responseTime < 15 || responseTime > 300) {
        errors.push('Response time must be between 15 and 300 seconds');
      }
      
      // Auto-accept radius validation
      if (data.autoAcceptRides) {
        const autoRadius = parseFloat(data.autoAcceptRadius);
        if (!data.autoAcceptRadius || autoRadius < 1 || autoRadius > 50) {
          errors.push('Auto-accept radius must be between 1 and 50 miles');
        }
      }
      
      // Minimum ride validation
      const minDistance = parseFloat(data.minimumRideDistance);
      if (!data.minimumRideDistance || minDistance < 0.5 || minDistance > 50) {
        errors.push('Minimum ride distance must be between 0.5 and 50 miles');
      }
      
      const minFare = parseFloat(data.minimumRideFare);
      if (!data.minimumRideFare || minFare < 2 || minFare > 100) {
        errors.push('Minimum ride fare must be between $2 and $100');
      }
      break;
      
    // Add more validation rules as needed
    default:
      break;
  }
  
  return { isValid: errors.length === 0, errors };
};

// Validate complete driver application before submission
export const validateCompleteApplication = (driverApplication) => {
  const errors = [];
  
  // Personal Information validation
  const personalInfo = driverApplication.personalInfo || {};
  if (!personalInfo.firstName) errors.push('First name is missing');
  if (!personalInfo.lastName) errors.push('Last name is missing');
  if (!personalInfo.dateOfBirth) errors.push('Date of birth is missing');
  if (!personalInfo.phoneNumber) errors.push('Phone number is missing');
  if (!personalInfo.email) errors.push('Email address is missing');
  if (!personalInfo.address) errors.push('Street address is missing');
  if (!personalInfo.city) errors.push('City is missing');
  if (!personalInfo.state) errors.push('State is missing');
  if (!personalInfo.zipCode) errors.push('ZIP code is missing');
  if (!personalInfo.coverageArea) errors.push('Coverage area is missing');
  
  // Document validation
  const documents = driverApplication.documents || {};
  const requiredDocuments = [
    { key: DOCUMENT_TYPES.DRIVERS_LICENSE_FRONT, name: "Driver's License (Front)" },
    { key: DOCUMENT_TYPES.DRIVERS_LICENSE_BACK, name: "Driver's License (Back)" },
    { key: DOCUMENT_TYPES.VEHICLE_REGISTRATION, name: 'Vehicle Registration' },
    { key: DOCUMENT_TYPES.INSURANCE_PROOF, name: 'Insurance Proof' }
  ];
  
  requiredDocuments.forEach(({ key, name }) => {
    if (!documents[key]) {
      errors.push(`${name} document is missing`);
    }
  });
  
  // Vehicle Information validation
  const vehicleInfo = driverApplication.vehicleInfo || {};
  if (!vehicleInfo.make) errors.push('Vehicle make is missing');
  if (!vehicleInfo.model) errors.push('Vehicle model is missing');
  if (!vehicleInfo.year) errors.push('Vehicle year is missing');
  if (!vehicleInfo.color) errors.push('Vehicle color is missing');
  if (!vehicleInfo.licensePlate) errors.push('License plate is missing');
  if (!vehicleInfo.vehicleType) errors.push('Vehicle type is missing');
  if (!vehicleInfo.numberOfSeats) errors.push('Number of seats is missing');
  if (!vehicleInfo.condition) errors.push('Vehicle condition is missing');
  if (!vehicleInfo.insuranceCompany) errors.push('Insurance company is missing');
  if (!vehicleInfo.insurancePolicyNumber) errors.push('Insurance policy number is missing');
  if (!vehicleInfo.insuranceExpiration) errors.push('Insurance expiration date is missing');
  if (!vehicleInfo.registrationState) errors.push('Registration state is missing');
  if (!vehicleInfo.registrationExpiration) errors.push('Registration expiration date is missing');
  
  // Background Check validation
  const backgroundCheck = driverApplication.backgroundCheck || {};
  const ssnDigits = backgroundCheck.ssn ? backgroundCheck.ssn.replace(/\D/g, '') : '';
  if (!backgroundCheck.ssn) errors.push('Social Security Number is missing');
  else if (ssnDigits.length !== 9) errors.push('Valid Social Security Number is required');
  
  if (!backgroundCheck.currentAddress?.street) errors.push('Current address is missing');
  if (!backgroundCheck.currentAddress?.city) errors.push('Current city is missing');
  if (!backgroundCheck.currentAddress?.state) errors.push('Current state is missing');
  if (!backgroundCheck.currentAddress?.zipCode) errors.push('Current ZIP code is missing');
  if (!backgroundCheck.currentAddress?.yearsAtAddress) errors.push('Years at current address is missing');
  
  if (backgroundCheck.hasPreviousAddress) {
    if (!backgroundCheck.previousAddress?.street) errors.push('Previous address is missing');
    if (!backgroundCheck.previousAddress?.city) errors.push('Previous city is missing');
    if (!backgroundCheck.previousAddress?.state) errors.push('Previous state is missing');
    if (!backgroundCheck.previousAddress?.zipCode) errors.push('Previous ZIP code is missing');
    if (!backgroundCheck.previousAddress?.yearsAtAddress) errors.push('Years at previous address is missing');
  }
  
  if (!backgroundCheck.consentBackgroundCheck) errors.push('Background check consent is required');
  if (!backgroundCheck.consentCriminalHistory) errors.push('Criminal history consent is required');
  if (!backgroundCheck.consentDrivingRecord) errors.push('Driving record consent is required');
  if (!backgroundCheck.understandTimeline) errors.push('Timeline acknowledgment is required');
  
  // Payout Setup validation
  const payoutInfo = driverApplication.payoutInfo || {};
  if (!payoutInfo.accountHolderName) errors.push('Account holder name is missing');
  if (!payoutInfo.bankName) errors.push('Bank name is missing');
  if (!payoutInfo.routingNumber) errors.push('Routing number is missing');
  if (!payoutInfo.accountNumber) errors.push('Account number is missing');
  if (!payoutInfo.taxId) errors.push('Tax ID is missing');
  if (!payoutInfo.agreeToPayoutTerms) errors.push('Payout terms agreement is missing');
  if (!payoutInfo.agreeTo1099Reporting) errors.push('Tax reporting agreement is missing');
  if (!payoutInfo.understandFees) errors.push('Fee structure acknowledgment is missing');
  if (!payoutInfo.consentToTaxReporting) errors.push('Tax reporting consent is missing');
  
  // Availability validation
  const availability = driverApplication.availability || {};
  const enabledDays = availability.weeklySchedule ? Object.values(availability.weeklySchedule).filter(day => day.enabled) : [];
  if (enabledDays.length === 0) errors.push('At least one day of availability must be set');
  if (!availability.primaryServiceArea) errors.push('Primary service area is missing');
  if (!availability.serviceRadius) errors.push('Service radius is missing');
  if (!availability.maxTripDuration) errors.push('Maximum trip duration is missing');
  if (!availability.responseTimeLimit) errors.push('Response time limit is missing');
  if (!availability.minimumRideDistance) errors.push('Minimum ride distance is missing');
  if (!availability.minimumRideFare) errors.push('Minimum ride fare is missing');
  
  // Age validation
  if (personalInfo.dateOfBirth) {
    const birthDate = new Date(personalInfo.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      errors.push('Driver must be at least 18 years old');
    }
  }
  
  // Vehicle year validation
  if (vehicleInfo.year) {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 15;
    const vehicleYear = parseInt(vehicleInfo.year);
    
    if (vehicleYear < minYear || vehicleYear > currentYear) {
      errors.push(`Vehicle must be between ${minYear} and ${currentYear}`);
    }
  }
  
  // Insurance/Registration expiration validation
  if (vehicleInfo.insuranceExpiration) {
    const insuranceExpiration = new Date(vehicleInfo.insuranceExpiration);
    const today = new Date();
    
    if (insuranceExpiration <= today) {
      errors.push('Insurance must be valid for at least 30 days');
    }
  }
  
  if (vehicleInfo.registrationExpiration) {
    const registrationExpiration = new Date(vehicleInfo.registrationExpiration);
    const today = new Date();
    
    if (registrationExpiration <= today) {
      errors.push('Vehicle registration must be current');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}; 