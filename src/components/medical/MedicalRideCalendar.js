import React, { useState, useEffect, useRef } from 'react';
import { registerLicense } from '@syncfusion/ej2-base';
import {
  ScheduleComponent,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda,
  Inject,
  Resize,
  DragAndDrop,
  ViewsDirective,
  ViewDirective,
  ExcelExport
} from '@syncfusion/ej2-react-schedule';
import { 
  CalendarDaysIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import RideCalendarFilterDialog from './RideCalendarFilterDialog';
import RideDetailsModal from './RideDetailsModal';
import CreateRideModal from './CreateRideModal';
import DriverTrackingPanel from './DriverTrackingPanel';
import driverAssignmentService from '../../services/driverAssignmentService';
import '../../styles/syncfusion.css';

// Register Syncfusion license for this component
registerLicense(
  "Ngo9BigBOggjHTQxAR8/V1JEaF1cWmhIfEx1RHxQdld5ZFRHallYTnNWUj0eQnxTdEBjUHxecXJXR2BUVUV/X0leYw=="
);

// Status color mapping (moved outside component to avoid dependency issues)
const statusColors = {
  'scheduled': '#8B5CF6',     // Purple
  'assigned': '#2563EB',      // Blue
  'in_progress': '#16A34A',   // Green  
  'completed': '#1F2937',     // Gray
  'postponed': '#F59E0B',     // Orange
  'cancelled': '#E11D48'      // Red
};

const MedicalRideCalendar = ({ user }) => {
  const scheduleRef = useRef(null);
  const [rideData, setRideData] = useState([]);
  const [filteredRideData, setFilteredRideData] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [showRideDetails, setShowRideDetails] = useState(false);
  const [showCreateRide, setShowCreateRide] = useState(false);
  const [showDriverTracking, setShowDriverTracking] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    statuses: [],
    appointmentTypes: [],
    facilities: []
  });
  const [schedulerHeight, setSchedulerHeight] = useState(window.innerHeight * 0.7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setSchedulerHeight(window.innerHeight * 0.7);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real-time Firebase listener for medical ride schedules
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    
    // Query rides for this organization (or all rides if admin)
    const ridesQuery = user.role === 'super_admin' 
      ? collection(db, 'medicalRideSchedule')
      : query(
          collection(db, 'medicalRideSchedule'),
          where('organizationId', '==', user.uid)
        );

    const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
      // Format ride data for Syncfusion Calendar
      const formatRideForCalendar = (ride) => {
        const startTime = new Date(ride.appointmentDateTime);
        const endTime = new Date(startTime.getTime() + (ride.estimatedDuration || 60) * 60000); // Default 1 hour
        
        return {
          Id: ride.id,
          Subject: `${ride.patientId} - ${ride.appointmentType}`,
          StartTime: startTime,
          EndTime: endTime,
          CategoryColor: statusColors[ride.status] || statusColors.assigned,
          Status: ride.status,
          PatientId: ride.patientId,
          AppointmentType: ride.appointmentType,
          PickupLocation: ride.pickupLocation,
          DropoffLocation: ride.dropoffLocation,
          DriverInfo: ride.driverInfo,
          OrganizationName: ride.organizationName,
          IsAllDay: false,
          Description: `Patient: ${ride.patientId}\nType: ${ride.appointmentType}\nFrom: ${ride.pickupLocation?.facilityName || ride.pickupLocation?.address}\nTo: ${ride.dropoffLocation?.facilityName || ride.dropoffLocation?.address}\nStatus: ${ride.status}`,
          // Store original ride data for editing
          _originalData: ride
        };
      };

      const rides = [];
      snapshot.forEach((doc) => {
        const rideData = { id: doc.id, ...doc.data() };
        rides.push(formatRideForCalendar(rideData));
      });
      
      setRideData(rides);
      setFilteredRideData(rides);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching medical rides:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);



  // Apply filters to ride data
  useEffect(() => {
    let filtered = [...rideData];

    if (selectedFilters.statuses.length > 0) {
      filtered = filtered.filter(ride => 
        selectedFilters.statuses.includes(ride.Status)
      );
    }

    if (selectedFilters.appointmentTypes.length > 0) {
      filtered = filtered.filter(ride => 
        selectedFilters.appointmentTypes.includes(ride.AppointmentType)
      );
    }

    if (selectedFilters.facilities.length > 0) {
      filtered = filtered.filter(ride => 
        selectedFilters.facilities.includes(ride.PickupLocation?.facilityName) ||
        selectedFilters.facilities.includes(ride.DropoffLocation?.facilityName)
      );
    }

    setFilteredRideData(filtered);
  }, [rideData, selectedFilters]);

  // Handle calendar event click
  const onEventClick = (args) => {
    setSelectedRide(args.data);
    setShowRideDetails(true);
  };

  // Handle driver tracking for assigned rides
  const onShowDriverTracking = (ride) => {
    setSelectedRide(ride);
    setShowDriverTracking(true);
    setShowRideDetails(false);
  };

  // Assign driver to ride manually
  const handleManualDriverAssignment = async (rideId) => {
    try {
      const ride = rideData.find(r => r.Id === rideId);
      if (!ride) return;

      // Find nearby drivers
      const nearbyDrivers = await driverAssignmentService.findNearbyDrivers(
        ride._originalData?.pickupCoordinates || { lat: 35.3733, lng: -119.0187 },
        15,
        {
          requiresWheelchair: ride._originalData?.requiresWheelchair,
          requiresAssistance: ride._originalData?.requiresAssistance
        }
      );

      if (nearbyDrivers.length > 0) {
        const confirmed = window.confirm(
          `Found ${nearbyDrivers.length} nearby drivers. Send notifications now?`
        );
        
        if (confirmed) {
          await driverAssignmentService.notifyDrivers(
            nearbyDrivers.slice(0, 5),
            { ...ride._originalData, id: rideId }
          );
          alert(`Successfully notified ${Math.min(5, nearbyDrivers.length)} drivers!`);
        }
      } else {
        alert('No nearby drivers found at this time.');
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert('Error finding drivers. Please try again.');
    }
  };

  // Handle drag and drop rescheduling
  const onActionComplete = async (args) => {
    if (args.requestType === 'eventChange') {
      try {
        const rideId = args.data[0].Id;
        const newStartTime = args.data[0].StartTime;
        const newEndTime = args.data[0].EndTime;

        await updateDoc(doc(db, 'medicalRideSchedule', rideId), {
          appointmentDateTime: newStartTime.toISOString(),
          estimatedEndTime: newEndTime.toISOString(),
          updatedAt: serverTimestamp(),
          lastModifiedBy: user.uid,
          auditLog: [
            ...(args.data[0]._originalData?.auditLog || []),
            {
              action: 'ride_rescheduled',
              timestamp: new Date().toISOString(),
              userId: user.uid,
              userRole: user.role,
              oldDateTime: args.data[0]._originalData?.appointmentDateTime,
              newDateTime: newStartTime.toISOString()
            }
          ]
        });
      } catch (error) {
        console.error('Error rescheduling ride:', error);
        alert('Error rescheduling ride. Please try again.');
      }
    }
  };

  // Handle creating new ride from calendar
  const onCellClick = (args) => {
    setSelectedRide({
      appointmentDateTime: args.startTime,
      estimatedEndTime: args.endTime
    });
    setShowCreateRide(true);
  };

  // Event settings for Syncfusion
  const eventSettings = {
    dataSource: filteredRideData,
    fields: {
      id: 'Id',
      subject: { name: 'Subject' },
      startTime: { name: 'StartTime' },
      endTime: { name: 'EndTime' },
      categoryColor: 'CategoryColor'
    }
  };

  // Custom event rendering
  const onEventRendered = (args) => {
    const categoryColor = args.data.CategoryColor;
    const hasDriver = args.data._originalData?.assignedDriverId;
    const assignmentStatus = args.data._originalData?.assignmentStatus;
    
    args.element.style.backgroundColor = categoryColor;
    args.element.style.borderColor = categoryColor;
    
    // Add driver assignment indicator
    if (hasDriver) {
      args.element.style.borderLeft = '4px solid #10B981'; // Green stripe for assigned
    } else if (assignmentStatus === 'notifications_sent') {
      args.element.style.borderLeft = '4px solid #F59E0B'; // Orange stripe for pending
    } else {
      args.element.style.borderLeft = '4px solid #EF4444'; // Red stripe for unassigned
    }
    
    // Add status indicator
    const statusBadge = document.createElement('div');
    statusBadge.className = 'status-badge';
    statusBadge.style.cssText = `
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(255,255,255,0.9);
      color: ${categoryColor};
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
    `;
    statusBadge.textContent = args.data.Status.toUpperCase();
    args.element.appendChild(statusBadge);
    
    // Add driver assignment badge
    const driverBadge = document.createElement('div');
    driverBadge.className = 'driver-badge';
    driverBadge.style.cssText = `
      position: absolute;
      bottom: 2px;
      left: 2px;
      background: ${hasDriver ? '#10B981' : assignmentStatus === 'notifications_sent' ? '#F59E0B' : '#EF4444'};
      color: white;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: bold;
    `;
    driverBadge.textContent = hasDriver ? '🚗' : assignmentStatus === 'notifications_sent' ? '⏳' : '❌';
    args.element.appendChild(driverBadge);
    
    // Add click handler for driver tracking
    if (hasDriver) {
      args.element.style.cursor = 'pointer';
      args.element.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        onShowDriverTracking(args.data);
      });
    }
  };

  // Handle filter application
  const handleFilterApply = (filters) => {
    setSelectedFilters(filters);
    setShowFilter(false);
  };

  // Handle filter removal
  const handleRemoveFilter = (type, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item !== value)
    }));
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (scheduleRef.current) {
      scheduleRef.current.exportToExcel();
    }
  };

  // Get unique values for filters
  const getUniqueValues = (field) => {
    const values = new Set();
    rideData.forEach(ride => {
      if (field === 'facilities') {
        if (ride.PickupLocation?.facilityName) values.add(ride.PickupLocation.facilityName);
        if (ride.DropoffLocation?.facilityName) values.add(ride.DropoffLocation.facilityName);
      } else {
        values.add(ride[field]);
      }
    });
    return Array.from(values);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      {/* Header with Controls */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-green-600" />
            Medical Ride Calendar
          </h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            {filteredRideData.length} of {rideData.length} rides
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateRide(true)}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            New Ride
          </button>
          
          <button
            onClick={handleExportToExcel}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export
          </button>
          
          <button
            onClick={() => setShowFilter(true)}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            Filter
          </button>
        </div>
      </div>

      {/* Filter and Status Section */}
      <div className="px-4 py-3 space-y-3">
        {/* Active Filters */}
        {(selectedFilters.statuses.length > 0 || selectedFilters.appointmentTypes.length > 0 || selectedFilters.facilities.length > 0) && (
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            {selectedFilters.statuses.map(status => (
              <span
                key={`status-${status}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {status}
                <button
                  onClick={() => handleRemoveFilter('statuses', status)}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedFilters.appointmentTypes.map(type => (
              <span
                key={`type-${type}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {type}
                <button
                  onClick={() => handleRemoveFilter('appointmentTypes', type)}
                  className="ml-1 hover:text-green-600"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedFilters.facilities.map(facility => (
              <span
                key={`facility-${facility}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              >
                {facility}
                <button
                  onClick={() => handleRemoveFilter('facilities', facility)}
                  className="ml-1 hover:text-purple-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Status Legend */}
        <div className="flex items-center flex-wrap gap-4">
          <span className="text-sm font-medium text-gray-700">Legend:</span>
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center space-x-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-xs text-gray-600 capitalize">{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Component */}
      <div className="flex-1 px-4 pb-4">
        <ScheduleComponent
          ref={scheduleRef}
          width="100%"
          height={schedulerHeight}
          eventSettings={eventSettings}
          eventClick={onEventClick}
          cellClick={onCellClick}
          actionComplete={onActionComplete}
          eventRendered={onEventRendered}
          currentView="Month"
          showTimeIndicator={true}
          cssClass="medical-calendar"
          readonly={false}
        >
          <ViewsDirective>
            <ViewDirective option="Day" />
            <ViewDirective option="Week" />
            <ViewDirective option="WorkWeek" />
            <ViewDirective option="Month" />
            <ViewDirective option="Agenda" />
          </ViewsDirective>
          <Inject services={[Day, Week, WorkWeek, Month, Agenda, Resize, DragAndDrop, ExcelExport]} />
        </ScheduleComponent>
      </div>

      {/* Modals */}
      {showFilter && (
        <RideCalendarFilterDialog
          open={showFilter}
          onClose={() => setShowFilter(false)}
          onApply={handleFilterApply}
          rideData={rideData}
          availableStatuses={Object.keys(statusColors)}
          availableAppointmentTypes={getUniqueValues('AppointmentType')}
          availableFacilities={getUniqueValues('facilities')}
        />
      )}

      {showRideDetails && selectedRide && (
        <RideDetailsModal
          open={showRideDetails}
          onClose={() => setShowRideDetails(false)}
          ride={selectedRide}
          user={user}
          onShowDriverTracking={() => onShowDriverTracking(selectedRide)}
          onAssignDriver={() => handleManualDriverAssignment(selectedRide.Id)}
        />
      )}

      {showCreateRide && (
        <CreateRideModal
          open={showCreateRide}
          onClose={() => setShowCreateRide(false)}
          initialDateTime={selectedRide?.appointmentDateTime}
          user={user}
        />
      )}

      {showDriverTracking && selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <DriverTrackingPanel
            ride={selectedRide}
            onClose={() => setShowDriverTracking(false)}
          />
        </div>
      )}
    </div>
  );
};

export default MedicalRideCalendar;
