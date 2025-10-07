# Web Application Documentation

## Overview
The AnyRyde web application is a React-based progressive web application that serves as the primary interface for riders, drivers, and administrators.

## Technology Stack
- **React**: 19.1.0 with functional components and hooks
- **Routing**: React Router DOM 6.30.1
- **State Management**: React Context API with custom hooks
- **Data Fetching**: TanStack React Query 5.83.0
- **Styling**: TailwindCSS 3.4.17
- **Forms**: React Hook Form 7.60.0
- **Notifications**: React Hot Toast 2.5.2
- **Animations**: Framer Motion 10.18.0

## Application Structure

### Core Components
```
src/
├── App.js                    # Main application component with routing
├── components/               # Reusable UI components
│   ├── common/              # Generic components (Button, Input, etc.)
│   ├── forms/               # Form components
│   ├── layout/              # Layout components (Header, Footer)
│   ├── admin/               # Admin-specific components
│   ├── driver/              # Driver-specific components
│   ├── rider/               # Rider-specific components
│   └── notifications/       # Notification components
├── contexts/                # React Context providers
├── layouts/                 # Page layout components
├── pages/                   # Route components
├── services/                # API and business logic
└── navigation/              # Navigation components
```

## Routing Architecture

### Route Structure
```javascript
// Public routes (no authentication required)
/                           # Home page
/about                      # About page
/contact                    # Contact page
/login                      # Login page
/register                   # Registration page

// Protected routes (authentication required)
/dashboard                  # User dashboard (role-based)
/driver-dashboard           # Driver-specific dashboard
/admin-dashboard            # Admin dashboard
/driver-onboarding          # Driver onboarding flow
/request-ride               # Ride request page
/ride-tracking              # Active ride tracking
/ride-history               # Ride history
/safety-settings            # Safety preferences
/notification-settings      # Notification preferences

// Admin-only routes
/admin/analytics            # Platform analytics
/ai-pricing-dashboard       # AI pricing management

// Feature-specific routes
/driver/tools               # Driver tools dashboard
/rider/experience           # Rider experience dashboard
/sustainability             # Sustainability features
/community                  # Community features
```

### Route Protection
```javascript
// ProtectedRoute: Requires authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// AdminRoute: Requires admin privileges
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAdmin(user)) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

// PublicRoute: Redirects authenticated users
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    const redirectPath = getRedirectPath(user);
    return <Navigate to={redirectPath} />;
  }
  return children;
};
```

## State Management

### Context Providers
```javascript
// Authentication Context
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // ... authentication logic
};

// Ride Context
export const RideProvider = ({ children }) => {
  const [currentRide, setCurrentRide] = useState(null);
  const [rideStatus, setRideStatus] = useState(RIDE_STATUS.NONE);
  // ... ride management logic
};

// Driver Onboarding Context
export const DriverOnboardingProvider = ({ children }) => {
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [applicationData, setApplicationData] = useState({});
  // ... onboarding logic
};
```

### React Query Integration
```javascript
// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Example query usage
const { data: rides, isLoading, error } = useQuery({
  queryKey: ['rides', userId],
  queryFn: () => getRideHistory(userId),
  enabled: !!userId,
});
```

## Component Architecture

### Common Components

#### Button Component
```javascript
const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  children, 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors';
  const variantClasses = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      disabled={loading}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" /> : children}
    </button>
  );
};
```

#### Input Component
```javascript
const Input = ({ 
  label, 
  error, 
  required = false, 
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
```

### Page Components

#### Home Page
```javascript
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">
            AnyRyde - Smart Transportation
          </h1>
          <p className="text-xl mb-8">
            Get where you need to go with our intelligent ride-sharing platform
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" href="/register">
              Get Started
            </Button>
            <Button variant="secondary" size="lg" href="/about">
              Learn More
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16">
        {/* Feature cards */}
      </section>
    </div>
  );
};
```

#### Dashboard Page
```javascript
const DashboardPage = () => {
  const { user } = useAuth();
  const { hasActiveRide, currentRide } = useRide();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.personalInfo?.firstName}!
          </h1>
        </div>
        
        {hasActiveRide ? (
          <RideProgress ride={currentRide} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard
              title="Request a Ride"
              description="Book your next ride"
              icon="🚗"
              href="/request-ride"
            />
            <QuickActionCard
              title="Ride History"
              description="View past rides"
              icon="📋"
              href="/ride-history"
            />
            <QuickActionCard
              title="Safety Settings"
              description="Manage safety preferences"
              icon="🛡️"
              href="/safety-settings"
            />
          </div>
        )}
      </div>
    </div>
  );
};
```

## Form Handling

### React Hook Form Integration
```javascript
const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await loginUser(data.email, data.password);
      if (result.success) {
        toast.success('Login successful!');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Email Address"
        type="email"
        {...register('email', { required: 'Email is required' })}
        error={errors.email?.message}
        required
      />
      
      <Input
        label="Password"
        type="password"
        {...register('password', { required: 'Password is required' })}
        error={errors.password?.message}
        required
      />
      
      <Button type="submit" loading={loading} className="w-full">
        Sign In
      </Button>
    </form>
  );
};
```

## Styling System

### TailwindCSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ]
};
```

### Component Styling Patterns
```javascript
// Utility classes for common patterns
const styles = {
  card: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
  button: 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm',
  input: 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500',
  modal: 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full',
  toast: 'bg-white border border-gray-200 rounded-lg shadow-lg p-4'
};
```

## Performance Optimization

### Code Splitting
```javascript
// Lazy loading for route components
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const DriverDashboardPage = lazy(() => import('./pages/DriverDashboardPage'));

// Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
    <Route path="/driver-dashboard" element={<DriverDashboardPage />} />
  </Routes>
</Suspense>
```

### Memoization
```javascript
// Memoized components for performance
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: expensiveOperation(item)
    }));
  }, [data]);
  
  return <div>{/* Render processed data */}</div>;
});
```

## Error Handling

### Error Boundaries
```javascript
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Global Error Handling
```javascript
// Toast notifications for errors
const handleError = (error) => {
  console.error('Application error:', error);
  
  if (error.code === 'auth/user-not-found') {
    toast.error('User not found. Please check your email.');
  } else if (error.code === 'auth/wrong-password') {
    toast.error('Incorrect password. Please try again.');
  } else {
    toast.error('An unexpected error occurred. Please try again.');
  }
};
```

## Accessibility

### ARIA Labels and Roles
```javascript
const AccessibleButton = ({ children, ...props }) => {
  return (
    <button
      role="button"
      aria-label={props['aria-label']}
      {...props}
    >
      {children}
    </button>
  );
};

const AccessibleModal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);
  
  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {children}
    </div>
  );
};
```

### Keyboard Navigation
```javascript
// Keyboard event handlers
const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    onClose();
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick();
  }
};
```

## Testing

### Component Testing
```javascript
// Example test for Button component
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('renders button with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Integration Testing
```javascript
// Example integration test for login flow
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

describe('Login Flow', () => {
  it('allows user to login successfully', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });
});
```

## Deployment

### Build Configuration
```javascript
// package.json scripts
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### Environment Variables
```bash
# .env.local
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_key
```

### Production Build
```bash
# Build for production
npm run build

# Serve locally
npx serve -s build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```
