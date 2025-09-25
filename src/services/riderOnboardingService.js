import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Check if rider has completed basic profile setup
export const checkRiderOnboardingStatus = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check if rider has basic profile information
      const hasBasicProfile = !!(
        userData.firstName && 
        userData.lastName && 
        userData.emergencyContact?.name &&
        userData.emergencyContact?.phone
      );
      
      // Check if rider has profile picture
      const hasProfilePicture = !!(userData.profilePicture);
      
      // Check if rider has preferences set up
      const hasPreferences = !!(
        userData.preferences && 
        Object.keys(userData.preferences).length > 0
      );
      
      // Check if rider has completed any additional setup
      const hasAdditionalSetup = !!(
        userData.accessibility || 
        userData.family || 
        userData.business
      );
      
      const isFullyOnboarded = hasBasicProfile && hasProfilePicture && hasPreferences;
      const needsBasicSetup = !hasBasicProfile;
      const needsProfilePicture = hasBasicProfile && !hasProfilePicture;
      const needsPreferences = hasBasicProfile && hasProfilePicture && !hasPreferences;
      
      return {
        success: true,
        data: {
          isOnboarded: isFullyOnboarded,
          needsOnboarding: !isFullyOnboarded,
          hasBasicProfile,
          hasProfilePicture,
          hasPreferences,
          hasAdditionalSetup,
          needsBasicSetup,
          needsProfilePicture,
          needsPreferences,
          completionPercentage: calculateCompletionPercentage({
            hasBasicProfile,
            hasProfilePicture,
            hasPreferences,
            hasAdditionalSetup
          })
        }
      };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error checking rider onboarding status:', error);
    return { success: false, error: error.message };
  }
};

// Calculate completion percentage
const calculateCompletionPercentage = ({ hasBasicProfile, hasProfilePicture, hasPreferences, hasAdditionalSetup }) => {
  let percentage = 0;
  
  if (hasBasicProfile) percentage += 40;
  if (hasProfilePicture) percentage += 20;
  if (hasPreferences) percentage += 25;
  if (hasAdditionalSetup) percentage += 15;
  
  return percentage;
};

// Complete rider onboarding
export const completeRiderOnboarding = async (userId, additionalData = {}) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      // Mark onboarding as completed
      const updateData = {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
        ...additionalData
      };
      
      // Update the user document
      await updateDoc(doc(db, 'users', userId), updateData);
      
      return { success: true };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error completing rider onboarding:', error);
    return { success: false, error: error.message };
  }
};
