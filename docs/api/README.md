# API Reference Documentation

## Overview
AnyRyde uses Firebase Functions for server-side logic and Firebase client SDKs for direct database access. This document covers all API endpoints, services, and integration patterns.

## Firebase Functions

### Core Functions

#### `sendNotification`
**Purpose**: Send multi-channel notifications (push, SMS, email)

**Trigger**: HTTP callable function

**Parameters**:
```javascript
{
  userId: string,              // Target user ID
  title: string,               // Notification title
  body: string,                // Notification body
  type: string,                // Notification type
  priority: 'low' | 'medium' | 'high' | 'critical',
  channels: ['push' | 'sms' | 'email'],
  data: object,                // Additional payload data
  scheduleAt: timestamp        // Optional scheduling
}
```

**Response**:
```javascript
{
  success: boolean,
  notificationId: string,
  channelsSent: string[],
  error?: string
}
```

#### `onDriverApplicationApproved`
**Purpose**: Trigger notifications when driver applications are approved/rejected

**Trigger**: Firestore document update on `driverApplications/{applicationId}`

**Logic**:
- Detects status changes to 'approved' or 'rejected'
- Sends appropriate notifications via multiple channels
- Updates driver status in database

#### `onRideAccepted`
**Purpose**: Handle ride status changes and notifications

**Trigger**: Firestore document update on `rides/{rideId}`

**Status Changes Handled**:
- `accepted`: Notify rider of driver acceptance
- `driver_arrived`: Notify rider of driver arrival
- `in_progress`: Notify rider of ride start
- `completed`: Notify both parties of completion
- `cancelled`: Notify affected party of cancellation

#### `onNewRideRequest`
**Purpose**: Notify nearby drivers of new ride requests

**Trigger**: Firestore document creation on `rideRequests/{rideRequestId}`

**Logic**:
- Queries nearby available drivers
- Sends notifications based on driver preferences
- Supports SMS notifications for urgent requests

#### `sendScheduledRideReminders`
**Purpose**: Send automated ride reminders

**Trigger**: Scheduled function (every 5 minutes)

**Reminder Types**:
- 24-hour reminder for scheduled rides
- 1-hour reminder for upcoming rides
- Prevents duplicate reminders

#### `onEmergencyAlert`
**Purpose**: Handle emergency alert notifications

**Trigger**: Firestore document creation on `emergencyAlerts/{alertId}`

**Actions**:
- Notifies the user who triggered the alert
- Notifies emergency contacts via SMS
- Creates support ticket for admin review

## Client Services

### Authentication Service (`authService.js`)

#### Core Functions
```javascript
// User registration
export const registerUser = async (userData) => {
  // Creates Firebase Auth user and Firestore document
  // Returns: { success: boolean, user: object, error?: string }
}

// User login
export const loginUser = async (email, password) => {
  // Authenticates user and loads profile data
  // Returns: { success: boolean, user: object, error?: string }
}

// Password reset
export const resetPassword = async (email) => {
  // Sends password reset email
  // Returns: { success: boolean, error?: string }
}

// User role management
export const isAdmin = (user) => {
  // Checks if user has admin privileges
  // Returns: boolean
}

export const getRedirectPath = (user) => {
  // Returns appropriate dashboard path based on user role
  // Returns: string
}
```

#### User Roles
- `customer`: Standard rider account
- `driver`: Driver account with additional permissions
- `admin`: Administrative access
- `super_admin`: Full platform access

### Driver Service (`driverService.js`)

#### Onboarding Functions
```javascript
// Submit driver application
export const submitDriverApplication = async (applicationData) => {
  // Creates driver application document
  // Returns: { success: boolean, applicationId: string, error?: string }
}

// Update driver status
export const updateDriverStatus = async (driverId, status) => {
  // Updates driver availability status
  // Returns: { success: boolean, error?: string }
}

// Upload driver documents
export const uploadDriverDocument = async (driverId, documentType, file) => {
  // Uploads document to Firebase Storage
  // Returns: { success: boolean, downloadURL: string, error?: string }
}
```

#### Driver Status Constants
```javascript
export const DRIVER_STATUS = {
  PENDING: 'pending',
  DOCUMENTS_PENDING: 'documents_pending',
  BACKGROUND_CHECK_PENDING: 'background_check_pending',
  REVIEW_PENDING: 'review_pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  ACTIVE: 'active'
};
```

### Rider Service (`riderService.js`)

#### Ride Management
```javascript
// Create ride request
export const createRideRequest = async (rideData) => {
  // Creates ride request with bidding system
  // Returns: { success: boolean, rideId: string, error?: string }
}

// Create multi-stop ride request
export const createMultiStopRideRequest = async (rideData) => {
  // Creates ride with multiple stops
  // Returns: { success: boolean, rideId: string, error?: string }
}

// Select driver from bids
export const selectDriverBid = async (rideId, driverId, bidAmount) => {
  // Accepts a driver's bid for the ride
  // Returns: { success: boolean, error?: string }
}

// Cancel ride
export const cancelRide = async (rideId, reason) => {
  // Cancels active ride with reason
  // Returns: { success: boolean, error?: string }
}

// Rate driver
export const rateDriver = async (rideId, rating, review) => {
  // Submits driver rating and review
  // Returns: { success: boolean, error?: string }
}
```

#### Fare Calculation
```javascript
// Calculate estimated fare
export const calculateEstimatedFare = async (pickup, destination, rideType) => {
  // Calculates fare based on distance, time, and type
  // Returns: { success: boolean, fare: number, breakdown: object }
}

// Get nearby drivers
export const getNearbyDrivers = async (location, radius) => {
  // Finds available drivers within radius
  // Returns: { success: boolean, drivers: array }
}
```

### Payment Service (`paymentService.js`)

#### Payment Processing
```javascript
// Create payment intent
export const createPaymentIntent = async (amount, currency, metadata) => {
  // Creates Stripe payment intent
  // Returns: { success: boolean, clientSecret: string, error?: string }
}

// Process payment
export const processPayment = async (paymentIntentId) => {
  // Confirms payment with Stripe
  // Returns: { success: boolean, payment: object, error?: string }
}

// Create driver payout
export const createDriverPayout = async (driverId, amount) => {
  // Creates payout to driver's bank account
  // Returns: { success: boolean, payoutId: string, error?: string }
}
```

#### Payment Configuration
```javascript
export const PAYMENT_CONFIG = {
  STRIPE_PUBLISHABLE_KEY: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY: process.env.REACT_APP_STRIPE_SECRET_KEY,
  PLATFORM_FEE_PERCENTAGE: 0.20,  // 20% platform fee
  MINIMUM_PAYOUT_AMOUNT: 25.00,    // $25 minimum payout
  PAYOUT_PROCESSING_DAYS: 2        // 2-day processing time
};
```

### Admin Service (`adminService.js`)

#### Driver Management
```javascript
// Get driver applications
export const getDriverApplications = async (status, limit = 50) => {
  // Retrieves driver applications with filtering
  // Returns: { success: boolean, applications: array, error?: string }
}

// Approve driver application
export const approveDriverApplication = async (applicationId, notes) => {
  // Approves driver application and creates driver document
  // Returns: { success: boolean, error?: string }
}

// Reject driver application
export const rejectDriverApplication = async (applicationId, reason) => {
  // Rejects driver application with reason
  // Returns: { success: boolean, error?: string }
}
```

#### Analytics
```javascript
// Get platform metrics
export const getPlatformMetrics = async (dateRange) => {
  // Retrieves platform-wide metrics
  // Returns: { success: boolean, metrics: object, error?: string }
}

// Get driver metrics
export const getDriverMetrics = async (driverId, dateRange) => {
  // Retrieves driver-specific metrics
  // Returns: { success: boolean, metrics: object, error?: string }
}
```

### Notification Service (`notificationService.js`)

#### Notification Management
```javascript
// Send notification
export const sendNotification = async (userId, notification) => {
  // Sends notification via Firebase Functions
  // Returns: { success: boolean, notificationId: string, error?: string }
}

// Get user notifications
export const getUserNotifications = async (userId, limit = 50) => {
  // Retrieves user's notifications
  // Returns: { success: boolean, notifications: array, error?: string }
}

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  // Marks notification as read
  // Returns: { success: boolean, error?: string }
}
```

### Multi-Stop Ride Service (`multiStopRideService.js`)

#### Multi-Stop Management
```javascript
class MultiStopRideService {
  // Create multi-stop ride
  async createMultiStopRide(rideData) {
    // Creates ride with multiple pickup/dropoff points
  }
  
  // Update stop progress
  async updateStopProgress(rideId, stopIndex, status) {
    // Updates progress for specific stop
  }
  
  // Optimize route
  async optimizeRoute(stops) {
    // Optimizes stop order for efficiency
  }
}
```

### AI Pricing Service (`aiPricingService.js`)

#### Dynamic Pricing
```javascript
class AIPricingService {
  // Initialize pricing models
  async initialize() {
    // Loads historical data and initializes ML models
  }
  
  // Calculate dynamic fare
  async calculateDynamicFare(rideData) {
    // Calculates fare based on demand, time, and location
  }
  
  // Predict demand
  async predictDemand(location, time) {
    // Predicts ride demand for location and time
  }
}
```

## Error Handling

### Standard Error Format
```javascript
{
  success: false,
  error: string,           // Human-readable error message
  code?: string,           // Error code for programmatic handling
  details?: object         // Additional error details
}
```

### Common Error Codes
- `AUTH_REQUIRED`: User must be authenticated
- `PERMISSION_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `PAYMENT_FAILED`: Payment processing failed

## Rate Limiting

### Function Limits
- **sendNotification**: 100 requests/minute per user
- **createRideRequest**: 10 requests/minute per user
- **paymentIntent**: 50 requests/minute per user

### Database Limits
- **Reads**: 50,000/day per project (free tier)
- **Writes**: 20,000/day per project (free tier)
- **Deletes**: 20,000/day per project (free tier)

## Authentication

### Firebase Auth Integration
```javascript
// Get current user
const user = auth.currentUser;

// Listen to auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
```

### Custom Claims
```javascript
// Check user role
const checkUserRole = async (user) => {
  const tokenResult = await user.getIdTokenResult();
  const role = tokenResult.claims.role;
  return role;
};
```

## Testing

### Unit Tests
```javascript
// Example test for auth service
describe('AuthService', () => {
  it('should register user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe'
    };
    
    const result = await registerUser(userData);
    expect(result.success).toBe(true);
    expect(result.user.email).toBe(userData.email);
  });
});
```

### Integration Tests
```javascript
// Example integration test
describe('Ride Flow', () => {
  it('should complete full ride lifecycle', async () => {
    // 1. Create ride request
    const ride = await createRideRequest(rideData);
    
    // 2. Accept ride
    await acceptRide(ride.rideId);
    
    // 3. Complete ride
    await completeRide(ride.rideId);
    
    // 4. Verify completion
    const completedRide = await getRide(ride.rideId);
    expect(completedRide.status).toBe('completed');
  });
});
```

## Deployment

### Firebase Functions Deployment
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:sendNotification

# Deploy with environment variables
firebase functions:config:set app.notification_key="value"
```

### Environment Configuration
```javascript
// Firebase Functions environment
const config = {
  twilio: {
    account_sid: process.env.TWILIO_ACCOUNT_SID,
    auth_token: process.env.TWILIO_AUTH_TOKEN,
    phone_number: process.env.TWILIO_PHONE_NUMBER
  },
  sendgrid: {
    api_key: process.env.SENDGRID_API_KEY
  }
};
```
