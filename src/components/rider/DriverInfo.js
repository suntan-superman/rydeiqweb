import React from 'react';
import Button from '../common/Button';

const DriverInfo = ({ driver, onContactDriver, onReportIssue }) => {
  if (!driver) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>Driver information loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Your Driver</h3>
      
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-xl font-medium text-gray-700">
            {driver.driverInfo?.firstName?.[0]}{driver.driverInfo?.lastName?.[0]}
          </span>
        </div>
        
        <div className="flex-1">
          <h4 className="text-lg font-medium text-gray-900">
            {driver.driverInfo?.firstName} {driver.driverInfo?.lastName}
          </h4>
          <div className="flex items-center space-x-1">
            <span className="text-yellow-400">⭐</span>
            <span className="text-sm text-gray-600">
              {driver.driverRating?.toFixed(1) || '4.8'} • {driver.totalRides || 156} rides
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-lg">🚗</span>
          <span className="font-medium text-gray-900">
            {driver.vehicleInfo?.year} {driver.vehicleInfo?.make} {driver.vehicleInfo?.model}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {driver.vehicleInfo?.color} • {driver.vehicleInfo?.licensePlate}
        </div>
      </div>

      {/* Contact Actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={onContactDriver}
          className="w-full flex items-center justify-center space-x-2"
        >
          <span>📞</span>
          <span>Contact Driver</span>
        </Button>
        
        <Button
          variant="ghost"
          onClick={onReportIssue}
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Report Issue
        </Button>
      </div>
    </div>
  );
};

export default DriverInfo; 