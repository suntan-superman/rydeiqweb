import React, { useState, useEffect } from 'react';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const AvailabilityForm = () => {
  const {
    driverApplication,
    updateStep,
    goToNextStep,
    goToPreviousStep,
    saving,
    ONBOARDING_STEPS
  } = useDriverOnboarding();

  const [formData, setFormData] = useState({
    // Weekly Schedule
    weeklySchedule: {
      monday: { enabled: false, startTime: '09:00', endTime: '17:00' },
      tuesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
      wednesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
      thursday: { enabled: false, startTime: '09:00', endTime: '17:00' },
      friday: { enabled: false, startTime: '09:00', endTime: '17:00' },
      saturday: { enabled: false, startTime: '10:00', endTime: '18:00' },
      sunday: { enabled: false, startTime: '10:00', endTime: '18:00' }
    },
    
    // Coverage Area
    primaryServiceArea: '',
    serviceRadius: '15', // miles
    preferredZones: [],
    airportService: false,
    longDistanceService: false,
    maxTripDuration: '120', // minutes
    
    // Availability Preferences
    preferPeakHours: false,
    weekendAvailability: false,
    holidayAvailability: false,
    eveningAvailability: false,
    earlyMorningAvailability: false,
    
    // Notification Settings
    notificationMethod: 'app', // 'app', 'sms', 'both'
    responseTimeLimit: '60', // seconds
    autoAcceptRides: false,
    autoAcceptRadius: '5', // miles
    
    // Break Preferences
    enableBreaks: false,
    breakDuration: '30', // minutes
    breakFrequency: '4', // hours
    
    // Ride Type Preferences
    preferredRideTypes: [], // 'standard', 'premium', 'shared', 'xl'
    minimumRideDistance: '1', // miles
    minimumRideFare: '5', // dollars
    
    // Special Services
    wheelchairAccessible: false,
    petFriendly: false,
    childSeatAvailable: false,
    luxuryVehicle: false,
    
    // Emergency Contact
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [formInitialized, setFormInitialized] = useState(false);

  // Initialize form with empty data (no pre-filling for security)
  useEffect(() => {
    if (!formInitialized && driverApplication) {
      // Do NOT pre-fill any availability data from database
      // This prevents data leakage between users
      setFormInitialized(true);
    }
  }, [driverApplication, formInitialized]);

  // Clear form when component unmounts or user changes
  useEffect(() => {
    return () => {
      // Clear all form data on unmount
      setFormData({
        // Weekly Schedule
        weeklySchedule: {
          monday: { enabled: false, startTime: '09:00', endTime: '17:00' },
          tuesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
          wednesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
          thursday: { enabled: false, startTime: '09:00', endTime: '17:00' },
          friday: { enabled: false, startTime: '09:00', endTime: '17:00' },
          saturday: { enabled: false, startTime: '10:00', endTime: '18:00' },
          sunday: { enabled: false, startTime: '10:00', endTime: '18:00' }
        },
        
        // Coverage Area
        primaryServiceArea: '',
        serviceRadius: '15',
        preferredZones: [],
        airportService: false,
        longDistanceService: false,
        maxTripDuration: '120',
        
        // Availability Preferences
        preferPeakHours: false,
        weekendAvailability: false,
        holidayAvailability: false,
        eveningAvailability: false,
        earlyMorningAvailability: false,
        
        // Notification Settings
        notificationMethod: 'app',
        responseTimeLimit: '60',
        autoAcceptRides: false,
        autoAcceptRadius: '5',
        
        // Break Preferences
        enableBreaks: false,
        breakDuration: '30',
        breakFrequency: '4',
        
        // Ride Type Preferences
        preferredRideTypes: [],
        minimumRideDistance: '1',
        minimumRideFare: '5',
        
        // Special Services
        wheelchairAccessible: false,
        petFriendly: false,
        childSeatAvailable: false,
        luxuryVehicle: false,
        
        // Emergency Contact
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        }
      });
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (weeklySchedule)
      const [parent, child, property] = name.split('.');
      if (property) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [property]: type === 'checkbox' ? checked : value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Check if at least one day is enabled
    const enabledDays = Object.values(formData.weeklySchedule).filter(day => day.enabled);
    if (enabledDays.length === 0) {
      newErrors.weeklySchedule = 'Please select at least one day of availability';
    }

    // Validate time slots for enabled days
    Object.entries(formData.weeklySchedule).forEach(([day, schedule]) => {
      if (schedule.enabled) {
        if (schedule.startTime >= schedule.endTime) {
          newErrors[`${day}Time`] = `${day} start time must be before end time`;
        }
      }
    });

    // Coverage area validation
    if (!formData.primaryServiceArea.trim()) {
      newErrors.primaryServiceArea = 'Primary service area is required';
    }

    const radius = parseFloat(formData.serviceRadius);
    if (!formData.serviceRadius || radius < 1 || radius > 100) {
      newErrors.serviceRadius = 'Service radius must be between 1 and 100 miles';
    }

    // Trip duration validation
    const duration = parseFloat(formData.maxTripDuration);
    if (!formData.maxTripDuration || duration < 15 || duration > 480) {
      newErrors.maxTripDuration = 'Max trip duration must be between 15 and 480 minutes';
    }

    // Response time validation
    const responseTime = parseFloat(formData.responseTimeLimit);
    if (!formData.responseTimeLimit || responseTime < 15 || responseTime > 300) {
      newErrors.responseTimeLimit = 'Response time must be between 15 and 300 seconds';
    }

    // Auto-accept radius validation
    if (formData.autoAcceptRides) {
      const autoRadius = parseFloat(formData.autoAcceptRadius);
      if (!formData.autoAcceptRadius || autoRadius < 1 || autoRadius > 50) {
        newErrors.autoAcceptRadius = 'Auto-accept radius must be between 1 and 50 miles';
      }
    }

    // Minimum ride validation
    const minDistance = parseFloat(formData.minimumRideDistance);
    if (!formData.minimumRideDistance || minDistance < 0.5 || minDistance > 50) {
      newErrors.minimumRideDistance = 'Minimum ride distance must be between 0.5 and 50 miles';
    }

    const minFare = parseFloat(formData.minimumRideFare);
    if (!formData.minimumRideFare || minFare < 2 || minFare > 100) {
      newErrors.minimumRideFare = 'Minimum ride fare must be between $2 and $100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors below');
      return;
    }

    const result = await updateStep(ONBOARDING_STEPS.AVAILABILITY, formData);
    
    if (result.success) {
      goToNextStep();
    }
  };

  const getErrorMessage = (fieldName) => {
    return errors[fieldName];
  };

  const copyTimeToAllDays = (day) => {
    const { startTime, endTime } = formData.weeklySchedule[day];
    const updatedSchedule = {};
    
    Object.keys(formData.weeklySchedule).forEach(dayName => {
      updatedSchedule[dayName] = {
        ...formData.weeklySchedule[dayName],
        startTime,
        endTime
      };
    });
    
    setFormData(prev => ({
      ...prev,
      weeklySchedule: updatedSchedule
    }));
  };

  const toggleAllDays = (enabled) => {
    const updatedSchedule = {};
    
    Object.keys(formData.weeklySchedule).forEach(dayName => {
      updatedSchedule[dayName] = {
        ...formData.weeklySchedule[dayName],
        enabled
      };
    });
    
    setFormData(prev => ({
      ...prev,
      weeklySchedule: updatedSchedule
    }));
  };

  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  const rideTypes = [
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' },
    { value: 'shared', label: 'Shared/Pool' },
    { value: 'xl', label: 'XL/Large Groups' }
  ];

  const zoneOptions = [
    'Downtown', 'Airport', 'Business District', 'University Area', 
    'Shopping Centers', 'Residential Areas', 'Tourist Attractions', 
    'Medical Centers', 'Transportation Hubs'
  ];

  if (saving) {
    return <LoadingSpinner message="Saving availability settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Availability Settings</h1>
          <p className="text-gray-600">
            Set your schedule and preferences for receiving ride requests. You can modify these settings anytime in your driver dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Weekly Schedule */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
              <div className="space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleAllDays(true)}
                >
                  Enable All
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleAllDays(false)}
                >
                  Disable All
                </Button>
              </div>
            </div>
            
            {getErrorMessage('weeklySchedule') && (
              <p className="text-red-500 text-sm mb-4">{getErrorMessage('weeklySchedule')}</p>
            )}
            
            <div className="space-y-4">
              {Object.entries(formData.weeklySchedule).map(([day, schedule]) => (
                <div key={day} className="flex items-center space-x-4 p-4 bg-white rounded-md border">
                  <label className="flex items-center space-x-3 w-32">
                    <input
                      type="checkbox"
                      name={`weeklySchedule.${day}.enabled`}
                      checked={schedule.enabled}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{dayNames[day]}</span>
                  </label>
                  
                  {schedule.enabled && (
                    <>
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          name={`weeklySchedule.${day}.startTime`}
                          value={schedule.startTime}
                          onChange={handleInputChange}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          name={`weeklySchedule.${day}.endTime`}
                          value={schedule.endTime}
                          onChange={handleInputChange}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyTimeToAllDays(day)}
                        >
                          Copy to All
                        </Button>
                      </div>
                      {getErrorMessage(`${day}Time`) && (
                        <p className="text-red-500 text-sm">{getErrorMessage(`${day}Time`)}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coverage Area */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Area</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Primary Service Area *"
                  name="primaryServiceArea"
                  value={formData.primaryServiceArea}
                  onChange={handleInputChange}
                  placeholder="City or main service area"
                  error={getErrorMessage('primaryServiceArea')}
                />
              </div>
              
              <div>
                <Input
                  label="Service Radius (miles) *"
                  name="serviceRadius"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.serviceRadius}
                  onChange={handleInputChange}
                  placeholder="15"
                  error={getErrorMessage('serviceRadius')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum distance you're willing to travel for pickups
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Zones (Optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {zoneOptions.map(zone => (
                    <label key={zone} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.preferredZones.includes(zone)}
                        onChange={() => handleMultiSelect('preferredZones', zone)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{zone}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trip Preferences */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Maximum Trip Duration (minutes) *"
                  name="maxTripDuration"
                  type="number"
                  min="15"
                  max="480"
                  value={formData.maxTripDuration}
                  onChange={handleInputChange}
                  placeholder="120"
                  error={getErrorMessage('maxTripDuration')}
                />
              </div>
              
              <div>
                <Input
                  label="Minimum Ride Distance (miles) *"
                  name="minimumRideDistance"
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={formData.minimumRideDistance}
                  onChange={handleInputChange}
                  placeholder="1"
                  error={getErrorMessage('minimumRideDistance')}
                />
              </div>
              
              <div>
                <Input
                  label="Minimum Ride Fare ($) *"
                  name="minimumRideFare"
                  type="number"
                  min="2"
                  max="100"
                  value={formData.minimumRideFare}
                  onChange={handleInputChange}
                  placeholder="5"
                  error={getErrorMessage('minimumRideFare')}
                />
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="airportService"
                    checked={formData.airportService}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Accept airport rides</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="longDistanceService"
                    checked={formData.longDistanceService}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Accept long-distance trips (45+ minutes)</span>
                </label>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Ride Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {rideTypes.map(type => (
                  <label key={type.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferredRideTypes.includes(type.value)}
                      onChange={() => handleMultiSelect('preferredRideTypes', type.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How to receive ride requests *
                </label>
                <select
                  name="notificationMethod"
                  value={formData.notificationMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="app">App notifications only</option>
                  <option value="sms">SMS text messages only</option>
                  <option value="both">Both app and SMS</option>
                </select>
              </div>
              
              <div>
                <Input
                  label="Response Time Limit (seconds) *"
                  name="responseTimeLimit"
                  type="number"
                  min="15"
                  max="300"
                  value={formData.responseTimeLimit}
                  onChange={handleInputChange}
                  placeholder="60"
                  error={getErrorMessage('responseTimeLimit')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time to respond to ride requests before they expire
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    name="autoAcceptRides"
                    checked={formData.autoAcceptRides}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Auto-accept rides within specified radius</span>
                </label>
                
                {formData.autoAcceptRides && (
                  <div className="ml-6">
                    <Input
                      label="Auto-accept Radius (miles) *"
                      name="autoAcceptRadius"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.autoAcceptRadius}
                      onChange={handleInputChange}
                      placeholder="5"
                      error={getErrorMessage('autoAcceptRadius')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Special Services */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Services</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="wheelchairAccessible"
                  checked={formData.wheelchairAccessible}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Wheelchair accessible vehicle</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="petFriendly"
                  checked={formData.petFriendly}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Pet-friendly rides</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="childSeatAvailable"
                  checked={formData.childSeatAvailable}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Child seat available</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="luxuryVehicle"
                  checked={formData.luxuryVehicle}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Luxury vehicle</span>
              </label>
            </div>
          </div>

          {/* Availability Preferences */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="preferPeakHours"
                  checked={formData.preferPeakHours}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Prefer peak hours (higher earnings)</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="weekendAvailability"
                  checked={formData.weekendAvailability}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Available on weekends</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="holidayAvailability"
                  checked={formData.holidayAvailability}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Available on holidays</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="eveningAvailability"
                  checked={formData.eveningAvailability}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Available for evening rides (6 PM - 12 AM)</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="earlyMorningAvailability"
                  checked={formData.earlyMorningAvailability}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Available for early morning rides (5 AM - 9 AM)</span>
              </label>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button 
              type="button"
              variant="outline" 
              onClick={goToPreviousStep}
              disabled={saving}
            >
              Previous Step
            </Button>
            
            <Button 
              type="submit"
              variant="primary"
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvailabilityForm; 