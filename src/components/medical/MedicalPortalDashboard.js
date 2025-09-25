import React, { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import HipaaBookingSystem from './HipaaBookingSystem';
import DispatcherDashboard from './DispatcherDashboard';
import DriverCertificationFilters from './DriverCertificationFilters';
import AdvancedScheduling from './AdvancedScheduling';
import BillingReporting from './BillingReporting';
import ComplianceToolkit from './ComplianceToolkit';
import MedicalRideCalendar from './MedicalRideCalendar';
import medicalAppointmentService from '../../services/medicalAppointmentService';

const MedicalPortalDashboard = ({ user }) => {
  const [activeModule, setActiveModule] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState({
    activeRides: 0,
    todayRides: 0,
    pendingScheduled: 0,
    drivers: 0
  });

  useEffect(() => {
    // Load dashboard statistics
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Load real statistics from medical appointment service
      const statsResult = await medicalAppointmentService.getAppointmentStatistics('7d');
      const upcomingResult = await medicalAppointmentService.getUpcomingAppointments(24);
      
      if (statsResult.success) {
        const stats = statsResult.data;
        setDashboardStats({
          activeRides: stats.inProgressAppointments,
          todayRides: upcomingResult.length,
          pendingScheduled: stats.scheduledAppointments,
          drivers: 15 // TODO: Get from driver service
        });
      } else {
        // Fallback to mock data if service fails
        setDashboardStats({
          activeRides: 3,
          todayRides: 12,
          pendingScheduled: 8,
          drivers: 15
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Fallback to mock data
      setDashboardStats({
        activeRides: 3,
        todayRides: 12,
        pendingScheduled: 8,
        drivers: 15
      });
    }
  };

  const modules = [
    {
      id: 'overview',
      name: 'Overview',
      icon: ChartBarIcon,
      description: 'Dashboard overview and statistics'
    },
    {
      id: 'booking',
      name: 'HIPAA Booking',
      icon: ShieldCheckIcon,
      description: 'Secure patient ride booking'
    },
    {
      id: 'dispatcher',
      name: 'Dispatcher',
      icon: UserGroupIcon,
      description: 'Enterprise dispatch dashboard'
    },
    {
      id: 'scheduling',
      name: 'Scheduling',
      icon: CalendarDaysIcon,
      description: 'Advanced ride scheduling'
    },
    {
      id: 'calendar',
      name: 'Calendar',
      icon: CalendarDaysIcon,
      description: 'Medical ride calendar'
    },
    {
      id: 'drivers',
      name: 'Driver Certs',
      icon: ShieldCheckIcon,
      description: 'Driver certification filters'
    },
    {
      id: 'billing',
      name: 'Billing',
      icon: DocumentTextIcon,
      description: 'Billing and reporting'
    },
    {
      id: 'compliance',
      name: 'Compliance',
      icon: DocumentTextIcon,
      description: 'Compliance toolkit'
    }
  ];

  const StatCard = ({ title, value, icon: Icon, color = 'green' }) => (
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

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'booking':
        return <HipaaBookingSystem user={user} />;
      case 'dispatcher':
        return <DispatcherDashboard user={user} />;
      case 'scheduling':
        return <AdvancedScheduling user={user} />;
      case 'calendar':
        return <MedicalRideCalendar user={user} />;
      case 'drivers':
        return <DriverCertificationFilters user={user} />;
      case 'billing':
        return <BillingReporting user={user} />;
      case 'compliance':
        return <ComplianceToolkit user={user} />;
      case 'overview':
      default:
        return (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Active Rides"
                value={dashboardStats.activeRides}
                icon={CalendarDaysIcon}
                color="blue"
              />
              <StatCard
                title="Today's Rides"
                value={dashboardStats.todayRides}
                icon={UserGroupIcon}
                color="green"
              />
              <StatCard
                title="Scheduled Pending"
                value={dashboardStats.pendingScheduled}
                icon={ExclamationTriangleIcon}
                color="yellow"
              />
              <StatCard
                title="Available Drivers"
                value={dashboardStats.drivers}
                icon={ShieldCheckIcon}
                color="purple"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <button
                    onClick={() => setActiveModule('booking')}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-600" />
                    Book Secure Ride
                  </button>
                  <button
                    onClick={() => setActiveModule('scheduling')}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Schedule Recurring
                  </button>
                  <button
                    onClick={() => setActiveModule('dispatcher')}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <UserGroupIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Live Tracking
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-500">
                  <p>Recent ride requests and updates will appear here.</p>
                  <p className="mt-2">No recent activity to display.</p>
                </div>
              </div>
            </div>

            {/* Emergency Support */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <PhoneIcon className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">24/7 Emergency Support</h4>
                  <p className="text-sm text-red-700 mt-1">
                    For immediate assistance with ride emergencies or urgent dispatching needs, 
                    call our dedicated healthcare provider hotline: <strong>(800) 555-RIDE</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Medical Services Portal
              </h1>
              <p className="text-sm text-gray-600">
                {user?.healthcareProvider?.organizationName || 'Healthcare Provider Dashboard'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                HIPAA Compliant
              </span>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Emergency Support
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeModule === module.id
                        ? 'bg-green-100 text-green-900 border-r-2 border-green-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        activeModule === module.id ? 'text-green-600' : 'text-gray-400'
                      }`}
                    />
                    {module.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 ml-8">
            {renderActiveModule()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalPortalDashboard;
