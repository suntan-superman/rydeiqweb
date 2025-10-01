import React from 'react';
import EnhancedDriverScheduleManager from './EnhancedDriverScheduleManager';

/**
 * Driver Schedule View Component
 * Wrapper component that uses the Enhanced Driver Schedule Manager
 * Provides unified schedule management for both medical and regular rides
 */
const DriverScheduleView = ({ driverId, selectedDate = null, isMobile = false }) => {
  // Use the enhanced schedule manager for unified medical and regular ride management
  return (
    <EnhancedDriverScheduleManager
      driverId={driverId}
      viewMode="day"
      showMedicalRides={true}
      showRegularRides={true}
      allowEditing={true}
      onScheduleChange={() => {
        // Refresh schedule data if needed
        console.log('Schedule updated');
      }}
      isMobile={isMobile}
    />
  );
};

export default DriverScheduleView;