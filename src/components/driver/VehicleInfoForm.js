import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';
import { validateStepCompletion, ONBOARDING_STEPS } from '../../services/driverService';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

const VehicleInfoForm = () => {
  const { 
    driverApplication, 
    updateStep, 
    goToNextStep, 
    goToPreviousStep,
    saving 
  } = useDriverOnboarding();
  
  const [validationErrors, setValidationErrors] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    defaultValues: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      vehicleType: '',
      numberOfSeats: '',
      features: [],
      condition: '',
      insuranceCompany: '',
      insurancePolicyNumber: '',
      insuranceExpiration: '',
      registrationState: '',
      registrationExpiration: ''
    }
  });

  // Pre-fill form with existing data
  useEffect(() => {
    if (driverApplication?.vehicleInfo) {
      const vehicleInfo = driverApplication.vehicleInfo;
      Object.keys(vehicleInfo).forEach(key => {
        if (key === 'features' && Array.isArray(vehicleInfo[key])) {
          setValue(key, vehicleInfo[key]);
        } else {
          setValue(key, vehicleInfo[key]);
        }
      });
    }
  }, [driverApplication, setValue]);

  // Vehicle makes data
  const vehicleMakes = [
    'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 
    'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 
    'Land Rover', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'MINI', 'Mitsubishi', 
    'Nissan', 'Pontiac', 'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
  ];

  const vehicleTypes = [
    { value: 'sedan', label: 'Sedan (4 doors)' },
    { value: 'suv', label: 'SUV/Crossover' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'coupe', label: 'Coupe (2 doors)' },
    { value: 'wagon', label: 'Wagon' },
    { value: 'pickup', label: 'Pickup Truck' },
    { value: 'van', label: 'Van/Minivan' },
    { value: 'convertible', label: 'Convertible' }
  ];

  const seatOptions = [
    { value: '4', label: '4 seats' },
    { value: '5', label: '5 seats' },
    { value: '6', label: '6 seats' },
    { value: '7', label: '7 seats' },
    { value: '8', label: '8+ seats' }
  ];

  const vehicleFeatures = [
    { value: 'ac', label: 'Air Conditioning' },
    { value: 'bluetooth', label: 'Bluetooth' },
    { value: 'gps', label: 'GPS Navigation' },
    { value: 'usb_charging', label: 'USB Charging Ports' },
    { value: 'wifi', label: 'Wi-Fi Hotspot' },
    { value: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
    { value: 'car_seats', label: 'Car Seats Available' },
    { value: 'premium_sound', label: 'Premium Sound System' },
    { value: 'leather_seats', label: 'Leather Seats' },
    { value: 'sunroof', label: 'Sunroof' }
  ];

  const vehicleConditions = [
    { value: 'excellent', label: 'Excellent - Like new' },
    { value: 'very_good', label: 'Very Good - Minor wear' },
    { value: 'good', label: 'Good - Some wear but well maintained' },
    { value: 'fair', label: 'Fair - Noticeable wear but functional' }
  ];

  const colors = [
    'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 
    'Gold', 'Yellow', 'Orange', 'Purple', 'Pink', 'Beige', 'Maroon', 'Other'
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 15; // Vehicle must be 15 years old or newer

  const onSubmit = async (data) => {
    setValidationErrors([]);

    // Validate required fields
    const validation = validateStepCompletion(ONBOARDING_STEPS.VEHICLE_INFO, data);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Additional custom validations
    const customErrors = [];
    
    // Validate vehicle year
    const vehicleYear = parseInt(data.year);
    if (vehicleYear < minYear || vehicleYear > currentYear) {
      customErrors.push(`Vehicle must be between ${minYear} and ${currentYear}`);
    }

    // Validate license plate format (basic validation)
    const licensePlateRegex = /^[A-Z0-9\s\-]{2,8}$/i;
    if (!licensePlateRegex.test(data.licensePlate)) {
      customErrors.push('Please enter a valid license plate number');
    }

    // Validate insurance expiration date
    const insuranceExpiration = new Date(data.insuranceExpiration);
    const today = new Date();
    if (insuranceExpiration <= today) {
      customErrors.push('Insurance must be valid for at least 30 days');
    }

    // Validate registration expiration date
    const registrationExpiration = new Date(data.registrationExpiration);
    if (registrationExpiration <= today) {
      customErrors.push('Vehicle registration must be current');
    }

    if (customErrors.length > 0) {
      setValidationErrors(customErrors);
      return;
    }

    // Save the data
    const result = await updateStep(ONBOARDING_STEPS.VEHICLE_INFO, data);
    
    if (result.success) {
      toast.success('Vehicle information saved successfully!');
      goToNextStep();
    }
  };

  const handleFeatureChange = (featureValue) => {
    const currentFeatures = watch('features') || [];
    const newFeatures = currentFeatures.includes(featureValue)
      ? currentFeatures.filter(f => f !== featureValue)
      : [...currentFeatures, featureValue];
    
    setValue('features', newFeatures);
  };

  const selectedFeatures = watch('features') || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Information</h1>
          <p className="text-gray-600">
            Tell us about your vehicle. This information helps us match you with appropriate ride requests.
          </p>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Please correct the following errors:
                </h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Vehicle Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Basic Vehicle Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Make <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('make', { required: 'Vehicle make is required' })}
                  className="input-field"
                >
                  <option value="">Select Make</option>
                  {vehicleMakes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
                {errors.make && (
                  <p className="text-sm text-red-600">{errors.make.message}</p>
                )}
              </div>

              <Input
                label="Model"
                type="text"
                required
                placeholder="e.g., Camry, Accord, Model 3"
                {...register('model', {
                  required: 'Vehicle model is required',
                  minLength: { value: 2, message: 'Model must be at least 2 characters' }
                })}
                error={errors.model?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('year', { required: 'Vehicle year is required' })}
                  className="input-field"
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: currentYear - minYear + 1 }, (_, i) => {
                    const year = currentYear - i;
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </select>
                {errors.year && (
                  <p className="text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Color <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('color', { required: 'Vehicle color is required' })}
                  className="input-field"
                >
                  <option value="">Select Color</option>
                  {colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
                {errors.color && (
                  <p className="text-sm text-red-600">{errors.color.message}</p>
                )}
              </div>

              <Input
                label="License Plate"
                type="text"
                required
                placeholder="ABC1234"
                {...register('licensePlate', {
                  required: 'License plate is required',
                  pattern: {
                    value: /^[A-Z0-9\s\-]{2,8}$/i,
                    message: 'Please enter a valid license plate'
                  }
                })}
                error={errors.licensePlate?.message}
              />
            </div>
          </div>

          {/* Vehicle Type and Capacity */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Vehicle Type & Capacity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('vehicleType', { required: 'Vehicle type is required' })}
                  className="input-field"
                >
                  <option value="">Select Vehicle Type</option>
                  {vehicleTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.vehicleType && (
                  <p className="text-sm text-red-600">{errors.vehicleType.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Number of Seats <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('numberOfSeats', { required: 'Number of seats is required' })}
                  className="input-field"
                >
                  <option value="">Select Seats</option>
                  {seatOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.numberOfSeats && (
                  <p className="text-sm text-red-600">{errors.numberOfSeats.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Vehicle Condition <span className="text-red-500">*</span>
              </label>
              <select
                {...register('condition', { required: 'Vehicle condition is required' })}
                className="input-field"
              >
                <option value="">Select Condition</option>
                {vehicleConditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
              {errors.condition && (
                <p className="text-sm text-red-600">{errors.condition.message}</p>
              )}
            </div>
          </div>

          {/* Vehicle Features */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Vehicle Features</h3>
            <p className="text-sm text-gray-600">Select all features that apply to your vehicle (optional)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicleFeatures.map(feature => (
                <label key={feature.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature.value)}
                    onChange={() => handleFeatureChange(feature.value)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Insurance Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Insurance Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Insurance Company"
                type="text"
                required
                placeholder="e.g., State Farm, Geico"
                {...register('insuranceCompany', {
                  required: 'Insurance company is required'
                })}
                error={errors.insuranceCompany?.message}
              />

              <Input
                label="Policy Number"
                type="text"
                required
                placeholder="Policy number"
                {...register('insurancePolicyNumber', {
                  required: 'Policy number is required'
                })}
                error={errors.insurancePolicyNumber?.message}
              />
            </div>

            <Input
              label="Insurance Expiration Date"
              type="date"
              required
              {...register('insuranceExpiration', {
                required: 'Insurance expiration date is required'
              })}
              error={errors.insuranceExpiration?.message}
            />
          </div>

          {/* Registration Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Registration Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Registration State <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('registrationState', { required: 'Registration state is required' })}
                  className="input-field"
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.registrationState && (
                  <p className="text-sm text-red-600">{errors.registrationState.message}</p>
                )}
              </div>

              <Input
                label="Registration Expiration Date"
                type="date"
                required
                {...register('registrationExpiration', {
                  required: 'Registration expiration date is required'
                })}
                error={errors.registrationExpiration?.message}
              />
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">📝 Important Notes</h3>
            <ul className="text-sm text-yellow-800 space-y-2">
              <li>• Vehicle must be {minYear} or newer to qualify</li>
              <li>• All vehicle information will be verified against uploaded documents</li>
              <li>• Insurance must be valid for at least 30 days</li>
              <li>• Vehicle registration must be current</li>
              <li>• Vehicle will be subject to periodic inspections</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={saving}
            >
              ← Previous Step
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={saving}
            >
              Save and Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleInfoForm; 