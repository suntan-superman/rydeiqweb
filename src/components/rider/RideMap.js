import React from 'react';

const RideMap = ({ pickup, destination, driverLocation, rideStatus }) => {
  return (
    <div className="h-64 md:h-80 bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-2">🗺️</div>
        <p className="text-gray-600">Interactive map will be implemented here</p>
        <div className="mt-2 text-sm text-gray-500">
          {pickup && <div>From: {pickup.address.split(',')[0]}</div>}
          {destination && <div>To: {destination.address.split(',')[0]}</div>}
          {driverLocation && <div>Driver location: Live tracking</div>}
        </div>
      </div>
    </div>
  );
};

export default RideMap; 