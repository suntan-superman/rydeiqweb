/* eslint-disable */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RideProvider } from './contexts/RideContext';
import { DriverOnboardingProvider } from './contexts/DriverOnboardingContext';
import { isAdmin, getRedirectPath } from './services/authService';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSetupPage from './pages/AdminSetupPage';
import SafetySettingsPage from './pages/SafetySettingsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import AIPricingDashboard from './components/ai/AIPricingDashboard';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import DriverToolsDashboard from './components/driver/DriverToolsDashboard';
import RiderExperienceDashboard from './components/rider/RiderExperienceDashboard';
import SustainabilityDashboard from './components/sustainability/SustainabilityDashboard';
import CommunityDashboard from './components/community/CommunityDashboard';
import DriverOnboardingPage from './pages/DriverOnboardingPage';
import RideRequestPage from './pages/RideRequestPage';
import RideTrackingPage from './pages/RideTrackingPage';
import RideHistoryPage from './pages/RideHistoryPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CareersPage from './pages/CareersPage';
import PressPage from './pages/PressPage';
import ComparePage from './pages/ComparePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import SMSTermsPage from './pages/SMSTermsPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin Route component (requires admin privileges)
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Public Route component (redirects to appropriate dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }
  
  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = getRedirectPath(user);
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

// Not Found component
const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            404 - Page Not Found
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            The page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    </div>
  );
};

// Compare component placeholder
const ComparePageOld = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Compare Ride Prices
          </h1>
          <p className="text-gray-600 mb-8">
            Compare prices between different ride services in your area
          </p>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-500">
              Price comparison feature coming soon! 
              <br />
              Try our ride request feature to see our competitive bidding system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RideProvider>
          <DriverOnboardingProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="careers" element={<CareersPage />} />
                    <Route path="press" element={<PressPage />} />
                    <Route path="compare" element={<ComparePage />} />
                    <Route path="privacy" element={<PrivacyPolicyPage />} />
                    <Route path="terms" element={<TermsOfServicePage />} />
                    <Route path="cookies" element={<CookiePolicyPage />} />
                    <Route path="sms-terms" element={<SMSTermsPage />} />
                    <Route 
                      path="login" 
                      element={
                        <PublicRoute>
                          <LoginPage />
                        </PublicRoute>
                      } 
                    />
                    <Route 
                      path="register" 
                      element={
                        <PublicRoute>
                          <RegisterPage />
                        </PublicRoute>
                      } 
                    />
                    
                    {/* Protected routes */}
                    <Route 
                      path="dashboard" 
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="driver-dashboard" 
                      element={
                        <ProtectedRoute>
                          <DriverDashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="admin-dashboard" 
                      element={
                        <AdminRoute>
                          <AdminDashboardPage />
                        </AdminRoute>
                      } 
                    />
                    
                    {/* Development-only admin route alias */}
                    {process.env.NODE_ENV === 'development' && (
                      <Route 
                        path="admin" 
                        element={<Navigate to="/admin-dashboard" replace />} 
                      />
                    )}
                    
                    <Route 
                      path="admin-setup" 
                      element={
                        <ProtectedRoute>
                          <AdminSetupPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="driver-onboarding" 
                      element={<DriverOnboardingPage />} 
                    />
                    
                    {/* Rider App Routes */}
                    <Route 
                      path="request-ride" 
                      element={
                        <ProtectedRoute>
                          <RideRequestPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="ride-tracking" 
                      element={
                        <ProtectedRoute>
                          <RideTrackingPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="ride-history" 
                      element={
                        <ProtectedRoute>
                          <RideHistoryPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                                <Route
              path="safety-settings"
              element={
                <ProtectedRoute>
                  <SafetySettingsPage />
                </ProtectedRoute>
              }
            />

                        <Route
              path="notification-settings"
              element={
                <ProtectedRoute>
                  <NotificationSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* AI Pricing Dashboard - Admin Only */}
            <Route
              path="ai-pricing-dashboard"
              element={
                <AdminRoute>
                  <AIPricingDashboard />
                </AdminRoute>
              }
            />

            {/* Analytics Dashboard - Admin Only */}
            <Route
              path="admin/analytics"
              element={
                <AdminRoute>
                  <AnalyticsDashboard />
                </AdminRoute>
              }
            />

            {/* Driver Tools Dashboard - Driver Only */}
            <Route
              path="driver/tools"
              element={
                <ProtectedRoute>
                  <DriverToolsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Rider Experience Dashboard - Customer Only */}
            <Route
              path="rider/experience"
              element={
                <ProtectedRoute>
                  <RiderExperienceDashboard />
                </ProtectedRoute>
              }
            />

            {/* Sustainability Dashboard - All Users */}
            <Route
              path="sustainability"
              element={
                <ProtectedRoute>
                  <SustainabilityDashboard />
                </ProtectedRoute>
              }
            />

            {/* Community Dashboard - All Users */}
            <Route
              path="community"
              element={
                <ProtectedRoute>
                  <CommunityDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
                
                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#fff',
                      color: '#374151',
                      fontSize: '14px',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </DriverOnboardingProvider>
        </RideProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
