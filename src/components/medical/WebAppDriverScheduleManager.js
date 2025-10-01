import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import EnhancedDriverScheduleManager from '../driver/EnhancedDriverScheduleManager';
import medicalDriverIntegrationService from '../../services/medicalDriverIntegrationService';

/**
 * Web App Driver Schedule Manager
 * For use in dispatcher dashboard and web interface
 * Allows dispatchers to manage driver schedules
 */
const WebAppDriverScheduleManager = ({ user, selectedDriver = null }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriverId, setSelectedDriverId] = useState(selectedDriver?.id || null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      // Load all approved drivers
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');
      
      const driversQuery = query(
        collection(db, 'driverApplications'),
        where('status', '==', 'approved')
      );

      const snapshot = await getDocs(driversQuery);
      const driversList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setDrivers(driversList);
      
      // Set first driver as selected if none specified
      if (!selectedDriverId && driversList.length > 0) {
        setSelectedDriverId(driversList[0].id);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSelect = (driverId) => {
    setSelectedDriverId(driverId);
  };

  const getDriverStats = async (driverId) => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [medicalResult, regularResult] = await Promise.all([
        medicalDriverIntegrationService.getDriverMedicalSchedule(driverId, today, tomorrow),
        // Add regular rides service call here if needed
      ]);

      return {
        medicalRides: medicalResult.data?.length || 0,
        regularRides: 0, // regularResult.data?.length || 0
        totalRides: medicalResult.data?.length || 0
      };
    } catch (error) {
      console.error('Error getting driver stats:', error);
      return { medicalRides: 0, regularRides: 0, totalRides: 0 };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading drivers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Driver Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Schedule Management</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver List */}
          <div className="lg:col-span-1">
            <h4 className="font-medium text-gray-900 mb-3">Select Driver</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {drivers.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  isSelected={selectedDriverId === driver.id}
                  onSelect={() => handleDriverSelect(driver.id)}
                />
              ))}
            </div>
          </div>

          {/* Schedule View */}
          <div className="lg:col-span-2">
            {selectedDriverId ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Schedule for {drivers.find(d => d.id === selectedDriverId)?.personalInfo?.firstName} {drivers.find(d => d.id === selectedDriverId)?.personalInfo?.lastName}
                </h4>
                <EnhancedDriverScheduleManager
                  driverId={selectedDriverId}
                  viewMode="week"
                  showMedicalRides={true}
                  showRegularRides={true}
                  allowEditing={true}
                  onScheduleChange={() => {
                    console.log('Schedule updated for driver:', selectedDriverId);
                  }}
                  isMobile={false}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Select a Driver</h4>
                <p className="text-gray-600">
                  Choose a driver from the list to view and manage their schedule.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {selectedDriverId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Driver Overview</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <HeartIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">0</div>
              <div className="text-sm text-blue-700">Medical Rides Today</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TruckIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">0</div>
              <div className="text-sm text-green-700">Regular Rides Today</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <CalendarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">0</div>
              <div className="text-sm text-purple-700">Total Rides Today</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DriverCard = ({ driver, isSelected, onSelect }) => {
  const serviceCapabilities = driver.vehicleInfo?.serviceCapabilities || [];
  const hasMedicalTransport = serviceCapabilities.includes('medical_transport');

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {driver.personalInfo?.firstName?.charAt(0) || 'D'}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-gray-900 truncate">
            {driver.personalInfo?.firstName} {driver.personalInfo?.lastName}
          </h5>
          <p className="text-sm text-gray-600 truncate">
            {driver.vehicleInfo?.make} {driver.vehicleInfo?.model}
          </p>
          {hasMedicalTransport && (
            <div className="flex items-center mt-1">
              <HeartIcon className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-xs text-red-600 font-medium">Medical Transport</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebAppDriverScheduleManager;
