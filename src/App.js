/* eslint-disable */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { RideProvider } from './contexts/RideContext';
import { DriverOnboardingProvider } from './contexts/DriverOnboardingContext';
import { isAdmin, getRedirectPath } from './services/authService';
import MainLayout from './layouts/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css';

// Lazy load pages for code splitting - reduces initial bundle size
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DriverDashboardPage = lazy(() => import('./pages/DriverDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminSetupPage = lazy(() => import('./pages/AdminSetupPage'));
const SafetySettingsPage = lazy(() => import('./pages/SafetySettingsPage'));
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage'));
const DriverOnboardingPage = lazy(() => import('./pages/DriverOnboardingPage'));
const RideRequestPage = lazy(() => import('./pages/RideRequestPage'));
const RideTrackingPage = lazy(() => import('./pages/RideTrackingPage'));
const RideHistoryPage = lazy(() => import('./pages/RideHistoryPage'));
const MedicalPortalPage = lazy(() => import('./pages/MedicalPortalPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const PressPage = lazy(() => import('./pages/PressPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const SMSTermsPage = lazy(() => import('./pages/SMSTermsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RiderOnboardingPage = lazy(() => import('./pages/RiderOnboardingPage'));

// Lazy load dashboard components (larger bundles)
const AIPricingDashboard = lazy(() => import('./components/ai/AIPricingDashboard'));
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));
const DriverToolsDashboard = lazy(() => import('./components/driver/DriverToolsDashboard'));
const RiderExperienceDashboard = lazy(() => import('./components/rider/RiderExperienceDashboard'));
const SustainabilityDashboard = lazy(() => import('./components/sustainability/SustainabilityDashboard'));
const CommunityDashboard = lazy(() => import('./components/community/CommunityDashboard'));

// Suspense fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="large" text="Loading..." />
  </div>
);

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RideProvider>
            <DriverOnboardingProvider>
              <Router>
                <div className="App">
                <Suspense fallback={<PageLoader />}>
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
                      path="profile" 
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
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
                    
                    <Route 
                      path="medical-portal" 
                      element={
                        <ProtectedRoute>
                          <MedicalPortalPage />
                        </ProtectedRoute>
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
                    
                    <Route 
                      path="rider-onboarding" 
                      element={
                        <ProtectedRoute>
                          <RiderOnboardingPage />
                        </ProtectedRoute>
                      } 
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
                </Suspense>
                </div>
              </Router>
            </DriverOnboardingProvider>
          </RideProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
