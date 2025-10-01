import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  ClockIcon, 
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  HeartIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import medicalDriverIntegrationService from '../../services/medicalDriverIntegrationService';
import toast from 'react-hot-toast';

/**
 * Driver Availability Checker Component
 * Integrates with AdvancedScheduling.js to show available drivers for medical rides
 * Shows real-time driver availability with medical requirements matching
 */
const DriverAvailabilityChecker = ({ 
  medicalRideData, 
  onDriversFound, 
  onDriverSelected,
  showSelection = true,
  autoRefresh = false 
}) => {
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkDriverAvailability = React.useCallback(async () => {
    if (!medicalRideData) return;

    setLoading(true);
    try {
      const result = await medicalDriverIntegrationService.findAvailableMedicalDrivers({
        pickupLocation: medicalRideData.pickupLocation,
        scheduledTime: new Date(medicalRideData.pickupDateTime || medicalRideData.appointmentDateTime),
        appointmentType: medicalRideData.appointmentType,
        medicalRequirements: medicalRideData.medicalRequirements,
        estimatedDuration: medicalRideData.estimatedDuration
      });

      setAvailableDrivers(result);
      setLastChecked(new Date());
      onDriversFound?.(result);
    } catch (error) {
      console.error('Error checking driver availability:', error);
      toast.error('Failed to check driver availability');
    } finally {
      setLoading(false);
    }
  }, [medicalRideData, onDriversFound]);

  useEffect(() => {
    if (medicalRideData) {
      checkDriverAvailability();
    }
  }, [medicalRideData, checkDriverAvailability]);

  useEffect(() => {
    let interval;
    if (autoRefresh && medicalRideData) {
      interval = setInterval(checkDriverAvailability, 30000); // Check every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, medicalRideData, checkDriverAvailability]);

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
    onDriverSelected?.(driver);
  };

  const getCapabilityIcon = (capability) => {
    const icons = {
      medical_transport: HeartIcon,
      wheelchair_accessible: ShieldCheckIcon,
      oxygen_equipped: '💨',
      stretcher_equipped: '🏥',
      assistance_available: UserGroupIcon
    };
    return icons[capability] || '✅';
  };

  const getCapabilityColor = (capability) => {
    const colors = {
      medical_transport: 'bg-red-100 text-red-800',
      wheelchair_accessible: 'bg-green-100 text-green-800',
      oxygen_equipped: 'bg-blue-100 text-blue-800',
      stretcher_equipped: 'bg-purple-100 text-purple-800',
      assistance_available: 'bg-yellow-100 text-yellow-800'
    };
    return colors[capability] || 'bg-gray-100 text-gray-800';
  };

  const formatMatchScore = (score) => {
    if (score >= 90) return { text: 'Excellent Match', color: 'text-green-600' };
    if (score >= 80) return { text: 'Good Match', color: 'text-blue-600' };
    if (score >= 70) return { text: 'Fair Match', color: 'text-yellow-600' };
    return { text: 'Basic Match', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Checking driver availability...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Available Medical Drivers
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={checkDriverAvailability}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Refresh
            </button>
            {lastChecked && (
              <span className="text-xs text-gray-500">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {availableDrivers.length === 0 ? (
          <div className="mt-4 text-center py-8">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Available Drivers</h4>
            <p className="text-gray-600">
              No drivers are available for this medical transport at the scheduled time.
              Try adjusting the time or expanding the search criteria.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Found {availableDrivers.length} available driver{availableDrivers.length !== 1 ? 's' : ''} 
              for {medicalRideData.appointmentType} transport
            </p>
          </div>
        )}
      </div>

      {/* Driver List */}
      {availableDrivers.length > 0 && (
        <div className="space-y-3">
          {availableDrivers.map((driver, index) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              index={index + 1}
              isSelected={selectedDriver?.id === driver.id}
              onSelect={() => handleDriverSelect(driver)}
              showSelection={showSelection}
              getCapabilityIcon={getCapabilityIcon}
              getCapabilityColor={getCapabilityColor}
              formatMatchScore={formatMatchScore}
            />
          ))}
        </div>
      )}

      {/* Selection Summary */}
      {selectedDriver && showSelection && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Selected Driver</h4>
          </div>
          <p className="text-blue-800">
            {selectedDriver.vehicleInfo?.serviceCapabilities?.includes('medical_transport') 
              ? 'Medical transport specialist' 
              : 'Standard driver'} - {selectedDriver.personalInfo?.firstName} {selectedDriver.personalInfo?.lastName}
          </p>
          <p className="text-sm text-blue-700">
            Estimated arrival: {selectedDriver.estimatedArrival} minutes • Distance: {selectedDriver.distance.toFixed(1)} miles
          </p>
        </div>
      )}
    </div>
  );
};

const DriverCard = ({ 
  driver, 
  index, 
  isSelected, 
  onSelect, 
  showSelection,
  getCapabilityIcon,
  getCapabilityColor,
  formatMatchScore
}) => {
  const matchScoreInfo = formatMatchScore(driver.matchScore);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Driver Info */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {driver.personalInfo?.firstName?.charAt(0) || 'D'}
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {driver.personalInfo?.firstName} {driver.personalInfo?.lastName}
              </h4>
              <p className="text-sm text-gray-600">
                {driver.vehicleInfo?.make} {driver.vehicleInfo?.model}
              </p>
            </div>
          </div>

          {/* Match Score */}
          <div className="flex items-center space-x-2 mb-3">
            <span className={`text-sm font-medium ${matchScoreInfo.color}`}>
              {matchScoreInfo.text}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${driver.matchScore}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">{driver.matchScore}%</span>
          </div>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-2 mb-3">
            {(driver.vehicleInfo?.serviceCapabilities || []).map((capability) => {
              const IconComponent = getCapabilityIcon(capability);
              return (
                <span
                  key={capability}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCapabilityColor(capability)}`}
                >
                  {typeof IconComponent === 'string' ? (
                    <span className="mr-1">{IconComponent}</span>
                  ) : (
                    <IconComponent className="h-3 w-3 mr-1" />
                  )}
                  {capability.replace('_', ' ')}
                </span>
              );
            })}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1" />
              {driver.distance.toFixed(1)} miles
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {driver.estimatedArrival} min ETA
            </div>
            <div className="flex items-center">
              <span className="mr-1">⭐</span>
              {driver.rating || 4.0}/5.0
            </div>
            <div className="flex items-center">
              <TruckIcon className="h-4 w-4 mr-1" />
              {driver.completedRides || 0} rides
            </div>
          </div>
        </div>

        {/* Selection Button */}
        {showSelection && (
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={onSelect}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSelected ? 'Selected' : 'Select'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverAvailabilityChecker;