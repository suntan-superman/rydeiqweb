import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const RideCalendarFilterDialog = ({ 
  open, 
  onClose, 
  onApply, 
  availableStatuses = [],
  availableAppointmentTypes = [],
  availableFacilities = [],
  rideData = []
}) => {
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedAppointmentTypes, setSelectedAppointmentTypes] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);

  // Load saved filters from localStorage on component mount
  useEffect(() => {
    if (open) {
      const savedFilters = JSON.parse(localStorage.getItem('medicalRideCalendarFilters') || '{}');
      setSelectedStatuses(savedFilters.statuses || []);
      setSelectedAppointmentTypes(savedFilters.appointmentTypes || []);
      setSelectedFacilities(savedFilters.facilities || []);
    }
  }, [open]);

  const handleStatusChange = (status, checked) => {
    setSelectedStatuses(prev => 
      checked 
        ? [...prev, status]
        : prev.filter(s => s !== status)
    );
  };

  const handleAppointmentTypeChange = (type, checked) => {
    setSelectedAppointmentTypes(prev => 
      checked 
        ? [...prev, type]
        : prev.filter(t => t !== type)
    );
  };

  const handleFacilityChange = (facility, checked) => {
    setSelectedFacilities(prev => 
      checked 
        ? [...prev, facility]
        : prev.filter(f => f !== facility)
    );
  };

  const handleSelectAllStatuses = () => {
    setSelectedStatuses(availableStatuses);
  };

  const handleClearAllStatuses = () => {
    setSelectedStatuses([]);
  };

  const handleSelectAllAppointmentTypes = () => {
    setSelectedAppointmentTypes(availableAppointmentTypes);
  };

  const handleClearAllAppointmentTypes = () => {
    setSelectedAppointmentTypes([]);
  };

  const handleSelectAllFacilities = () => {
    setSelectedFacilities(availableFacilities);
  };

  const handleClearAllFacilities = () => {
    setSelectedFacilities([]);
  };

  const handleApply = () => {
    const filters = {
      statuses: selectedStatuses,
      appointmentTypes: selectedAppointmentTypes,
      facilities: selectedFacilities
    };

    // Save filters to localStorage
    localStorage.setItem('medicalRideCalendarFilters', JSON.stringify(filters));
    
    onApply(filters);
  };

  const handleClearAll = () => {
    setSelectedStatuses([]);
    setSelectedAppointmentTypes([]);
    setSelectedFacilities([]);
  };

  const statusColors = {
    'assigned': '#2563EB',
    'in_progress': '#16A34A',
    'completed': '#1F2937',
    'postponed': '#F59E0B',
    'cancelled': '#E11D48'
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Dialog */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Filter Rides
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status Filters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Status</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAllStatuses}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearAllStatuses}
                      className="text-xs text-gray-500 hover:text-gray-600"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {availableStatuses.map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={(e) => handleStatusChange(status, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex items-center">
                        <div
                          className="w-3 h-3 rounded mr-2"
                          style={{ backgroundColor: statusColors[status] || '#6B7280' }}
                        ></div>
                        <span className="text-sm text-gray-700 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Appointment Type Filters */}
              {availableAppointmentTypes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Appointment Type</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSelectAllAppointmentTypes}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Select All
                      </button>
                      <button
                        onClick={handleClearAllAppointmentTypes}
                        className="text-xs text-gray-500 hover:text-gray-600"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableAppointmentTypes.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedAppointmentTypes.includes(type)}
                          onChange={(e) => handleAppointmentTypeChange(type, e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Facility Filters */}
              {availableFacilities.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Facilities</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSelectAllFacilities}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Select All
                      </button>
                      <button
                        onClick={handleClearAllFacilities}
                        className="text-xs text-gray-500 hover:text-gray-600"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableFacilities.map(facility => (
                      <label key={facility} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFacilities.includes(facility)}
                          onChange={(e) => handleFacilityChange(facility, e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">{facility}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Filters Summary:</strong>
                </p>
                <ul className="text-xs text-gray-500 mt-1 space-y-1">
                  <li>{selectedStatuses.length} status(es) selected</li>
                  <li>{selectedAppointmentTypes.length} appointment type(s) selected</li>
                  <li>{selectedFacilities.length} facility(ies) selected</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleApply}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearAll}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideCalendarFilterDialog;
