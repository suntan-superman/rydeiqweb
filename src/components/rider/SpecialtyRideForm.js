import React, { useState } from 'react';
import { 
  TruckIcon, 
  UserGroupIcon, 
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Input from '../common/Input';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const SpecialtyRideForm = ({ rideType, onFormSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    // Tow truck specific
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: '',
    towingDestination: '',
    vehicleCondition: 'running', // running, not_running, damaged
    specialInstructions: '',
    
    // Companion driver specific
    reasonForCompanion: '',
    securityLevel: 'standard', // standard, high, maximum
    specialRequirements: '',
    advanceBooking: false,
    estimatedDuration: '',
    
    // Medical specific
    medicalCondition: '',
    appointmentType: '',
    specialEquipment: [],
    emergencyContact: '',
    medicalNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCheckboxChange = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (rideType === 'tow_truck') {
      if (!formData.vehicleMake) newErrors.vehicleMake = 'Vehicle make is required';
      if (!formData.vehicleModel) newErrors.vehicleModel = 'Vehicle model is required';
      if (!formData.vehicleYear) newErrors.vehicleYear = 'Vehicle year is required';
      if (!formData.licensePlate) newErrors.licensePlate = 'License plate is required';
      if (!formData.towingDestination) newErrors.towingDestination = 'Towing destination is required';
    }

    if (rideType === 'companion_driver') {
      if (!formData.reasonForCompanion) newErrors.reasonForCompanion = 'Reason for companion driver is required';
      if (!formData.estimatedDuration) newErrors.estimatedDuration = 'Estimated duration is required';
    }

    if (rideType === 'medical') {
      if (!formData.medicalCondition) newErrors.medicalCondition = 'Medical condition is required';
      if (!formData.appointmentType) newErrors.appointmentType = 'Appointment type is required';
      if (!formData.emergencyContact) newErrors.emergencyContact = 'Emergency contact is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onFormSubmit(formData);
      toast.success('Specialty ride request submitted successfully');
    } catch (error) {
      console.error('Error submitting specialty ride:', error);
      toast.error('Failed to submit specialty ride request');
    } finally {
      setLoading(false);
    }
  };

  const getRideTypeConfig = () => {
    switch (rideType) {
      case 'tow_truck':
        return {
          title: 'Tow Truck Service',
          icon: <TruckIcon className="h-8 w-8 text-orange-600" />,
          description: 'Professional towing services for your vehicle',
          color: 'orange'
        };
      case 'companion_driver':
        return {
          title: 'Companion Driver Service',
          icon: <UserGroupIcon className="h-8 w-8 text-blue-600" />,
          description: 'Two drivers for enhanced safety and assistance',
          color: 'blue'
        };
      case 'medical':
        return {
          title: 'Medical Transportation',
          icon: <ShieldCheckIcon className="h-8 w-8 text-red-600" />,
          description: 'Specialized medical transportation with trained drivers',
          color: 'red'
        };
      default:
        return {
          title: 'Specialty Ride',
          icon: <ExclamationTriangleIcon className="h-8 w-8 text-gray-600" />,
          description: 'Special transportation service',
          color: 'gray'
        };
    }
  };

  const config = getRideTypeConfig();

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className={`p-3 bg-${config.color}-100 rounded-lg`}>
          {config.icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
          <p className="text-gray-600">{config.description}</p>
        </div>
      </div>

      {/* Special Requirements Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-1" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Special Requirements</h3>
            <p className="text-sm text-yellow-700 mt-1">
              {rideType === 'tow_truck' && 'Tow truck services require vehicle information and towing destination. Payment is typically required upfront.'}
              {rideType === 'companion_driver' && 'Companion driver services require special reason and may need advance booking. Security clearance may be required.'}
              {rideType === 'medical' && 'Medical transportation requires medical documentation and special needs assessment. HIPAA compliance is maintained.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tow Truck Form */}
        {rideType === 'tow_truck' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vehicle Make *"
                value={formData.vehicleMake}
                onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
                error={errors.vehicleMake}
                placeholder="e.g., Toyota, Ford, Honda"
              />
              <Input
                label="Vehicle Model *"
                value={formData.vehicleModel}
                onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                error={errors.vehicleModel}
                placeholder="e.g., Camry, F-150, Civic"
              />
              <Input
                label="Vehicle Year *"
                type="number"
                value={formData.vehicleYear}
                onChange={(e) => handleInputChange('vehicleYear', e.target.value)}
                error={errors.vehicleYear}
                placeholder="e.g., 2020"
                min="1990"
                max="2024"
              />
              <Input
                label="Vehicle Color"
                value={formData.vehicleColor}
                onChange={(e) => handleInputChange('vehicleColor', e.target.value)}
                placeholder="e.g., Red, Blue, Silver"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="License Plate *"
                value={formData.licensePlate}
                onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                error={errors.licensePlate}
                placeholder="e.g., ABC123"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Condition *
                </label>
                <select
                  value={formData.vehicleCondition}
                  onChange={(e) => handleInputChange('vehicleCondition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="running">Running (can be driven)</option>
                  <option value="not_running">Not Running (needs towing)</option>
                  <option value="damaged">Damaged (accident/breakdown)</option>
                </select>
              </div>
            </div>

            <Input
              label="Towing Destination *"
              value={formData.towingDestination}
              onChange={(e) => handleInputChange('towingDestination', e.target.value)}
              error={errors.towingDestination}
              placeholder="Where should the vehicle be towed?"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Any special instructions for the tow truck operator..."
              />
            </div>
          </div>
        )}

        {/* Companion Driver Form */}
        {rideType === 'companion_driver' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Companion Driver Requirements</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Companion Driver *
              </label>
              <select
                value={formData.reasonForCompanion}
                onChange={(e) => handleInputChange('reasonForCompanion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason</option>
                <option value="high_value_transport">High-value transport</option>
                <option value="safety_concerns">Safety concerns</option>
                <option value="special_needs">Special needs assistance</option>
                <option value="long_distance">Long distance travel</option>
                <option value="night_travel">Night time travel</option>
                <option value="other">Other (specify in notes)</option>
              </select>
              {errors.reasonForCompanion && (
                <p className="mt-1 text-sm text-red-600">{errors.reasonForCompanion}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Level
                </label>
                <select
                  value={formData.securityLevel}
                  onChange={(e) => handleInputChange('securityLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="high">High Security</option>
                  <option value="maximum">Maximum Security</option>
                </select>
              </div>
              <Input
                label="Estimated Duration *"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                error={errors.estimatedDuration}
                placeholder="e.g., 2 hours, 1 day"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements
              </label>
              <textarea
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requirements for the companion drivers..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="advanceBooking"
                checked={formData.advanceBooking}
                onChange={(e) => handleCheckboxChange('advanceBooking', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="advanceBooking" className="ml-2 block text-sm text-gray-700">
                This requires advance booking (24+ hours notice)
              </label>
            </div>
          </div>
        )}

        {/* Medical Transport Form */}
        {rideType === 'medical' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Medical Condition *"
                value={formData.medicalCondition}
                onChange={(e) => handleInputChange('medicalCondition', e.target.value)}
                error={errors.medicalCondition}
                placeholder="e.g., Mobility issues, Dialysis, Surgery"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type *
                </label>
                <select
                  value={formData.appointmentType}
                  onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select appointment type</option>
                  <option value="dialysis">Dialysis</option>
                  <option value="chemotherapy">Chemotherapy</option>
                  <option value="surgery">Surgery</option>
                  <option value="physical_therapy">Physical Therapy</option>
                  <option value="mental_health">Mental Health</option>
                  <option value="routine_checkup">Routine Checkup</option>
                  <option value="emergency">Emergency</option>
                </select>
                {errors.appointmentType && (
                  <p className="mt-1 text-sm text-red-600">{errors.appointmentType}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Equipment Needed
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Wheelchair', 'Oxygen', 'Stretcher', 'Medical monitoring', 'Emergency equipment', 'Companion seat'].map((equipment) => (
                  <label key={equipment} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specialEquipment.includes(equipment)}
                      onChange={(e) => handleArrayChange('specialEquipment', equipment, e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{equipment}</span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Emergency Contact *"
              value={formData.emergencyContact}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              error={errors.emergencyContact}
              placeholder="Emergency contact name and phone number"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Notes
              </label>
              <textarea
                value={formData.medicalNotes}
                onChange={(e) => handleInputChange('medicalNotes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Any additional medical information or special instructions..."
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SpecialtyRideForm;
