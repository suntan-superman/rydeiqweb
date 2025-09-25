import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { checkOnboardingStatus } from '../../services/driverService';
import { checkRiderOnboardingStatus } from '../../services/riderOnboardingService';
import { switchUserType } from '../../services/authService';
import { USER_TYPES } from '../../services/authService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

// Onboarding Continuation Modal
const OnboardingContinuationModal = ({ isOpen, onContinue, onSkip, userType, onClose }) => {
  if (!isOpen) return null;

  const getTitle = () => {
    switch (userType) {
      case USER_TYPES.DRIVER:
        return 'Complete Driver Onboarding';
      case USER_TYPES.PASSENGER:
        return 'Complete Rider Setup';
      default:
        return 'Complete Your Setup';
    }
  };

  const getMessage = () => {
    switch (userType) {
      case USER_TYPES.DRIVER:
        return 'You started the driver onboarding process but didn\'t complete it. Would you like to continue where you left off?';
      case USER_TYPES.PASSENGER:
        return 'You haven\'t completed your rider profile setup. You need to add a profile picture and complete your profile information. Would you like to finish setting up your account?';
      default:
        return 'You haven\'t completed your account setup. Would you like to finish setting up your profile?';
    }
  };

  const getButtonText = () => {
    switch (userType) {
      case USER_TYPES.DRIVER:
        return 'Continue Driver Onboarding';
      case USER_TYPES.PASSENGER:
        return 'Complete Rider Setup';
      default:
        return 'Complete Setup';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {getTitle()}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {getMessage()}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onSkip}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Skip for Now
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 SmartRedirect Modal: Button clicked');
                console.log('🎯 SmartRedirect Modal: onContinue function:', onContinue);
                onContinue();
              }}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {getButtonText()}
            </button>
          </div>
          <button
            onClick={onClose}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// User Type Selection Modal
const UserTypeSelectionModal = ({ isOpen, onSelect, userTypes, onClose }) => {
  if (!isOpen) return null;

  const getUserTypeInfo = (userType) => {
    switch (userType) {
      case USER_TYPES.DRIVER:
        return { label: 'Driver', icon: '🚗', description: 'Drive and earn money' };
      case USER_TYPES.PASSENGER:
        return { label: 'Rider', icon: '👤', description: 'Request rides' };
      case USER_TYPES.ADMINISTRATOR:
        return { label: 'Admin', icon: '⚙️', description: 'Manage the platform' };
      case USER_TYPES.HEALTHCARE_PROVIDER:
        return { label: 'Healthcare', icon: '🏥', description: 'Medical transportation' };
      default:
        return { label: userType, icon: '👤', description: 'Access your account' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Choose Your Role
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            You have multiple roles. Which one would you like to use?
          </p>
          <div className="space-y-3">
            {userTypes.map((userType) => {
              const info = getUserTypeInfo(userType);
              return (
                <button
                  key={userType}
                  onClick={() => onSelect(userType)}
                  className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl mr-3">{info.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{info.label}</div>
                    <div className="text-sm text-gray-500">{info.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Smart Redirect Component
const SmartRedirect = ({ children }) => {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [pendingUserType, setPendingUserType] = useState(null);
  const [isSwitchingUserType, setIsSwitchingUserType] = useState(false);

  // Redirect to appropriate dashboard based on user type
  const redirectToDashboard = useCallback((user) => {
    const userType = user.activeUserType || user.userType;
    
    switch (userType) {
      case USER_TYPES.DRIVER:
        navigate('/driver-dashboard');
        break;
      case USER_TYPES.ADMINISTRATOR:
        navigate('/admin-dashboard');
        break;
      case USER_TYPES.HEALTHCARE_PROVIDER:
        navigate('/medical-portal');
        break;
      default:
        navigate('/dashboard');
    }
  }, [navigate]);

  // Check user state and determine appropriate action
  useEffect(() => {
    const checkUserState = async () => {
      if (loading || !user) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if user has multiple user types
        const userTypes = user.userTypes || [user.userType];
        const hasMultipleTypes = userTypes.length > 1;

        if (hasMultipleTypes) {
          // User has multiple roles - show selection modal
          setShowUserTypeModal(true);
          setIsChecking(false);
          return;
        }

        // Single user type - check onboarding status
        const currentUserType = user.activeUserType || user.userType;
        
        if (currentUserType === USER_TYPES.DRIVER) {
          // Check driver onboarding status
          const onboardingResult = await checkOnboardingStatus(user.uid);
          if (onboardingResult.success) {
            const { needsOnboarding } = onboardingResult.data;
            
            if (needsOnboarding) {
              setPendingUserType(USER_TYPES.DRIVER);
              setShowOnboardingModal(true);
              setIsChecking(false);
              return;
            }
          }
        } else if (currentUserType === USER_TYPES.PASSENGER) {
          // Check rider onboarding status
          const riderOnboardingResult = await checkRiderOnboardingStatus(user.uid);
          if (riderOnboardingResult.success) {
            const { needsOnboarding, needsProfilePicture } = riderOnboardingResult.data;
            if (needsOnboarding || needsProfilePicture) {
              // For riders, redirect directly to onboarding instead of showing modal
              console.log('🎯 SmartRedirect: Rider needs onboarding, redirecting to /onboarding');
              navigate('/onboarding');
              setIsChecking(false);
              return;
            }
          }
        }

        // User is properly set up - redirect to appropriate dashboard
        redirectToDashboard(user);
        
      } catch (error) {
        console.error('Error checking user state:', error);
        // Fallback to basic redirect
        redirectToDashboard(user);
      } finally {
        setIsChecking(false);
      }
    };

    checkUserState();
  }, [user, loading, redirectToDashboard, navigate]);

  const handleOnboardingContinue = () => {
    console.log('🎯 SmartRedirect: handleOnboardingContinue called');
    console.log('🎯 SmartRedirect: pendingUserType:', pendingUserType);
    setShowOnboardingModal(false);
    
    if (pendingUserType === USER_TYPES.DRIVER) {
      console.log('🎯 SmartRedirect: Navigating to driver onboarding');
      navigate('/driver-onboarding');
    } else if (pendingUserType === USER_TYPES.PASSENGER) {
      console.log('🎯 SmartRedirect: Navigating to rider onboarding');
      // For riders, redirect to onboarding flow
      navigate('/onboarding');
    }
  };

  const handleOnboardingSkip = () => {
    setShowOnboardingModal(false);
    // Redirect to dashboard even if onboarding is incomplete
    redirectToDashboard(user);
  };

  const handleUserTypeSelect = async (selectedUserType) => {
    setShowUserTypeModal(false);
    setIsSwitchingUserType(true);
    
    try {
      // Use the existing switchUserType function to properly update the user
      const result = await switchUserType(user, selectedUserType);
      
      if (result.success) {
        setUser(result.data);
        toast.success(result.message);
        
        // Now check onboarding status for the selected user type
        if (selectedUserType === USER_TYPES.DRIVER) {
          const onboardingResult = await checkOnboardingStatus(user.uid);
          if (onboardingResult.success) {
            const { needsOnboarding } = onboardingResult.data;
            
            if (needsOnboarding) {
              setPendingUserType(USER_TYPES.DRIVER);
              setShowOnboardingModal(true);
              setIsSwitchingUserType(false);
              return;
            }
          }
        } else if (selectedUserType === USER_TYPES.PASSENGER) {
          // Check rider onboarding status
          const riderOnboardingResult = await checkRiderOnboardingStatus(user.uid);
          if (riderOnboardingResult.success) {
            const { needsOnboarding, needsProfilePicture } = riderOnboardingResult.data;
            if (needsOnboarding || needsProfilePicture) {
              setPendingUserType(USER_TYPES.PASSENGER);
              setShowOnboardingModal(true);
              setIsSwitchingUserType(false);
              return;
            }
          }
        }
        
        // User is properly set up - redirect to appropriate dashboard
        redirectToDashboard(result.data);
      } else {
        toast.error(result.error.message);
        // Fallback to basic redirect
        redirectToDashboard(user);
      }
    } catch (error) {
      console.error('Error switching user type:', error);
      toast.error('Failed to switch user type');
      // Fallback to basic redirect
      redirectToDashboard(user);
    } finally {
      setIsSwitchingUserType(false);
    }
  };

  const handleModalClose = () => {
    setShowOnboardingModal(false);
    setShowUserTypeModal(false);
    // Redirect to dashboard as fallback
    redirectToDashboard(user);
  };

  if (loading || isChecking || isSwitchingUserType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={isSwitchingUserType ? "Switching user type..." : "Setting up your experience..."} />
      </div>
    );
  }

  return (
    <>
      {children}
      
      <OnboardingContinuationModal
        isOpen={showOnboardingModal}
        onContinue={handleOnboardingContinue}
        onSkip={handleOnboardingSkip}
        onClose={handleModalClose}
        userType={pendingUserType}
      />
      {console.log('🎯 SmartRedirect: Modal state - showOnboardingModal:', showOnboardingModal, 'pendingUserType:', pendingUserType)}
      
      <UserTypeSelectionModal
        isOpen={showUserTypeModal}
        onSelect={handleUserTypeSelect}
        onClose={handleModalClose}
        userTypes={user?.userTypes || [user?.userType]}
      />
    </>
  );
};

export default SmartRedirect;
