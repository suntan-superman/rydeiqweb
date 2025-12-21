import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  serverTimestamp,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

class MedicalAppointmentService {
  constructor() {
    this.collection = 'medicalAppointments';
  }

  // Create a new medical appointment
  async createAppointment(appointmentData) {
    try {
      const appointment = {
        ...appointmentData,
        status: 'scheduled',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, this.collection), appointment);
      return { success: true, appointmentId: docRef.id };
    } catch (error) {
      console.error('Error creating medical appointment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get appointments for a specific patient
  async getAppointmentsForPatient(patientId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collection),
        where('patientId', '==', patientId),
        orderBy('scheduledDate', 'asc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching appointments for patient:', error);
      return [];
    }
  }

  // Get appointments for a specific driver
  async getAppointmentsForDriver(driverId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collection),
        where('driverId', '==', driverId),
        where('status', 'in', ['scheduled', 'in_progress']),
        orderBy('scheduledDate', 'asc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching appointments for driver:', error);
      return [];
    }
  }

  // Get all appointments (for admin dashboard)
  async getAllAppointments(limitCount = 100) {
    try {
      const q = query(
        collection(db, this.collection),
        orderBy('scheduledDate', 'asc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching all appointments:', error);
      return [];
    }
  }

  // Get appointments by status
  async getAppointmentsByStatus(status, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', '==', status),
        orderBy('scheduledDate', 'asc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching appointments by status:', error);
      return [];
    }
  }

  // Get appointments for a specific date range
  async getAppointmentsByDateRange(startDate, endDate, limitCount = 100) {
    try {
      const q = query(
        collection(db, this.collection),
        where('scheduledDate', '>=', startDate),
        where('scheduledDate', '<=', endDate),
        orderBy('scheduledDate', 'asc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching appointments by date range:', error);
      return [];
    }
  }

  // Assign driver to appointment
  async assignDriver(appointmentId, driverId, dispatcherId) {
    try {
      await updateDoc(doc(db, this.collection, appointmentId), {
        driverId,
        dispatcherId,
        assignedAt: serverTimestamp(),
        status: 'assigned'
      });
      return { success: true };
    } catch (error) {
      console.error('Error assigning driver:', error);
      return { success: false, error: error.message };
    }
  }

  // Start medical ride
  async startRide(appointmentId, driverId) {
    try {
      await updateDoc(doc(db, this.collection, appointmentId), {
        status: 'in_progress',
        startTime: serverTimestamp(),
        actualPickupTime: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error starting medical ride:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete medical ride
  async completeRide(appointmentId, completionData = {}) {
    try {
      await updateDoc(doc(db, this.collection, appointmentId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        actualDropoffTime: serverTimestamp(),
        ...completionData
      });
      return { success: true };
    } catch (error) {
      console.error('Error completing medical ride:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel appointment
  async cancelAppointment(appointmentId, reason = '') {
    try {
      await updateDoc(doc(db, this.collection, appointmentId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancellationReason: reason
      });
      return { success: true };
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return { success: false, error: error.message };
    }
  }

  // Reschedule appointment
  async rescheduleAppointment(appointmentId, newDate, newTime) {
    try {
      await updateDoc(doc(db, this.collection, appointmentId), {
        scheduledDate: newDate,
        scheduledTime: newTime,
        rescheduledAt: serverTimestamp(),
        status: 'rescheduled'
      });
      return { success: true };
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get appointment statistics
  async getAppointmentStatistics(timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);
      const q = query(
        collection(db, this.collection),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const stats = {
        totalAppointments: appointments.length,
        scheduledAppointments: appointments.filter(apt => apt.status === 'scheduled').length,
        inProgressAppointments: appointments.filter(apt => apt.status === 'in_progress').length,
        completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
        cancelledAppointments: appointments.filter(apt => apt.status === 'cancelled').length,
        rescheduledAppointments: appointments.filter(apt => apt.status === 'rescheduled').length,
        completionRate: this.calculateCompletionRate(appointments),
        averageRideDuration: this.calculateAverageRideDuration(appointments),
        mostCommonAppointmentType: this.getMostCommonAppointmentType(appointments)
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching appointment statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time listener for appointments (for admin dashboard)
  subscribeToAppointments(callback) {
    const q = query(
      collection(db, this.collection),
      where('status', 'in', ['scheduled', 'assigned', 'in_progress']),
      orderBy('scheduledDate', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(appointments);
    }, (error) => {
      console.error('Error in appointments subscription:', error);
      callback([], error);
    });
  }

  // Search appointments by criteria
  async searchAppointments(criteria = {}) {
    try {
      let q = query(collection(db, this.collection));

      // Add filters based on criteria
      if (criteria.patientId) {
        q = query(q, where('patientId', '==', criteria.patientId));
      }
      if (criteria.driverId) {
        q = query(q, where('driverId', '==', criteria.driverId));
      }
      if (criteria.status) {
        q = query(q, where('status', '==', criteria.status));
      }
      if (criteria.appointmentType) {
        q = query(q, where('appointmentType', '==', criteria.appointmentType));
      }
      if (criteria.startDate) {
        q = query(q, where('scheduledDate', '>=', criteria.startDate));
      }
      if (criteria.endDate) {
        q = query(q, where('scheduledDate', '<=', criteria.endDate));
      }

      q = query(q, orderBy('scheduledDate', 'asc'));

      if (criteria.limit) {
        q = query(q, limit(criteria.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error searching appointments:', error);
      return [];
    }
  }

  // Get upcoming appointments for dashboard
  async getUpcomingAppointments(hours = 24) {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
      
      // Temporary workaround: Use simpler query until index is built
      const q = query(
        collection(db, this.collection),
        where('scheduledDate', '>=', now),
        where('scheduledDate', '<=', futureTime),
        orderBy('scheduledDate', 'asc')
      );
      const snapshot = await getDocs(q);
      
      // Filter by status in memory until index is ready
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(appointment => ['scheduled', 'assigned'].includes(appointment.status));
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      return [];
    }
  }

  // Helper method to calculate completion rate
  calculateCompletionRate(appointments) {
    if (appointments.length === 0) return 0;
    const completedCount = appointments.filter(apt => apt.status === 'completed').length;
    return (completedCount / appointments.length) * 100;
  }

  // Helper method to calculate average ride duration
  calculateAverageRideDuration(appointments) {
    const completedAppointments = appointments.filter(apt => apt.status === 'completed' && apt.startTime && apt.completedAt);
    if (completedAppointments.length === 0) return 0;
    
    const totalDuration = completedAppointments.reduce((sum, apt) => {
      const start = apt.startTime.toDate ? apt.startTime.toDate() : new Date(apt.startTime);
      const end = apt.completedAt.toDate ? apt.completedAt.toDate() : new Date(apt.completedAt);
      return sum + (end - start);
    }, 0);
    
    return totalDuration / completedAppointments.length / (1000 * 60); // Convert to minutes
  }

  // Helper method to get most common appointment type
  getMostCommonAppointmentType(appointments) {
    const types = {};
    appointments.forEach(apt => {
      const type = apt.appointmentType || 'Unknown';
      types[type] = (types[type] || 0) + 1;
    });
    
    return Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b, 'Unknown');
  }

  // Helper method to get start date for time range
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  // Format appointment data for display
  formatAppointmentForDisplay(appointment) {
    return {
      ...appointment,
      formattedScheduledDate: appointment.scheduledDate ? 
        new Date(appointment.scheduledDate).toLocaleDateString() : 'N/A',
      formattedScheduledTime: appointment.scheduledTime ? 
        new Date(appointment.scheduledTime).toLocaleTimeString() : 'N/A',
      duration: appointment.startTime && appointment.completedAt ? 
        this.calculateDuration(appointment.startTime, appointment.completedAt) : null
    };
  }

  // Calculate duration between two timestamps
  calculateDuration(startTime, endTime) {
    const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
    const end = endTime.toDate ? endTime.toDate() : new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours}h ${minutes}m`;
  }
}

const medicalAppointmentService = new MedicalAppointmentService();
export default medicalAppointmentService;
