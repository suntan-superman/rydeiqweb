import React, { useState, useRef } from 'react';
import { 
  CalendarDaysIcon,
  ArrowPathIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import StablePlacesInput from './StablePlacesInput';
import medicalDriverIntegrationService from '../../services/medicalDriverIntegrationService';
import toast from 'react-hot-toast';
import DriverAvailabilityChecker from './DriverAvailabilityChecker';

const AdvancedScheduling = ({ user }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  
  // Driver availability checking state
  const [showDriverAvailability, setShowDriverAvailability] = useState(false);
  const [scheduledRideData, setScheduledRideData] = useState(null);
  
  // Ref for scrolling to driver selection section
  const driverSelectionRef = useRef(null);
  // Helper function to get next rounded hour
  const getNextRoundedHour = React.useCallback(() => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0); // Round up to next hour
    return nextHour.toTimeString().slice(0, 5); // Format as HH:MM
  }, []);

  // Helper function to get today's date
  const getTodaysDate = React.useCallback(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }, []);

  const [scheduleForm, setScheduleForm] = useState({
    patientId: '',
    appointmentType: 'Dialysis',
    pickupLocation: '',
    dropoffLocation: '',
    appointmentDate: getTodaysDate(),
    appointmentTime: getNextRoundedHour(),
    bufferTime: '15',
    recurrencePattern: 'none',
    recurrenceDetails: {
      frequency: 'weekly',
      daysOfWeek: [],
      endDate: ''
    }
  });

  // Store coordinates for enhanced driver matching
  const [locationCoordinates, setLocationCoordinates] = useState({
    pickup: null,
    dropoff: null
  });

  // Medical requirements state
  const [medicalRequirements, setMedicalRequirements] = useState({
    priorityLevel: 'routine',
    wheelchairAccessible: false,
    stretcherRequired: false,
    oxygenSupport: false,
    assistanceLevel: 'none',
    medicalEquipment: [],
    specialInstructions: '',
    appointmentTypeDetails: '',
    returnTrip: {
      required: false,
      estimatedTime: ''
    }
  });
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appointmentTypes = React.useMemo(() => [
    'Dialysis',
    'Chemotherapy',
    'Physical Therapy',
    'Medical Appointment',
    'Mental Health',
    'Surgery',
    'Follow-up'
  ], []);

  const bufferOptions = React.useMemo(() => [
    { value: '10', label: '10 minutes early' },
    { value: '15', label: '15 minutes early' },
    { value: '20', label: '20 minutes early' },
    { value: '30', label: '30 minutes early' }
  ], []);

  // Load drafts from Firebase
  React.useEffect(() => {
    if (!user?.uid) return;
    
    setLoadingDrafts(true);
    
    try {
      const draftsQuery = query(
        collection(db, 'rideDrafts'),
        where('createdBy', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(draftsQuery, (snapshot) => {
        const draftsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDrafts(draftsData);
        setLoadingDrafts(false);
      }, (error) => {
        console.error('Error loading drafts:', error);
        setLoadingDrafts(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up drafts listener:', error);
      setLoadingDrafts(false);
    }
  }, [user?.uid]);

  const recurringTemplates = React.useMemo(() => [
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
  ], []);

  const scheduledRides = React.useMemo(() => [
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
  ], []);



  // Stable input change handlers for specific fields
  const handlePatientIdChange = React.useCallback((e) => {
    setScheduleForm(prev => ({ ...prev, patientId: e.target.value }));
  }, []);

  const handleAppointmentTypeChange = React.useCallback((e) => {
    setScheduleForm(prev => ({ ...prev, appointmentType: e.target.value }));
  }, []);

  const handleAppointmentDateChange = React.useCallback((e) => {
    setScheduleForm(prev => ({ ...prev, appointmentDate: e.target.value }));
  }, []);

  const handleAppointmentTimeChange = React.useCallback((e) => {
    setScheduleForm(prev => ({ ...prev, appointmentTime: e.target.value }));
  }, []);

  const handleBufferTimeChange = React.useCallback((e) => {
    setScheduleForm(prev => ({ ...prev, bufferTime: e.target.value }));
  }, []);

  const handleRecurrencePatternChange = React.useCallback((e) => {
    setScheduleForm(prev => ({ ...prev, recurrencePattern: e.target.value }));
  }, []);

  // Medical requirements handlers
  const handleMedicalRequirementChange = React.useCallback((field, value) => {
    setMedicalRequirements(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleMedicalEquipmentToggle = React.useCallback((equipment) => {
    setMedicalRequirements(prev => ({
      ...prev,
      medicalEquipment: prev.medicalEquipment.includes(equipment)
        ? prev.medicalEquipment.filter(item => item !== equipment)
        : [...prev.medicalEquipment, equipment]
    }));
  }, []);

  // Draft management functions
  const handleLoadDraft = React.useCallback((draft) => {
    // Load draft data into the form
    setScheduleForm({
      patientId: draft.patientId || '',
      appointmentType: draft.appointmentType || 'Dialysis',
      pickupLocation: draft.pickupLocation || '',
      dropoffLocation: draft.dropoffLocation || '',
      appointmentDate: draft.appointmentDate || getTodaysDate(),
      appointmentTime: draft.appointmentTime || getNextRoundedHour(),
      bufferTime: draft.bufferTime || '15',
      recurrencePattern: draft.recurrencePattern || 'none',
      recurrenceDetails: draft.recurrenceDetails || {
        frequency: 'weekly',
        daysOfWeek: [],
        endDate: ''
      }
    });

    if (draft.medicalRequirements) {
      setMedicalRequirements(draft.medicalRequirements);
    }

    if (draft.locationCoordinates) {
      setLocationCoordinates(draft.locationCoordinates);
    }

    // Switch to schedule tab
    setActiveTab('schedule');
  }, [getTodaysDate, getNextRoundedHour]);

  const handleDeleteDraft = React.useCallback(async (draftId) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;

    try {
      await deleteDoc(doc(db, 'rideDrafts', draftId));
      // Note: State will be updated automatically via the onSnapshot listener
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Error deleting draft. Please try again.');
    }
  }, []);

  // Validation functions for form buttons
  const isDraftValid = React.useMemo(() => {
    // Minimum requirements for draft: Patient ID and Appointment Type
    return scheduleForm.patientId.trim() !== '' && 
           scheduleForm.appointmentType !== '';
  }, [scheduleForm.patientId, scheduleForm.appointmentType]);

  const isScheduleValid = React.useMemo(() => {
    // Full requirements for scheduling: all required fields
    return scheduleForm.patientId.trim() !== '' && 
           scheduleForm.appointmentType !== '' &&
           scheduleForm.pickupLocation.trim() !== '' &&
           scheduleForm.dropoffLocation.trim() !== '' &&
           scheduleForm.appointmentDate !== '' &&
           scheduleForm.appointmentTime !== '';
  }, [
    scheduleForm.patientId, 
    scheduleForm.appointmentType,
    scheduleForm.pickupLocation,
    scheduleForm.dropoffLocation,
    scheduleForm.appointmentDate,
    scheduleForm.appointmentTime
  ]);

  const handleDayToggle = React.useCallback((day) => {
    setScheduleForm(prev => {
      const currentDays = prev.recurrenceDetails.daysOfWeek;
      const updatedDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
      
      return {
        ...prev,
        recurrenceDetails: {
          ...prev.recurrenceDetails,
          daysOfWeek: updatedDays
        }
      };
    });
  }, []);

  const applyTemplate = React.useCallback((template) => {
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
  }, []);

  // Memoized onChange handlers to prevent re-renders
  const handlePickupLocationChange = React.useCallback((value) => {
    setScheduleForm(prev => ({
      ...prev,
      pickupLocation: value
    }));
  }, []);

  const handleDropoffLocationChange = React.useCallback((value) => {
    setScheduleForm(prev => ({
      ...prev,
      dropoffLocation: value
    }));
  }, []);

  // Handle pickup location selection
  const handlePickupLocationSelect = React.useCallback((placeData) => {
    console.log('Pickup place data received:', placeData);
    setScheduleForm(prev => ({
      ...prev,
      pickupLocation: placeData.address
    }));
    setLocationCoordinates(prev => ({
      ...prev,
      pickup: {
        coordinates: placeData.coordinates,
        address: placeData.address,
        ...(placeData.name && { facilityName: placeData.name })
      }
    }));
    console.log('Location coordinates updated:', {
      pickup: {
        coordinates: placeData.coordinates,
        address: placeData.address,
        ...(placeData.name && { facilityName: placeData.name })
      }
    });
  }, []);

  // Handle dropoff location selection
  const handleDropoffLocationSelect = React.useCallback((placeData) => {
    setScheduleForm(prev => ({
      ...prev,
      dropoffLocation: placeData.address
    }));
    setLocationCoordinates(prev => ({
      ...prev,
      dropoff: {
        coordinates: placeData.coordinates,
        address: placeData.address,
        ...(placeData.name && { facilityName: placeData.name })
      }
    }));
  }, []);

  // Save as draft handler
  const handleSaveAsDraft = React.useCallback(async () => {
    if (!scheduleForm.patientId || !scheduleForm.pickupLocation || !scheduleForm.dropoffLocation) {
      alert('Please fill in Patient ID, Pickup Location, and Dropoff Location');
      return;
    }

    setIsSubmitting(true);
    try {
      const draftData = {
        ...scheduleForm,
        locationCoordinates,
        status: 'draft',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        organizationId: user.uid,
        organizationName: user.organizationName || user.displayName
      };

      await addDoc(collection(db, 'rideDrafts'), draftData);
      
      // Reset form
      setScheduleForm({
        patientId: '',
        appointmentType: 'Dialysis',
        pickupLocation: '',
        dropoffLocation: '',
        appointmentDate: getTodaysDate(),
        appointmentTime: getNextRoundedHour(),
        bufferTime: '15',
        recurrencePattern: 'none',
        recurrenceDetails: {
          frequency: 'weekly',
          daysOfWeek: [],
          endDate: ''
        }
      });
      setLocationCoordinates({ pickup: null, dropoff: null });
      
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [scheduleForm, locationCoordinates, user, getTodaysDate, getNextRoundedHour]);

  // Schedule ride handler with driver availability checking
  const handleScheduleRide = React.useCallback(async () => {
    // Validation
    if (!scheduleForm.patientId || !scheduleForm.pickupLocation || !scheduleForm.dropoffLocation || 
        !scheduleForm.appointmentDate || !scheduleForm.appointmentTime) {
      alert('Please fill in all required fields: Patient ID, Pickup Location, Dropoff Location, Date, and Time');
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine date and time
      const appointmentDateTime = new Date(`${scheduleForm.appointmentDate}T${scheduleForm.appointmentTime}`);
      
      const rideData = {
        patientId: scheduleForm.patientId,
        appointmentType: scheduleForm.appointmentType,
        pickupLocation: {
          address: scheduleForm.pickupLocation,
          ...(locationCoordinates.pickup?.facilityName && { facilityName: locationCoordinates.pickup.facilityName }),
          coordinates: locationCoordinates.pickup?.coordinates || locationCoordinates.pickup
        },
        dropoffLocation: {
          address: scheduleForm.dropoffLocation,
          ...(locationCoordinates.dropoff?.facilityName && { facilityName: locationCoordinates.dropoff.facilityName }),
          coordinates: locationCoordinates.dropoff?.coordinates || locationCoordinates.dropoff
        },
        appointmentDateTime: appointmentDateTime.toISOString(),
        bufferTime: parseInt(scheduleForm.bufferTime),
        recurrencePattern: scheduleForm.recurrencePattern,
        recurrenceDetails: scheduleForm.recurrenceDetails,
        
        // Source differentiation and medical requirements
        sourceType: 'medical_portal',
        sourceMetadata: {
          portalType: 'healthcare_facility',
          organizationId: user.uid,
          organizationName: user.organizationName || user.displayName,
          departmentId: 'scheduling_department',
          bookingUserRole: 'scheduler'
        },
        
        // Medical requirements
        medicalRequirements: {
          ...medicalRequirements,
          appointmentType: scheduleForm.appointmentType,
          isEmergency: medicalRequirements.priorityLevel === 'emergency',
          requiresWheelchair: medicalRequirements.wheelchairAccessible,
          requiresAssistance: medicalRequirements.assistanceLevel !== 'none'
        },
        
        // Compliance requirements for medical transport
        complianceRequirements: {
          hipaCompliant: true,
          driverBackgroundCheck: true,
          medicalTransportCertification: true,
          insuranceRequired: 'medical_transport',
          documentationLevel: medicalRequirements.priorityLevel === 'emergency' ? 'full' : 'standard'
        },
        
        // Status and metadata
        status: 'scheduled',
        assignmentStatus: 'pending',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        organizationId: user.uid,
        organizationName: user.organizationName || user.displayName,
        
        // Audit trail
        auditLog: [{
          action: 'ride_scheduled',
          timestamp: new Date().toISOString(),
          userId: user.uid,
          details: 'Medical ride scheduled via Advanced Scheduling Portal'
        }]
      };

      // Use the new integration service to create ride with driver availability checking
      const result = await medicalDriverIntegrationService.createMedicalRideWithDriverMatching({
        ...rideData,
        organizationId: user.uid,
        dispatcherId: user.uid
      });

      if (result.success) {
        // Set the scheduled ride data and show driver availability
        setScheduledRideData(result.data);
        setShowDriverAvailability(true);
        
        // Show beautiful toast notification
        toast.success(
          `Medical ride scheduled successfully! Found ${result.data.availableDriverCount} available drivers.`,
          {
            duration: 4000,
            position: 'top-right',
            style: {
              background: '#10B981',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
            },
            icon: '✅',
          }
        );
        
        // Auto-scroll to driver selection section after a brief delay
        setTimeout(() => {
          if (driverSelectionRef.current) {
            driverSelectionRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 500);
        
        // Reset form
        setScheduleForm({
          patientId: '',
          appointmentType: 'Dialysis',
          pickupLocation: '',
          dropoffLocation: '',
          appointmentDate: getTodaysDate(),
          appointmentTime: getNextRoundedHour(),
          bufferTime: '15',
          recurrencePattern: 'none',
          recurrenceDetails: {
            frequency: 'weekly',
            daysOfWeek: [],
            endDate: ''
          }
        });
        setLocationCoordinates({ pickup: null, dropoff: null });
        setMedicalRequirements({
          priorityLevel: 'routine',
          wheelchairAccessible: false,
          stretcherRequired: false,
          oxygenSupport: false,
          assistanceLevel: 'none',
          medicalEquipment: [],
          specialInstructions: '',
          appointmentTypeDetails: '',
          returnTrip: {
            required: false,
            estimatedTime: ''
          }
        });
      } else {
        throw new Error(result.error || 'Failed to schedule ride with driver matching');
      }
    } catch (error) {
      console.error('Error scheduling ride:', error);
      toast.error('Error scheduling ride. Please try again.', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
        },
        icon: '❌',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [scheduleForm, locationCoordinates, user, getTodaysDate, getNextRoundedHour, medicalRequirements]);

  // Handle driver selection
  const handleDriverSelection = async (driver) => {
    if (!scheduledRideData) return;
    
    try {
      const result = await medicalDriverIntegrationService.assignDriverToMedicalRide(
        scheduledRideData.rideId,
        driver.id,
        user.uid
      );
      
      if (result.success) {
        alert(`Driver ${driver.personalInfo?.firstName} ${driver.personalInfo?.lastName} assigned successfully!`);
        setShowDriverAvailability(false);
        setScheduledRideData(null);
      } else {
        alert('Failed to assign driver. Please try again.');
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert('Error assigning driver. Please try again.');
    }
  };

  // Handle driver availability updates
  const handleDriversFound = (drivers) => {
    // Drivers are handled by the DriverAvailabilityChecker component
    console.log('Available drivers found:', drivers.length);
  };

  // Close driver availability view
  const handleCloseDriverAvailability = () => {
    setShowDriverAvailability(false);
    setScheduledRideData(null);
  };

  // Duplicate ride functionality
  const handleDuplicateRide = React.useCallback((ride) => {
    setSelectedRide(ride);
    setEditForm({
      patientId: ride.patientId,
      appointmentType: ride.appointmentType,
      pickupLocation: ride.pickup,
      dropoffLocation: ride.dropoff,
      appointmentTime: ride.time,
      bufferTime: '15',
      recurrencePattern: ride.isRecurring ? 'weekly' : 'none',
      date: new Date().toISOString().split('T')[0] // Set to today for new scheduling
    });
    setShowDuplicateModal(true);
  }, []);

  // Edit ride functionality
  const handleEditRide = React.useCallback((ride) => {
    setSelectedRide(ride);
    setEditForm({
      patientId: ride.patientId,
      appointmentType: ride.appointmentType,
      pickupLocation: ride.pickup,
      dropoffLocation: ride.dropoff,
      appointmentTime: ride.time,
      date: ride.date,
      bufferTime: '15',
      recurrencePattern: ride.isRecurring ? 'weekly' : 'none'
    });
    setShowEditModal(true);
  }, []);

  // Cancel ride functionality
  const handleCancelRide = React.useCallback((ride) => {
    setSelectedRide(ride);
    setCancelReason('');
    setShowCancelModal(true);
  }, []);

  // Submit duplicate ride
  const submitDuplicateRide = async () => {
    if (!editForm.patientId || !editForm.appointmentTime || !editForm.date) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const rideData = {
        patientId: editForm.patientId,
        appointmentType: editForm.appointmentType,
        pickupLocation: { 
          address: editForm.pickupLocation,
          coordinates: editForm.pickupCoordinates
        },
        dropoffLocation: { 
          address: editForm.dropoffLocation,
          coordinates: editForm.dropoffCoordinates
        },
        pickupCoordinates: editForm.pickupCoordinates,
        dropoffCoordinates: editForm.dropoffCoordinates,
        appointmentDateTime: new Date(`${editForm.date}T${editForm.appointmentTime}`).toISOString(),
        status: 'scheduled',
        organizationId: user.uid,
        organizationName: user.organizationName || 'Healthcare Organization',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        isRecurring: editForm.recurrencePattern !== 'none',
        auditLog: [{
          action: 'ride_duplicated',
          timestamp: new Date().toISOString(),
          userId: user.uid,
          userRole: user.role,
          originalRideId: selectedRide.id
        }]
      };

      await addDoc(collection(db, 'medicalRideSchedule'), rideData);
      setShowDuplicateModal(false);
      alert('Ride duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating ride:', error);
      alert('Error duplicating ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit edit ride
  const submitEditRide = async () => {
    if (!editForm.patientId || !editForm.appointmentTime || !editForm.date) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        patientId: editForm.patientId,
        appointmentType: editForm.appointmentType,
        pickupLocation: { 
          address: editForm.pickupLocation,
          coordinates: editForm.pickupCoordinates
        },
        dropoffLocation: { 
          address: editForm.dropoffLocation,
          coordinates: editForm.dropoffCoordinates
        },
        pickupCoordinates: editForm.pickupCoordinates,
        dropoffCoordinates: editForm.dropoffCoordinates,
        appointmentDateTime: new Date(`${editForm.date}T${editForm.appointmentTime}`).toISOString(),
        updatedAt: serverTimestamp(),
        lastModifiedBy: user.uid,
        auditLog: [
          ...(selectedRide.auditLog || []),
          {
            action: 'ride_edited',
            timestamp: new Date().toISOString(),
            userId: user.uid,
            userRole: user.role,
            changes: {
              appointmentDateTime: { old: `${selectedRide.date}T${selectedRide.time}`, new: `${editForm.date}T${editForm.appointmentTime}` },
              pickupLocation: { old: selectedRide.pickup, new: editForm.pickupLocation },
              dropoffLocation: { old: selectedRide.dropoff, new: editForm.dropoffLocation }
            }
          }
        ]
      };

      await updateDoc(doc(db, 'medicalRideSchedule', selectedRide.id), updateData);
      setShowEditModal(false);
      alert('Ride updated successfully!');
    } catch (error) {
      console.error('Error updating ride:', error);
      alert('Error updating ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit cancel ride
  const submitCancelRide = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        status: 'cancelled',
        cancelReason: cancelReason.trim(),
        cancelledAt: serverTimestamp(),
        cancelledBy: user.uid,
        updatedAt: serverTimestamp(),
        auditLog: [
          ...(selectedRide.auditLog || []),
          {
            action: 'ride_cancelled',
            timestamp: new Date().toISOString(),
            userId: user.uid,
            userRole: user.role,
            reason: cancelReason.trim()
          }
        ]
      };

      await updateDoc(doc(db, 'medicalRideSchedule', selectedRide.id), updateData);
      setShowCancelModal(false);
      alert('Ride cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling ride:', error);
      alert('Error cancelling ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ScheduleForm = React.useCallback(() => (
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
                onChange={handlePatientIdChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="Enter patient ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Type</label>
              <select
                value={scheduleForm.appointmentType}
                onChange={handleAppointmentTypeChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                {appointmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <StablePlacesInput
                label="Pickup Location"
                value={scheduleForm.pickupLocation}
                onChange={handlePickupLocationChange}
                onPlaceSelect={handlePickupLocationSelect}
                placeholder="Enter pickup address..."
                required
                id="pickup-location"
              />
            </div>

            <div>
              <StablePlacesInput
                label="Dropoff Location"
                value={scheduleForm.dropoffLocation}
                onChange={handleDropoffLocationChange}
                onPlaceSelect={handleDropoffLocationSelect}
                placeholder="Enter destination address..."
                required
                facilitiesOnly={true}
                id="dropoff-location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
              <input
                type="date"
                value={scheduleForm.appointmentDate}
                onChange={handleAppointmentDateChange}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Time</label>
              <input
                type="time"
                value={scheduleForm.appointmentTime}
                onChange={handleAppointmentTimeChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Buffer Time</label>
              <select
                value={scheduleForm.bufferTime}
                onChange={handleBufferTimeChange}
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
                  onChange={handleRecurrencePatternChange}
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
                  onChange={handleRecurrencePatternChange}
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
                  onChange={handleRecurrencePatternChange}
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

          {/* Medical Transportation Requirements */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Transportation Requirements</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Priority Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority Level</label>
                <select
                  value={medicalRequirements.priorityLevel}
                  onChange={(e) => handleMedicalRequirementChange('priorityLevel', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              {/* Assistance Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Assistance Level Required</label>
                <select
                  value={medicalRequirements.assistanceLevel}
                  onChange={(e) => handleMedicalRequirementChange('assistanceLevel', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value="none">No Assistance</option>
                  <option value="minimal">Minimal Assistance</option>
                  <option value="full">Full Assistance</option>
                </select>
              </div>
            </div>

            {/* Vehicle Requirements */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Vehicle Requirements</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={medicalRequirements.wheelchairAccessible}
                    onChange={(e) => handleMedicalRequirementChange('wheelchairAccessible', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Wheelchair Accessible Vehicle Required</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={medicalRequirements.stretcherRequired}
                    onChange={(e) => handleMedicalRequirementChange('stretcherRequired', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Stretcher-Capable Vehicle Required</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={medicalRequirements.oxygenSupport}
                    onChange={(e) => handleMedicalRequirementChange('oxygenSupport', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Oxygen-Safe Vehicle Required</span>
                </label>
              </div>
            </div>

            {/* Medical Equipment */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Medical Equipment Assistance</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {['wheelchair', 'walker', 'oxygen_tank', 'IV_pole', 'dialysis_equipment', 'stretcher'].map(equipment => (
                  <label key={equipment} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={medicalRequirements.medicalEquipment.includes(equipment)}
                      onChange={() => handleMedicalEquipmentToggle(equipment)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-xs text-gray-700 capitalize">
                      {equipment.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Special Medical Instructions</label>
              <textarea
                value={medicalRequirements.specialInstructions}
                onChange={(e) => handleMedicalRequirementChange('specialInstructions', e.target.value)}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="Any special medical instructions for the driver..."
              />
            </div>

            {/* Return Trip */}
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={medicalRequirements.returnTrip.required}
                  onChange={(e) => handleMedicalRequirementChange('returnTrip', {
                    ...medicalRequirements.returnTrip,
                    required: e.target.checked
                  })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Return Trip Required</span>
              </label>
              
              {medicalRequirements.returnTrip.required && (
                <div className="mt-2 ml-6">
                  <label className="block text-sm font-medium text-gray-700">Estimated Return Time</label>
                  <input
                    type="time"
                    value={medicalRequirements.returnTrip.estimatedTime}
                    onChange={(e) => handleMedicalRequirementChange('returnTrip', {
                      ...medicalRequirements.returnTrip,
                      estimatedTime: e.target.value
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button 
              onClick={handleSaveAsDraft}
              disabled={isSubmitting || !isDraftValid}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isDraftValid && !isSubmitting
                  ? 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={!isDraftValid ? 'Please enter Patient ID and Appointment Type to save draft' : ''}
            >
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </button>
            <button 
              onClick={handleScheduleRide}
              disabled={isSubmitting || !isScheduleValid}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isScheduleValid && !isSubmitting
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={!isScheduleValid ? 'Please complete all required fields to schedule ride' : ''}
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Ride'}
            </button>
          </div>
        </div>
      </div>
    </div>
  ), [scheduleForm, medicalRequirements, handleDayToggle, appointmentTypes, bufferOptions, handlePatientIdChange, handleAppointmentTypeChange, handleAppointmentDateChange, handleAppointmentTimeChange, handleBufferTimeChange, handleRecurrencePatternChange, handlePickupLocationChange, handleDropoffLocationChange, handlePickupLocationSelect, handleDropoffLocationSelect, handleMedicalRequirementChange, handleMedicalEquipmentToggle, handleSaveAsDraft, handleScheduleRide, isSubmitting, isDraftValid, isScheduleValid]);

  const TemplatesTab = React.useCallback(() => (
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
  ), [recurringTemplates, applyTemplate]);

  const ScheduledRidesTab = React.useCallback(() => (
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
                  <button 
                    onClick={() => handleDuplicateRide(ride)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 inline mr-1" />
                    Duplicate
                  </button>
                  <button 
                    onClick={() => handleEditRide(ride)}
                    className="text-gray-600 hover:text-gray-800 text-sm flex items-center"
                  >
                    <PencilSquareIcon className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleCancelRide(ride)}
                    className="text-red-600 hover:text-red-800 text-sm flex items-center"
                  >
                    <XMarkIcon className="h-4 w-4 inline mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ), [scheduledRides, handleDuplicateRide, handleEditRide, handleCancelRide]);

  const DraftsTab = React.useCallback(() => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Saved Drafts</h3>
          <span className="text-sm text-gray-600">
            {loadingDrafts ? 'Loading...' : `${drafts.length} draft${drafts.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="divide-y divide-gray-200">
          {loadingDrafts ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              Loading drafts...
            </div>
          ) : drafts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No drafts saved yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Use "Save as Draft" in the Schedule Ride tab to save incomplete forms.
              </p>
            </div>
          ) : (
            drafts.map(draft => (
              <div key={draft.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        {draft.patientId ? `Patient ${draft.patientId}` : 'Unnamed Draft'} - {draft.appointmentType || 'No Type'}
                      </h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Draft
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {draft.appointmentDate && draft.appointmentTime && (
                        <p>
                          <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                          {draft.appointmentDate} at {draft.appointmentTime}
                        </p>
                      )}
                      {draft.pickupLocation && (
                        <p>From: {draft.pickupLocation}</p>
                      )}
                      {draft.dropoffLocation && (
                        <p>To: {draft.dropoffLocation}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Saved: {draft.createdAt?.toDate ? 
                          draft.createdAt.toDate().toLocaleDateString() + ' at ' + 
                          draft.createdAt.toDate().toLocaleTimeString() 
                          : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleLoadDraft(draft)}
                      className="text-green-600 hover:text-green-800 text-sm flex items-center"
                    >
                      <PencilSquareIcon className="h-4 w-4 inline mr-1" />
                      Load & Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center"
                    >
                      <XMarkIcon className="h-4 w-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ), [drafts, loadingDrafts, handleLoadDraft, handleDeleteDraft]);

  const tabs = [
    { id: 'schedule', name: 'Schedule Ride', icon: PlusIcon },
    { id: 'templates', name: 'Templates', icon: DocumentDuplicateIcon },
    { id: 'scheduled', name: 'Scheduled Rides', icon: CalendarDaysIcon },
    { id: 'drafts', name: 'Drafts', icon: DocumentTextIcon }
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
      {activeTab === 'schedule' && ScheduleForm()}
      {activeTab === 'templates' && TemplatesTab()}
      {activeTab === 'scheduled' && ScheduledRidesTab()}
      {activeTab === 'drafts' && DraftsTab()}

      {/* Driver Availability Section */}
      {showDriverAvailability && scheduledRideData && (
        <div 
          ref={driverSelectionRef} 
          className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6"
          style={{
            borderColor: '#3B82F6',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)',
            animation: 'pulse 2s ease-in-out 1'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 animate-ping"></span>
              Select Driver for Medical Transport
            </h3>
            <button
              onClick={handleCloseDriverAvailability}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Success message */}
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Ride scheduled successfully! Please select a driver from the available options below.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Ride Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Patient:</span> {scheduledRideData.patientId}
              </div>
              <div>
                <span className="font-medium">Appointment:</span> {scheduledRideData.appointmentType}
              </div>
              <div>
                <span className="font-medium">Pickup Time:</span> {new Date(scheduledRideData.pickupDateTime).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">From:</span> {scheduledRideData.pickupLocation.address}
              </div>
            </div>
          </div>

          <DriverAvailabilityChecker
            medicalRideData={scheduledRideData}
            onDriversFound={handleDriversFound}
            onDriverSelected={handleDriverSelection}
            showSelection={true}
            autoRefresh={true}
          />
        </div>
      )}

      {/* Modals */}
      {/* Edit Ride Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Ride</h3>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                      <input
                        type="text"
                        value={editForm.patientId || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, patientId: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Appointment Type</label>
                      <select
                        value={editForm.appointmentType || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, appointmentType: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      >
                        {appointmentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <StablePlacesInput
                      label="Pickup Location"
                      value={editForm.pickupLocation || ''}
                      onChange={(value) => setEditForm(prev => ({ ...prev, pickupLocation: value }))}
                      onPlaceSelect={(placeData) => setEditForm(prev => ({ 
                        ...prev, 
                        pickupLocation: placeData.address,
                        pickupCoordinates: placeData.coordinates
                      }))}
                      placeholder="Enter pickup address..."
                      id="edit-pickup-location"
                    />
                  </div>
                  <div>
                    <StablePlacesInput
                      label="Dropoff Location"
                      value={editForm.dropoffLocation || ''}
                      onChange={(value) => setEditForm(prev => ({ ...prev, dropoffLocation: value }))}
                      onPlaceSelect={(placeData) => setEditForm(prev => ({ 
                        ...prev, 
                        dropoffLocation: placeData.address,
                        dropoffCoordinates: placeData.coordinates
                      }))}
                      placeholder="Enter destination address..."
                      facilitiesOnly={true}
                      id="edit-dropoff-location"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={editForm.date || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <input
                        type="time"
                        value={editForm.appointmentTime || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, appointmentTime: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitEditRide}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Ride Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Duplicate Ride</h3>
                  <button onClick={() => setShowDuplicateModal(false)} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">Create a new ride based on this template. Modify details as needed.</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                      <input
                        type="text"
                        value={editForm.patientId || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, patientId: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Appointment Type</label>
                      <select
                        value={editForm.appointmentType || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, appointmentType: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      >
                        {appointmentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <StablePlacesInput
                      label="Pickup Location"
                      value={editForm.pickupLocation || ''}
                      onChange={(value) => setEditForm(prev => ({ ...prev, pickupLocation: value }))}
                      onPlaceSelect={(placeData) => setEditForm(prev => ({ 
                        ...prev, 
                        pickupLocation: placeData.address,
                        pickupCoordinates: placeData.coordinates
                      }))}
                      placeholder="Enter pickup address..."
                      id="duplicate-pickup-location"
                    />
                  </div>
                  <div>
                    <StablePlacesInput
                      label="Dropoff Location"
                      value={editForm.dropoffLocation || ''}
                      onChange={(value) => setEditForm(prev => ({ ...prev, dropoffLocation: value }))}
                      onPlaceSelect={(placeData) => setEditForm(prev => ({ 
                        ...prev, 
                        dropoffLocation: placeData.address,
                        dropoffCoordinates: placeData.coordinates
                      }))}
                      placeholder="Enter destination address..."
                      facilitiesOnly={true}
                      id="duplicate-dropoff-location"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">New Date</label>
                      <input
                        type="date"
                        value={editForm.date || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <input
                        type="time"
                        value={editForm.appointmentTime || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, appointmentTime: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDuplicateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitDuplicateRide}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Duplicate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Ride Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
                    Cancel Ride
                  </h3>
                  <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Are you sure you want to cancel this ride for Patient {selectedRide?.patientId}?
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm"><strong>Date:</strong> {selectedRide?.date} at {selectedRide?.time}</p>
                    <p className="text-sm"><strong>Type:</strong> {selectedRide?.appointmentType}</p>
                    <p className="text-sm"><strong>Route:</strong> {selectedRide?.pickup} → {selectedRide?.dropoff}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Please provide a reason for cancelling this ride..."
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Keep Ride
                  </button>
                  <button
                    onClick={submitCancelRide}
                    disabled={isSubmitting || !cancelReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Cancelling...' : 'Cancel Ride'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedScheduling;
