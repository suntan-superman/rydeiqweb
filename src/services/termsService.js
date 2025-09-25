// Terms of Use Service
// Handles different terms of use documents for riders and drivers

// Rider Terms of Use
export const RIDER_TERMS = `# AnyRyde Terms of Use for Riders

**Effective Date:** [Insert Date]

## 1. Acceptance of Terms
By creating an account or using the AnyRyde mobile application as a rider, you agree to comply with and be bound by the following Terms of Use. If you do not agree to these terms, you may not access or use the platform.

## 2. Rider Eligibility
You must be at least 18 years old to create a rider account or have the express permission of a legal guardian. You must also provide accurate and complete information when registering.

## 3. Use of the Platform
AnyRyde allows riders to request transportation services from independent drivers. You agree to use the app only for lawful purposes and to treat drivers respectfully. Any misuse of the platform may result in account suspension or termination.

## 4. Payments and Charges
Riders are responsible for paying the fare agreed upon during the bid selection process, including any applicable fees or surcharges. You authorize AnyRyde to charge your selected payment method upon ride confirmation.

## 5. Ride Types and Preferences
Riders may choose from various ride types (e.g., Standard, Tow-Back, Paired Driver, Video-Enabled). You acknowledge that availability of these services may vary based on location, driver availability, and platform settings.

## 6. Safety and Conduct
AnyRyde offers optional video-recorded rides and safety flagging features for your protection. You agree not to harass, threaten, or endanger any driver or other passenger. Safety violations may lead to suspension and legal action.

## 7. Medical Transport Use
If you use AnyRyde for medical appointments under a third-party healthcare arrangement, you agree to attend all scheduled appointments and understand that misuse (e.g., no-shows, fraudulent claims) may lead to service restrictions or reporting to your provider.

## 8. Privacy and Data
By using the app, you agree to the collection and use of your personal and trip data as outlined in the AnyRyde Privacy Policy, including location data, video data (if opted-in), and trip history for compliance and support purposes.

## 9. Modifications to Terms
AnyRyde reserves the right to update or modify these Terms of Use at any time. Continued use of the app after changes constitutes acceptance of the revised terms.

## 10. Contact
For questions regarding these Terms of Use, please contact us at: support@anyryde.com

**By tapping 'Accept', you acknowledge that you have read, understood, and agree to be bound by these Terms of Use.**`;

// Driver Terms of Use
export const DRIVER_TERMS = `# AnyRyde Terms of Use for Drivers

**Effective Date:** [Insert Date]

## 1. Acceptance of Terms
By registering as a driver with AnyRyde and using the AnyRyde Driver mobile application, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, do not use the platform.

## 2. Driver Eligibility
To register as a driver, you must be at least 21 years of age, possess a valid driver's license, maintain required auto insurance, and pass all onboarding requirements, including identity verification and background checks.

## 3. Use of the Platform
You agree to operate your vehicle in accordance with all applicable laws and regulations. You are responsible for your conduct and the condition of your vehicle while using the platform. Misconduct may result in account suspension or deactivation.

## 4. Fare Bidding and Payments
As an AnyRyde driver, you may set your own ride fare, which will be shown to riders during the bidding process. You acknowledge that AnyRyde retains a transaction fee and that earnings will be disbursed via the payment method on file.

## 5. Vehicle and Ride Type Declarations
You agree to truthfully declare your vehicle type and any available services (e.g., Tow-Back, Paired Driver, Video-Enabled Rides). Misrepresentation may result in removal from the platform.

## 6. Video-Enabled Ride Option
If you choose to offer video-enabled rides, you must have a functioning dashcam and comply with local recording laws. Video may be accessed by you, the rider, and AnyRyde for support or dispute resolution.

## 7. Medical Ride Responsibilities
Drivers offering medical rides must complete additional screening and consent to handle sensitive rider needs professionally. Failure to meet medical transport standards may lead to removal from this service category.

## 8. Taxes and Reporting
You are solely responsible for reporting your earnings and paying any taxes due as a self-employed individual. AnyRyde will provide earnings statements and 1099 forms as required.

## 9. Privacy and Data Use
AnyRyde may collect and store your location data, trip history, and video (if enabled) in accordance with its Privacy Policy. This data may be used to enhance platform safety, compliance, and performance.

## 10. Modification of Terms
AnyRyde may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms.

## 11. Contact
For questions regarding these Terms of Use, please contact us at: support@anyryde.com

**By tapping 'Accept', you acknowledge that you have read, understood, and agree to be bound by these Terms of Use.**`;

// Get terms based on user type
export const getTermsForUserType = (userType) => {
  switch (userType) {
    case 'driver':
      return DRIVER_TERMS;
    case 'rider':
    case 'passenger':
    default:
      return RIDER_TERMS;
  }
};

// Get terms title based on user type
export const getTermsTitleForUserType = (userType) => {
  switch (userType) {
    case 'driver':
      return 'AnyRyde Terms of Use for Drivers';
    case 'rider':
    case 'passenger':
    default:
      return 'AnyRyde Terms of Use for Riders';
  }
};

// Validate terms acceptance
export const validateTermsAcceptance = (userType, termsAccepted) => {
  if (!termsAccepted) {
    return {
      isValid: false,
      error: 'You MUST accept the terms and conditions to continue'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

const termsService = {
  RIDER_TERMS,
  DRIVER_TERMS,
  getTermsForUserType,
  getTermsTitleForUserType,
  validateTermsAcceptance
};

export default termsService;
