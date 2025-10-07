# React Application Source

This directory contains the React application source code for the AnyRyde platform.

## Structure

```
src/
├── App.js                    # Main application component with routing
├── components/               # Reusable UI components
│   ├── admin/               # Admin-specific components
│   ├── common/              # Generic components (Button, Input, etc.)
│   ├── driver/              # Driver-specific components
│   ├── forms/               # Form components
│   ├── layout/              # Layout components (Header, Footer)
│   ├── notifications/       # Notification components
│   ├── rider/               # Rider-specific components
│   └── safety/              # Safety-related components
├── contexts/                # React Context providers
│   ├── AuthContext.js       # Authentication state management
│   ├── RideContext.js       # Ride state management
│   └── DriverOnboardingContext.js # Driver onboarding state
├── layouts/                 # Page layout components
│   └── MainLayout.js        # Main application layout
├── pages/                   # Route components
│   ├── HomePage.js          # Landing page
│   ├── LoginPage.js         # User login
│   ├── RegisterPage.js      # User registration
│   ├── DashboardPage.js     # User dashboard
│   ├── DriverDashboardPage.js # Driver dashboard
│   ├── AdminDashboardPage.js # Admin dashboard
│   └── ...                  # Other page components
├── services/                # API and business logic
│   ├── firebase.js          # Firebase configuration
│   ├── authService.js       # Authentication service
│   ├── driverService.js     # Driver management
│   ├── riderService.js      # Ride management
│   ├── notificationService.js # Notification handling
│   └── ...                  # Other services
└── navigation/              # Navigation components
    └── DriverDashboardNavigator.js
```

## Key Components

### Authentication
- **AuthContext**: Manages user authentication state
- **LoginForm**: User login interface
- **RegisterForm**: User registration interface

### Ride Management
- **RideContext**: Manages ride state and operations
- **RideRequestPage**: Ride booking interface
- **RideTrackingPage**: Active ride tracking
- **RideHistoryPage**: Past ride records

### Driver Features
- **DriverOnboardingPage**: Driver application process
- **DriverDashboardPage**: Driver management interface
- **DriverToolsDashboard**: Advanced driver tools

### Admin Features
- **AdminDashboardPage**: Platform management
- **AnalyticsDashboard**: Platform analytics
- **AIPricingDashboard**: AI pricing management

## State Management

The application uses React Context API for state management:

- **AuthContext**: User authentication and profile data
- **RideContext**: Current ride state and operations
- **DriverOnboardingContext**: Driver application progress

## Services

Business logic is organized in service modules:

- **authService**: User authentication and authorization
- **driverService**: Driver management and onboarding
- **riderService**: Ride booking and management
- **notificationService**: Notification handling
- **paymentService**: Payment processing
- **adminService**: Administrative functions

## Styling

- **TailwindCSS**: Utility-first CSS framework
- **Component-based**: Reusable styled components
- **Responsive**: Mobile-first design approach

## Development

### Running the Application
```bash
# Start development server
yarn start

# Build for production
yarn build

# Run tests
yarn test
```

### Code Style
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Functional Components**: Use of React hooks
- **TypeScript**: Type safety (when applicable)

### Testing
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Integration Tests**: Full feature testing

## Dependencies

### Core Dependencies
- **React**: 19.1.0 - UI library
- **React Router**: 6.30.1 - Client-side routing
- **TanStack React Query**: 5.83.0 - Data fetching
- **Firebase**: 10.14.1 - Backend services
- **TailwindCSS**: 3.4.17 - Styling

### Form Handling
- **React Hook Form**: 7.60.0 - Form management
- **React Dropzone**: 14.3.8 - File uploads

### UI Components
- **Framer Motion**: 10.18.0 - Animations
- **React Hot Toast**: 2.5.2 - Notifications
- **React Helmet**: 2.0.5 - Document head management

## Environment Variables

Required environment variables:

```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_key
```

## Performance

### Optimization Strategies
- **Code Splitting**: Route-based lazy loading
- **Memoization**: React.memo and useMemo
- **Bundle Optimization**: Webpack optimization
- **Caching**: React Query for data caching

### Monitoring
- **Firebase Performance**: App performance metrics
- **Bundle Analysis**: Bundle size monitoring
- **Error Tracking**: Error boundary implementation

## Security

### Authentication
- **Firebase Auth**: Secure authentication
- **Custom Claims**: Role-based access control
- **Protected Routes**: Route-level security

### Data Protection
- **Input Validation**: Form validation
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Token-based protection

## Deployment

### Build Process
```bash
# Production build
yarn build

# Analyze bundle
yarn build --analyze
```

### Firebase Hosting
```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Troubleshooting

### Common Issues
1. **Firebase Connection**: Check environment variables
2. **Routing Issues**: Verify route configuration
3. **State Management**: Check context providers
4. **Styling Issues**: Verify TailwindCSS setup

### Debug Mode
```javascript
// Enable debug logging
if (process.env.REACT_APP_DEBUG_MODE) {
  console.log('Debug mode enabled');
}
```

## Contributing

### Code Standards
- Use functional components with hooks
- Follow ESLint and Prettier rules
- Write tests for new features
- Document complex logic

### Pull Request Process
1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit pull request

---

For detailed documentation, see [Web Application Documentation](../docs/web-app/README.md).
