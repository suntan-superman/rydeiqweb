import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  DocumentTextIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const ComplianceToolkit = ({ user }) => {
  const [activeTab, setActiveTab] = useState('gps_logs');
  const [complianceData, setComplianceData] = useState({
    totalRides: 0,
    compliantRides: 0,
    pendingVerifications: 0,
    expiredDocuments: 0
  });

  useEffect(() => {
    // TODO: Load actual compliance data from Firebase
    setComplianceData({
      totalRides: 127,
      compliantRides: 125,
      pendingVerifications: 3,
      expiredDocuments: 2
    });
  }, []);

  const mockGPSLogs = [
    {
      id: '1',
      rideId: 'R001',
      patientId: 'P001',
      date: '2025-01-14',
      pickupTime: '08:15:00',
      pickupLocation: { lat: 35.3733, lng: -119.0187, address: 'Sunrise Assisted Living' },
      dropoffTime: '08:42:00',
      dropoffLocation: { lat: 35.3733, lng: -119.0187, address: 'Kern Medical Dialysis' },
      driverVerified: true,
      patientVerified: true,
      signatures: true
    },
    {
      id: '2',
      rideId: 'R002',
      patientId: 'P003',
      date: '2025-01-14',
      pickupTime: '14:30:00',
      pickupLocation: { lat: 35.3733, lng: -119.0187, address: '1234 Oak Street' },
      dropoffTime: '15:05:00',
      dropoffLocation: { lat: 35.3733, lng: -119.0187, address: 'Central Valley Rehab' },
      driverVerified: true,
      patientVerified: false,
      signatures: true
    }
  ];

  const mockPCSVerifications = [
    {
      id: '1',
      patientId: 'P001',
      verificationDate: '2025-01-14',
      verifiedBy: 'Dr. Sarah Johnson',
      medicalNecessity: true,
      transportMode: 'Wheelchair Accessible Vehicle',
      approvalPeriod: '3 months',
      status: 'verified'
    },
    {
      id: '2',
      patientId: 'P002',
      verificationDate: '2025-01-12',
      verifiedBy: 'Dr. Michael Chen',
      medicalNecessity: true,
      transportMode: 'Standard Vehicle',
      approvalPeriod: '6 months',
      status: 'verified'
    },
    {
      id: '3',
      patientId: 'P003',
      verificationDate: '2025-01-10',
      verifiedBy: 'Dr. Emily Rodriguez',
      medicalNecessity: true,
      transportMode: 'Stretcher Transport',
      approvalPeriod: '1 month',
      status: 'pending_review'
    }
  ];

  const mockDriverDocuments = [
    {
      id: '1',
      driverId: 'D001',
      driverName: 'John Smith',
      documents: {
        license: { valid: true, expiryDate: '2025-08-15' },
        insurance: { valid: true, expiryDate: '2025-06-30' },
        backgroundCheck: { valid: true, expiryDate: '2025-12-01' },
        medicalClearance: { valid: false, expiryDate: '2024-12-15' },
        cprCertification: { valid: true, expiryDate: '2025-03-20' }
      }
    },
    {
      id: '2',
      driverId: 'D002',
      driverName: 'Sarah Johnson',
      documents: {
        license: { valid: true, expiryDate: '2025-11-22' },
        insurance: { valid: true, expiryDate: '2025-09-15' },
        backgroundCheck: { valid: true, expiryDate: '2025-10-05' },
        medicalClearance: { valid: true, expiryDate: '2025-07-30' },
        cprCertification: { valid: false, expiryDate: '2024-11-10' }
      }
    }
  ];

  const StatCard = ({ title, value, icon: Icon, color = "green" }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-${color}-600`} aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const GPSLogsTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">GPS-Stamped Pickup/Dropoff Logs</h3>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            <ArrowDownTrayIcon className="h-4 w-4 inline mr-2" />
            Export Logs
          </button>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ride ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pickup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dropoff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockGPSLogs.map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.rideId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.patientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {log.pickupTime}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {log.pickupLocation.address}
                      </div>
                      <div className="text-xs text-gray-400">
                        {log.pickupLocation.lat.toFixed(4)}, {log.pickupLocation.lng.toFixed(4)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {log.dropoffTime}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {log.dropoffLocation.address}
                      </div>
                      <div className="text-xs text-gray-400">
                        {log.dropoffLocation.lat.toFixed(4)}, {log.dropoffLocation.lng.toFixed(4)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        {log.driverVerified ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className="text-xs">Driver</span>
                      </div>
                      <div className="flex items-center">
                        {log.patientVerified ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className="text-xs">Patient</span>
                      </div>
                      <div className="flex items-center">
                        {log.signatures ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className="text-xs">Signatures</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const PCSVerificationTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">PCS (Physician Certification Statement) Tracking</h3>
          <p className="text-sm text-gray-600">Track medical necessity verifications for NEMT services</p>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transport Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockPCSVerifications.map(verification => (
                <tr key={verification.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {verification.patientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {verification.verificationDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {verification.verifiedBy}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {verification.transportMode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {verification.approvalPeriod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      verification.status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {verification.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const DocumentArchiveTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Driver Document Compliance Archive</h3>
          <p className="text-sm text-gray-600">Monitor driver license, insurance, and background check compliance</p>
        </div>
        <div className="p-6">
          {mockDriverDocuments.map(driver => (
            <div key={driver.id} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{driver.driverName}</h4>
                  <p className="text-sm text-gray-600">Driver ID: {driver.driverId}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(driver.documents).map(([docType, doc]) => (
                  <div key={docType} className={`p-3 rounded-md border ${
                    doc.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 capitalize">
                          {docType.replace(/([A-Z])/g, ' $1').trim()}
                        </h5>
                        <p className={`text-xs ${doc.valid ? 'text-green-600' : 'text-red-600'}`}>
                          Expires: {doc.expiryDate}
                        </p>
                      </div>
                      {doc.valid ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  View Documents
                </button>
                <button className="text-green-600 hover:text-green-800 text-sm">
                  Update
                </button>
                <button className="text-yellow-600 hover:text-yellow-800 text-sm">
                  Send Reminder
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AuditReportsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Compliance Reports</h3>
          </div>
          <div className="p-6 space-y-4">
            <button className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Monthly Compliance Report</h4>
                  <p className="text-sm text-blue-600">Comprehensive compliance overview</p>
                </div>
                <ArrowDownTrayIcon className="h-5 w-5 text-blue-600" />
              </div>
            </button>
            
            <button className="w-full bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-green-900">GPS Audit Trail</h4>
                  <p className="text-sm text-green-600">Location verification logs</p>
                </div>
                <ArrowDownTrayIcon className="h-5 w-5 text-green-600" />
              </div>
            </button>
            
            <button className="w-full bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg p-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Document Expiry Report</h4>
                  <p className="text-sm text-yellow-600">Upcoming document renewals</p>
                </div>
                <ArrowDownTrayIcon className="h-5 w-5 text-yellow-600" />
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Compliance Alerts</h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">2 Documents Expired</h4>
                  <p className="text-sm text-red-600">Driver certifications need renewal</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">3 PCS Pending Review</h4>
                  <p className="text-sm text-yellow-600">Medical verifications awaiting approval</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">98% Compliance Rate</h4>
                  <p className="text-sm text-green-600">Excellent compliance this month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'gps_logs', name: 'GPS Logs', icon: MapPinIcon },
    { id: 'pcs_verification', name: 'PCS Verification', icon: DocumentTextIcon },
    { id: 'document_archive', name: 'Document Archive', icon: ShieldCheckIcon },
    { id: 'audit_reports', name: 'Audit Reports', icon: ArrowDownTrayIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Compliance Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Rides"
          value={complianceData.totalRides}
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatCard
          title="Compliant Rides"
          value={complianceData.compliantRides}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title="Pending Verifications"
          value={complianceData.pendingVerifications}
          icon={ClockIcon}
          color="yellow"
        />
        <StatCard
          title="Expired Documents"
          value={complianceData.expiredDocuments}
          icon={ExclamationTriangleIcon}
          color="red"
        />
      </div>

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
      {activeTab === 'gps_logs' && <GPSLogsTab />}
      {activeTab === 'pcs_verification' && <PCSVerificationTab />}
      {activeTab === 'document_archive' && <DocumentArchiveTab />}
      {activeTab === 'audit_reports' && <AuditReportsTab />}
    </div>
  );
};

export default ComplianceToolkit;
