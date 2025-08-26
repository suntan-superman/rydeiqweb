import React, { useState } from 'react';
import { 
  CalendarDaysIcon,
  ArrowPathIcon,
  PlusIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

const AdvancedScheduling = ({ user }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [scheduleForm, setScheduleForm] = useState({
    patientId: '',
    appointmentType: 'Dialysis',
    pickupLocation: '',
    dropoffLocation: '',
    appointmentTime: '',
    bufferTime: '15',
    recurrencePattern: 'none',
    recurrenceDetails: {
      frequency: 'weekly',
      daysOfWeek: [],
      endDate: ''
    }
  });

  const appointmentTypes = [
    'Dialysis',
    'Chemotherapy',
    'Physical Therapy',
    'Medical Appointment',
    'Mental Health',
    'Surgery',
    'Follow-up'
  ];

  const bufferOptions = [
    { value: '10', label: '10 minutes early' },
    { value: '15', label: '15 minutes early' },
    { value: '20', label: '20 minutes early' },
    { value: '30', label: '30 minutes early' }
  ];

  const recurringTemplates = [
    {
      id: 'dialysis',
      name: 'Dialysis Treatment',
      description: 'Monday, Wednesday, Friday at same time',
      pattern: 'weekly',
      days: ['monday', 'wednesday', 'friday'],
      duration: '4 hours',
      bufferTime: '15'
    },
    {
      id: 'physical_therapy',
      name: 'Physical Therapy',
      description: 'Twice weekly for 8 weeks',
      pattern: 'weekly',
      days: ['tuesday', 'thursday'],
      duration: '1 hour',
      bufferTime: '10'
    },
    {
      id: 'chemotherapy',
      name: 'Chemotherapy',
      description: 'Every 3 weeks',
      pattern: 'custom',
      days: [],
      duration: '6 hours',
      bufferTime: '30'
    }
  ];

  const scheduledRides = [
    {
      id: '1',
      patientId: 'P001',
      appointmentType: 'Dialysis',
      date: '2024-01-15',
      time: '08:00',
      pickup: 'Sunrise Assisted Living',
      dropoff: 'Kern Medical Dialysis Center',
      status: 'scheduled',
      isRecurring: true,
      nextOccurrence: '2024-01-17'
    },
    {
      id: '2',
      patientId: 'P002',
      appointmentType: 'Physical Therapy',
      date: '2024-01-16',
      time: '14:30',
      pickup: '1234 Oak Street',
      dropoff: 'Central Valley Rehab',
      status: 'scheduled',
      isRecurring: true,
      nextOccurrence: '2024-01-18'
    }
  ];

  const handleInputChange = (field, value, nested = null) => {
    if (nested) {
      setScheduleForm(prev => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value
        }
      }));
    } else {
      setScheduleForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleDayToggle = (day) => {
    const currentDays = scheduleForm.recurrenceDetails.daysOfWeek;
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    handleInputChange('daysOfWeek', updatedDays, 'recurrenceDetails');
  };

  const applyTemplate = (template) => {
    setScheduleForm(prev => ({
      ...prev,
      appointmentType: template.name.split(' ')[0],
      recurrencePattern: 'weekly',
      bufferTime: template.bufferTime,
      recurrenceDetails: {
        ...prev.recurrenceDetails,
        frequency: template.pattern,
        daysOfWeek: template.days
      }
    }));
  };

  const ScheduleForm = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Schedule New Ride</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Patient ID</label>
              <input
                type="text"
                value={scheduleForm.patientId}
                onChange={(e) => handleInputChange('patientId', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Type</label>
              <select
                value={scheduleForm.appointmentType}
                onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                {appointmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
              <input
                type="text"
                value={scheduleForm.pickupLocation}
                onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>
              <input
                type="text"
                value={scheduleForm.dropoffLocation}
                onChange={(e) => handleInputChange('dropoffLocation', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Time</label>
              <input
                type="time"
                value={scheduleForm.appointmentTime}
                onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Buffer Time</label>
              <select
                value={scheduleForm.bufferTime}
                onChange={(e) => handleInputChange('bufferTime', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                {bufferOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence</label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recurrence"
                  value="none"
                  checked={scheduleForm.recurrencePattern === 'none'}
                  onChange={(e) => handleInputChange('recurrencePattern', e.target.value)}
                  className="h-4 w-4 text-green-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">One-time ride</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="recurrence"
                  value="weekly"
                  checked={scheduleForm.recurrencePattern === 'weekly'}
                  onChange={(e) => handleInputChange('recurrencePattern', e.target.value)}
                  className="h-4 w-4 text-green-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Weekly recurring</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="recurrence"
                  value="custom"
                  checked={scheduleForm.recurrencePattern === 'custom'}
                  onChange={(e) => handleInputChange('recurrencePattern', e.target.value)}
                  className="h-4 w-4 text-green-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Custom pattern</span>
              </label>
            </div>

            {scheduleForm.recurrencePattern === 'weekly' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scheduleForm.recurrenceDetails.daysOfWeek.includes(day)}
                        onChange={() => handleDayToggle(day)}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                      <span className="ml-1 text-sm text-gray-700 capitalize">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
              Save as Draft
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Schedule Ride
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const TemplatesTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recurring Trip Templates</h3>
          <p className="text-sm text-gray-600">Quick setup for common appointment types</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recurringTemplates.map(template => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">Duration: {template.duration}</p>
                      <p className="text-xs text-gray-500">Buffer: {template.bufferTime} min early</p>
                    </div>
                  </div>
                  <button
                    onClick={() => applyTemplate(template)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ScheduledRidesTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Scheduled Rides</h3>
          <span className="text-sm text-gray-600">{scheduledRides.length} upcoming</span>
        </div>
        <div className="divide-y divide-gray-200">
          {scheduledRides.map(ride => (
            <div key={ride.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      Patient {ride.patientId} - {ride.appointmentType}
                    </h4>
                    {ride.isRecurring && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <ArrowPathIcon className="h-3 w-3 mr-1" />
                        Recurring
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                      {ride.date} at {ride.time}
                    </p>
                    <p className="text-sm text-gray-600">From: {ride.pickup}</p>
                    <p className="text-sm text-gray-600">To: {ride.dropoff}</p>
                    {ride.nextOccurrence && (
                      <p className="text-sm text-blue-600">Next: {ride.nextOccurrence}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    <DocumentDuplicateIcon className="h-4 w-4 inline mr-1" />
                    Duplicate
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 text-sm">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'schedule', name: 'Schedule Ride', icon: PlusIcon },
    { id: 'templates', name: 'Templates', icon: DocumentDuplicateIcon },
    { id: 'scheduled', name: 'Scheduled Rides', icon: CalendarDaysIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && <ScheduleForm />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'scheduled' && <ScheduledRidesTab />}
    </div>
  );
};

export default AdvancedScheduling;
