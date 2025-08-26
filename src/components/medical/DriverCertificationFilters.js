import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  AcademicCapIcon,
  TruckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const DriverCertificationFilters = ({ user }) => {
  const [drivers, setDrivers] = useState([]);
  const [filters, setFilters] = useState({
    cprCertified: false,
    firstAidCertified: false,
    defensiveDriving: false,
    medicalTransport: false,
    wheelchairAccessible: false,
    oxygenEquipped: false
  });

  const certificationTypes = [
    {
      id: 'cprCertified',
      name: 'CPR Certified',
      icon: ShieldCheckIcon,
      description: 'Certified in CPR and basic life support'
    },
    {
      id: 'firstAidCertified',
      name: 'First Aid Certified',
      icon: AcademicCapIcon,
      description: 'Certified in first aid and emergency response'
    },
    {
      id: 'defensiveDriving',
      name: 'Defensive Driving',
      icon: TruckIcon,
      description: 'Completed defensive driving course'
    },
    {
      id: 'medicalTransport',
      name: 'Medical Transport',
      icon: UserGroupIcon,
      description: 'Specialized medical transport training'
    },
    {
      id: 'wheelchairAccessible',
      name: 'Wheelchair Vehicle',
      icon: TruckIcon,
      description: 'Vehicle equipped with wheelchair lift/ramp'
    },
    {
      id: 'oxygenEquipped',
      name: 'Oxygen Support',
      icon: ShieldCheckIcon,
      description: 'Vehicle equipped for oxygen transport'
    }
  ];

  useEffect(() => {
    // TODO: Load actual drivers from Firebase
    const mockDrivers = [
      {
        id: '1',
        name: 'John Smith',
        certifications: ['cprCertified', 'firstAidCertified', 'medicalTransport'],
        vehicle: 'Toyota Sienna (Wheelchair Accessible)',
        rating: 4.9,
        completedRides: 342,
        isAvailable: true
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        certifications: ['cprCertified', 'defensiveDriving'],
        vehicle: 'Honda Pilot',
        rating: 4.8,
        completedRides: 156,
        isAvailable: true
      },
      {
        id: '3',
        name: 'Michael Chen',
        certifications: ['firstAidCertified', 'medicalTransport', 'wheelchairAccessible'],
        vehicle: 'Ford Transit (Wheelchair Accessible)',
        rating: 4.9,
        completedRides: 278,
        isAvailable: false
      }
    ];
    
    setDrivers(mockDrivers);
  }, []);

  const handleFilterChange = (filterId, checked) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: checked
    }));
  };

  const getFilteredDrivers = () => {
    const activeFilters = Object.entries(filters)
      .filter(([_, enabled]) => enabled)
      .map(([filterId, _]) => filterId);

    if (activeFilters.length === 0) {
      return drivers;
    }

    return drivers.filter(driver => 
      activeFilters.every(filter => driver.certifications.includes(filter))
    );
  };

  const getCertificationBadge = (certId) => {
    const cert = certificationTypes.find(c => c.id === certId);
    if (!cert) return null;

    const Icon = cert.icon;
    return (
      <span
        key={certId}
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-1 mb-1"
        title={cert.description}
      >
        <Icon className="h-3 w-3 mr-1" />
        {cert.name}
      </span>
    );
  };

  const filteredDrivers = getFilteredDrivers();

  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Driver Certification Filters</h3>
          <p className="text-sm text-gray-600">Filter drivers by certifications and vehicle capabilities</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificationTypes.map(cert => {
              const Icon = cert.icon;
              return (
                <label key={cert.id} className="flex items-start">
                  <input
                    type="checkbox"
                    checked={filters[cert.id]}
                    onChange={(e) => handleFilterChange(cert.id, e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-700">{cert.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{cert.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Certified Drivers ({filteredDrivers.length})
          </h3>
          <span className="text-sm text-gray-600">
            {filteredDrivers.filter(d => d.isAvailable).length} available now
          </span>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredDrivers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No drivers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your certification filters.
              </p>
            </div>
          ) : (
            filteredDrivers.map(driver => (
              <div key={driver.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{driver.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        driver.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {driver.isAvailable ? 'Available' : 'Busy'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{driver.vehicle}</p>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-2">Certifications:</p>
                      <div className="flex flex-wrap">
                        {driver.certifications.map(certId => getCertificationBadge(certId))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center">
                      <span className="text-lg font-medium text-gray-900">{driver.rating}</span>
                      <span className="text-yellow-400 ml-1">★</span>
                    </div>
                    <p className="text-sm text-gray-500">{driver.completedRides} rides</p>
                    
                    <button
                      disabled={!driver.isAvailable}
                      className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {driver.isAvailable ? 'Request Driver' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Certification Management */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Certification Management</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-blue-800">Add New Certification</h4>
              <p className="text-sm text-blue-600 mt-1">
                Request additional certifications for your driver network.
              </p>
              <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                Request Certification
              </button>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800">Expiring Certifications</h4>
              <p className="text-sm text-yellow-600 mt-1">
                3 drivers have certifications expiring within 30 days.
              </p>
              <button className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverCertificationFilters;
