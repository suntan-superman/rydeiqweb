import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import scheduledRidesService from '../../services/scheduledRidesService';
import toast from 'react-hot-toast';

const ScheduleRideModal = ({ 
  isOpen, 
  onClose, 
  pickupLocation, 
  destinationLocation, 
  rideType = 'standard',
  onScheduleSuccess 
}) => {
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    rideType: rideType,
    specialRequests: [],
    paymentMethod: 'card',
    notes: '',
    recurringPattern: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [recurringOptions, setRecurringOptions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setFormData(prev => ({
        ...prev,
        scheduledDate: tomorrow.toISOString().split('T')[0],
        scheduledTime: '09:00'
      }));
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSpecialRequestToggle = (request) => {
    setFormData(prev => ({
      ...prev,
      specialRequests: prev.specialRequests.includes(request)
        ? prev.specialRequests.filter(r => r !== request)
        : [...prev.specialRequests, request]
    }));
  };

  const handleRecurringToggle = (pattern) => {
    setFormData(prev => ({
      ...prev,
      recurringPattern: prev.recurringPattern === pattern ? null : pattern
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.scheduledDate);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.scheduledDate = 'Date must be in the future';
      }
    }

    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Please select a time';
    }

    if (!pickupLocation) {
      newErrors.pickup = 'Pickup location is required';
    }

    if (!destinationLocation) {
      newErrors.destination = 'Destination location is required';
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

    setLoading(true);
    try {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      
      const rideData = {
        riderId: 'current-user-id', // This would come from auth context
        pickup: pickupLocation,
        destination: destinationLocation,
        scheduledDateTime,
        rideType: formData.rideType,
        specialRequests: formData.specialRequests,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        recurringPattern: formData.recurringPattern
      };

      const result = await scheduledRidesService.createScheduledRide(rideData);
      
      if (result.success) {
        toast.success('Ride scheduled successfully!');
        onScheduleSuccess?.(result.data);
        onClose();
      } else {
        toast.error(result.error || 'Failed to schedule ride');
      }
    } catch (error) {
      console.error('Error scheduling ride:', error);
      toast.error('Error scheduling ride');
    } finally {
      setLoading(false);
    }
  };

  const getMinimumDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaximumDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days in advance
    return maxDate.toISOString().split('T')[0];
  };

  const specialRequestOptions = [
    'Wheelchair accessible',
    'Pet friendly',
    'Child seat required',
    'Extra assistance',
    'Quiet ride',
    'Music preference'
  ];

  const recurringPatterns = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Your Ride</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                min={getMinimumDate()}
                max={getMaximumDate()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.scheduledDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.scheduledDate && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Time
              </label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.scheduledTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.scheduledTime && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduledTime}</p>
              )}
            </div>
          </div>

          {/* Ride Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ride Type
            </label>
            <select
              value={formData.rideType}
              onChange={(e) => handleInputChange('rideType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="medical">Medical Transport</option>
              <option value="wheelchair">Wheelchair Accessible</option>
              <option value="tow_truck">Tow Truck</option>
              <option value="companion_driver">Companion Driver</option>
            </select>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {specialRequestOptions.map((request) => (
                <label key={request} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.specialRequests.includes(request)}
                    onChange={() => handleSpecialRequestToggle(request)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{request}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Recurring Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recurring (Optional)
            </label>
            <div className="flex space-x-4">
              {recurringPatterns.map((pattern) => (
                <label key={pattern.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="recurring"
                    value={pattern.value}
                    checked={formData.recurringPattern === pattern.value}
                    onChange={() => handleRecurringToggle(pattern.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{pattern.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="card">Credit/Debit Card</option>
              <option value="paypal">PayPal</option>
              <option value="apple_pay">Apple Pay</option>
              <option value="google_pay">Google Pay</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Any special instructions or requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Location Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Trip Summary</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2 text-green-600" />
                <span>From: {pickupLocation?.address || 'Pickup location'}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2 text-red-600" />
                <span>To: {destinationLocation?.address || 'Destination location'}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-blue-600" />
                <span>
                  Scheduled for: {formData.scheduledDate && formData.scheduledTime 
                    ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString()
                    : 'Select date and time'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {errors.pickup && (
            <p className="text-sm text-red-600">{errors.pickup}</p>
          )}
          {errors.destination && (
            <p className="text-sm text-red-600">{errors.destination}</p>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : 'Schedule Ride'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleRideModal;
