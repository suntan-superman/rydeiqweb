
import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useDriverOnboarding } from '../../contexts/DriverOnboardingContext';
// eslint-disable-next-line
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
    saving,
    ONBOARDING_STEPS 
  } = useDriverOnboarding();

  const [validationErrors, setValidationErrors] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedSpecialtyType, setSelectedSpecialtyType] = useState('');
  const [selectedServiceCapabilities, setSelectedServiceCapabilities] = useState([]);
  const [certificationFiles, setCertificationFiles] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control
  } = useForm({
    mode: 'onChange'
  });

  // Watch all form values for validation
  const watchedValues = useWatch({ control });
  
  // Check if all required fields are filled
  const isFormValid = () => {
    const requiredFields = [
      'make', 'model', 'year', 'color', 'licensePlate', 'vin',
      'vehicleType', 'numberOfSeats', 'condition',
      'insuranceCompany', 'insurancePolicyNumber', 'insuranceExpiration',
      'registrationState', 'registrationExpiration'
    ];
    
    return requiredFields.every(field => {
      const value = watchedValues[field];
      return value && value.toString().trim() !== '';
    });
  };

  // Initialize form with saved data from database
  useEffect(() => {
    if (driverApplication) {
      const savedData = driverApplication[ONBOARDING_STEPS.VEHICLE_INFO] || driverApplication.vehicleInfo || {};
      if (savedData && Object.keys(savedData).length > 0) {
        console.log('VehicleInfoForm: Loading saved data:', savedData);
        Object.keys(savedData).forEach(key => {
          setValue(key, savedData[key]);
        });
        // Set selected features
        if (savedData.features) {
          setSelectedFeatures(savedData.features);
        }
        // Set specialty vehicle type
        if (savedData.specialtyVehicleType) {
          setSelectedSpecialtyType(savedData.specialtyVehicleType);
        }
        // Set service capabilities
        if (savedData.serviceCapabilities) {
          setSelectedServiceCapabilities(savedData.serviceCapabilities);
        }
        // Set certification files
        if (savedData.certificationFiles) {
          setCertificationFiles(savedData.certificationFiles);
        }
      }
    }
  }, [driverApplication, setValue, ONBOARDING_STEPS.VEHICLE_INFO]);

  // Keep form data when component unmounts (data is saved to database)
  // No cleanup needed since we want to retain the data

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

  // Specialty Vehicle Types for AnyRyde
  const specialtyVehicleTypes = [
    { value: 'standard', label: '🚘 Standard Car (1–4 passengers)', description: 'Regular passenger vehicle' },
    { value: 'large', label: '🚐 Large Vehicle (5+ passengers / Van / SUV)', description: 'For group transportation' },
    { value: 'tow_truck', label: '🚛 Tow Truck', description: 'For vehicle transport and towing' },
    { value: 'wheelchair_accessible', label: '♿ Wheelchair-Accessible Vehicle', description: 'ADA compliant vehicle' },
    { value: 'taxi_metered', label: '🚖 Taxi-Style Metered Vehicle', description: 'For licensed taxi providers' }
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

  // Service Capabilities for AnyRyde
  const serviceCapabilities = [
    { 
      value: 'video_enabled', 
      label: '🎥 Video-Enabled Ride', 
      description: 'Dashcam installed for ride recording',
      requiresApproval: false
    },
    { 
      value: 'paired_driver', 
      label: '👥 Paired Driver Available', 
      description: 'Ride-along driver option',
      requiresApproval: false
    },
    { 
      value: 'medical_transport', 
      label: '🏥 Medical Transport Certified', 
      description: 'Certified for medical transportation',
      requiresApproval: true
    },
    { 
      value: 'wheelchair_accessible', 
      label: '♿ Wheelchair Accessible', 
      description: 'Vehicle equipped with wheelchair ramp/lift',
      requiresApproval: true
    },
    { 
      value: 'oxygen_equipped', 
      label: '🫁 Oxygen Support Equipment', 
      description: 'Vehicle equipped with oxygen support systems',
      requiresApproval: true
    },
    { 
      value: 'stretcher_equipped', 
      label: '🏥 Stretcher Transport', 
      description: 'Vehicle equipped for stretcher transport',
      requiresApproval: true
    },
    { 
      value: 'assistance_available', 
      label: '🤝 Physical Assistance Available', 
      description: 'Driver provides physical assistance to passengers',
      requiresApproval: false
    },
    { 
      value: 'pet_friendly', 
      label: '🐶 Pet-Friendly Vehicle', 
      description: 'Suitable for pets and service animals',
      requiresApproval: false
    },
    { 
      value: 'car_seat_infant', 
      label: '👶 Infant Car Seat Available', 
      description: 'Rear-facing infant car seat',
      requiresApproval: false
    },
    { 
      value: 'car_seat_toddler', 
      label: '👶 Toddler Car Seat Available', 
      description: 'Forward-facing toddler car seat',
      requiresApproval: false
    },
    { 
      value: 'car_seat_booster', 
      label: '👶 Booster Seat Available', 
      description: 'Booster seat for older children',
      requiresApproval: false
    }
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

    // Add selected features and specialty vehicle data to the form data
    const formData = {
      ...data,
      features: selectedFeatures,
      specialtyVehicleType: selectedSpecialtyType,
      serviceCapabilities: selectedServiceCapabilities,
      certificationFiles: certificationFiles
    };

    // Validate required fields
    const validation = validateStepCompletion(ONBOARDING_STEPS.VEHICLE_INFO, formData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Additional custom validations
    const customErrors = [];
    
    // Validate specialty vehicle type selection
    if (!selectedSpecialtyType) {
      customErrors.push('Please select a specialty vehicle type');
    }
    
    // Validate service capabilities for specialty vehicles
    if (selectedSpecialtyType === 'wheelchair_accessible' && !selectedServiceCapabilities.includes('wheelchair_accessible')) {
      customErrors.push('Wheelchair-accessible vehicles must have wheelchair accessibility capability');
    }
    
    // Validate medical transport certification
    if (selectedServiceCapabilities.includes('medical_transport') && !certificationFiles.medical_transport) {
      customErrors.push('Medical transport certification document is required');
    }
    
    // Validate vehicle year
    const vehicleYear = parseInt(formData.year);
    if (vehicleYear < minYear || vehicleYear > currentYear) {
      customErrors.push(`Vehicle must be between ${minYear} and ${currentYear}`);
    }

    // Validate license plate format (basic validation)
    const licensePlateRegex = /^[A-Z0-9\s-]{2,8}$/i;
    if (!licensePlateRegex.test(formData.licensePlate)) {
      customErrors.push('Please enter a valid license plate number');
    }

    // Validate VIN format (17 characters, no I, O, Q)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    if (!vinRegex.test(formData.vin)) {
      customErrors.push('Please enter a valid 17-character VIN');
    }

    // Validate insurance expiration date
    const insuranceExpiration = new Date(formData.insuranceExpiration);
    const today = new Date();
    if (insuranceExpiration <= today) {
      customErrors.push('Insurance must be valid for at least 30 days');
    }

    // Validate registration expiration date
    const registrationExpiration = new Date(formData.registrationExpiration);
    if (registrationExpiration <= today) {
      customErrors.push('Vehicle registration must be current');
    }

    if (customErrors.length > 0) {
      setValidationErrors(customErrors);
      return;
    }

    // Save the data
    console.log('VehicleInfoForm: Submitting vehicle data:', formData);
    console.log('VehicleInfoForm: Step name:', ONBOARDING_STEPS.VEHICLE_INFO);
    
    const result = await updateStep(ONBOARDING_STEPS.VEHICLE_INFO, formData);
    
    console.log('VehicleInfoForm: Update result:', result);
    
    if (result.success) {
      toast.success('Vehicle information saved successfully!');
      goToNextStep();
    } else {
      console.error('VehicleInfoForm: Failed to save vehicle data:', result.error);
      toast.error('Failed to save vehicle information');
    }
  };

  const handleFeatureChange = (featureValue) => {
    const currentFeatures = selectedFeatures;
    const newFeatures = currentFeatures.includes(featureValue)
      ? currentFeatures.filter(f => f !== featureValue)
      : [...currentFeatures, featureValue];
    
    setSelectedFeatures(newFeatures);
  };

  const handleSpecialtyTypeChange = (typeValue) => {
    setSelectedSpecialtyType(typeValue);
  };

  const handleServiceCapabilityChange = (capabilityValue) => {
    const currentCapabilities = selectedServiceCapabilities;
    const newCapabilities = currentCapabilities.includes(capabilityValue)
      ? currentCapabilities.filter(c => c !== capabilityValue)
      : [...currentCapabilities, capabilityValue];
    
    setSelectedServiceCapabilities(newCapabilities);
  };

  const handleCertificationFileChange = (capabilityType, file) => {
    setCertificationFiles(prev => ({
      ...prev,
      [capabilityType]: file
    }));
  };

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
                    value: /^[A-Z0-9\s-]{2,8}$/i,
                    message: 'Please enter a valid license plate'
                  }
                })}
                error={errors.licensePlate?.message}
              />
            </div>
            
            <div className="space-y-1">
              <Input
                label="VIN (Vehicle Identification Number)"
                type="text"
                required
                placeholder="1HGBH41JXMN109186"
                {...register('vin', {
                  required: 'VIN is required',
                  pattern: {
                    value: /^[A-HJ-NPR-Z0-9]{17}$/i,
                    message: 'Please enter a valid 17-character VIN'
                  }
                })}
                error={errors.vin?.message}
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

          {/* Specialty Vehicle Type Selection */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Specialty Vehicle Type</h3>
            <p className="text-sm text-gray-600">
              Select the type of specialty vehicle you operate. This determines what types of ride requests you'll receive.
            </p>
            
            <div className="space-y-4">
              {specialtyVehicleTypes.map(type => (
                <label key={type.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="specialtyVehicleType"
                    value={type.value}
                    checked={selectedSpecialtyType === type.value}
                    onChange={() => handleSpecialtyTypeChange(type.value)}
                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500 mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Service Capabilities */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Service Capabilities</h3>
            <p className="text-sm text-gray-600">
              Select all service capabilities you can provide. Some capabilities require certification and approval.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceCapabilities.map(capability => (
                <div key={capability.value} className="border border-gray-200 rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedServiceCapabilities.includes(capability.value)}
                      onChange={() => handleServiceCapabilityChange(capability.value)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{capability.label}</div>
                      <div className="text-sm text-gray-600">{capability.description}</div>
                      {capability.requiresApproval && (
                        <div className="text-xs text-amber-600 mt-1">
                          ⚠️ Requires certification and approval
                        </div>
                      )}
                    </div>
                  </label>
                  
                  {/* Certification upload for medical transport */}
                  {capability.value === 'medical_transport' && selectedServiceCapabilities.includes(capability.value) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medical Transport Certification
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleCertificationFileChange('medical_transport', e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload your medical transport certification document
                      </p>
                    </div>
                  )}
                </div>
              ))}
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
              <li>• Specialty vehicle capabilities will be verified during inspection</li>
              <li>• Medical transport certification requires manual approval</li>
              <li>• Wheelchair-accessible vehicles must meet ADA compliance standards</li>
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
              disabled={!isFormValid() || saving}
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