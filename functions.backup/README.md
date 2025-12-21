# Firebase Cloud Functions

This directory contains Firebase Cloud Functions that handle server-side logic for the AnyRyde platform.

## Structure

```
functions/
├── index.js                 # Main functions file
├── services/                # Function services
│   └── notificationOrchestrator.js # Notification orchestration
├── package.json            # Functions dependencies
└── node_modules/           # Dependencies
```

## Functions Overview

### HTTP Callable Functions

#### `sendNotification`
**Purpose**: Send multi-channel notifications (push, SMS, email)

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

### Firestore Triggers

#### `onDriverApplicationApproved`
**Trigger**: Document update on `driverApplications/{applicationId}`
**Purpose**: Handle driver application approval/rejection notifications

#### `onRideAccepted`
**Trigger**: Document update on `rides/{rideId}`
**Purpose**: Handle ride status changes and notifications

#### `onNewRideRequest`
**Trigger**: Document creation on `rideRequests/{rideRequestId}`
**Purpose**: Notify nearby drivers of new ride requests

#### `onEmergencyAlert`
**Trigger**: Document creation on `emergencyAlerts/{alertId}`
**Purpose**: Handle emergency alert notifications

### Scheduled Functions

#### `sendScheduledRideReminders`
**Schedule**: Every 5 minutes
**Purpose**: Send automated ride reminders (24-hour and 1-hour)

## Services

### Notification Orchestrator
**File**: `services/notificationOrchestrator.js`

**Purpose**: Central service for coordinating multi-channel notifications

**Key Features**:
- Channel selection based on user preferences
- Retry logic for failed deliveries
- Delivery status tracking
- Rate limiting and throttling

**Usage**:
```javascript
const orchestrator = require('./services/notificationOrchestrator');

// Send notification
const result = await orchestrator.sendNotification(userId, {
  type: 'ride_accepted',
  priority: 'high',
  title: 'Driver On The Way!',
  body: 'Your driver is coming to pick you up.',
  channels: ['push', 'sms'],
  data: { rideId, driverName, eta }
});
```

## Dependencies

### Core Dependencies
```json
{
  "firebase-admin": "^12.0.0",
  "firebase-functions": "^6.4.0"
}
```

### External Services
```json
{
  "@sendgrid/mail": "^8.1.0",
  "twilio": "^4.20.0",
  "node-fetch": "^2.7.0"
}
```

### Development Dependencies
```json
{
  "firebase-functions-test": "^3.1.0"
}
```

## Configuration

### Environment Variables
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# SendGrid Configuration
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@anyryde.com

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_secret_key
```

### Firebase Functions Config
```bash
# Set configuration
firebase functions:config:set \
  twilio.account_sid="your_sid" \
  twilio.auth_token="your_token" \
  twilio.phone_number="your_number" \
  sendgrid.api_key="your_key"
```

## Development

### Local Development
```bash
# Install dependencies
cd functions
yarn install

# Start Firebase emulators
firebase emulators:start --only functions

# Test functions locally
firebase functions:shell
```

### Testing
```bash
# Run tests
yarn test

# Test specific function
firebase functions:shell
> sendNotification({userId: 'test', title: 'Test', body: 'Test'})
```

### Deployment
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:sendNotification

# Deploy with environment variables
firebase deploy --only functions --project production
```

## Error Handling

### Standard Error Format
```javascript
const handleError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  
  // Log to error tracking service
  // Send alert to development team
  
  return {
    success: false,
    error: error.message,
    code: error.code
  };
};
```

### Retry Logic
```javascript
const retryOperation = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
```

## Performance Optimization

### Function Optimization
```javascript
// Lazy load services to reduce cold start time
let NotificationOrchestrator = null;
const getOrchestrator = () => {
  if (!NotificationOrchestrator) {
    NotificationOrchestrator = require('./services/notificationOrchestrator');
  }
  return NotificationOrchestrator;
};

// Use global options for better performance
setGlobalOptions({
  maxInstances: 10,
  timeoutSeconds: 300,
  memory: '256MB'
});
```

### Database Optimization
```javascript
// Batch operations for better performance
const batch = admin.firestore().batch();
notifications.forEach(notification => {
  const ref = db.collection('notifications').doc();
  batch.set(ref, notification);
});
await batch.commit();
```

## Security

### Authentication
```javascript
// Verify user authentication
exports.sendNotification = onCall(async (request) => {
  const { auth } = request;
  
  if (!auth) {
    throw new Error('User must be authenticated');
  }
  
  // Verify user permissions
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(auth.uid)
    .get();
    
  if (!userDoc.exists) {
    throw new Error('User not found');
  }
  
  // Continue with function logic
});
```

### Input Validation
```javascript
// Validate input parameters
const validateNotificationData = (data) => {
  const { userId, title, body } = data;
  
  if (!userId || !title || !body) {
    throw new Error('Missing required fields: userId, title, body');
  }
  
  if (title.length > 100) {
    throw new Error('Title too long');
  }
  
  if (body.length > 500) {
    throw new Error('Body too long');
  }
};
```

## Monitoring and Logging

### Function Logs
```javascript
// Structured logging
const logFunction = (functionName, data) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    function: functionName,
    data: data
  }));
};

// Error logging
const logError = (functionName, error, context) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    function: functionName,
    error: error.message,
    stack: error.stack,
    context: context
  }));
};
```

### Performance Monitoring
```javascript
// Track function execution time
const trackExecutionTime = async (functionName, operation) => {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const executionTime = Date.now() - startTime;
    
    console.log(`Function ${functionName} executed in ${executionTime}ms`);
    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`Function ${functionName} failed after ${executionTime}ms`);
    throw error;
  }
};
```

## Testing

### Unit Tests
```javascript
// Test notification sending
describe('sendNotification', () => {
  it('should send notification successfully', async () => {
    const mockData = {
      userId: 'test-user',
      title: 'Test Notification',
      body: 'This is a test',
      channels: ['push']
    };
    
    const result = await sendNotification(mockData);
    expect(result.success).toBe(true);
    expect(result.notificationId).toBeDefined();
  });
});
```

### Integration Tests
```javascript
// Test Firestore triggers
describe('onRideAccepted', () => {
  it('should send notification when ride is accepted', async () => {
    // Create test ride document
    const rideRef = admin.firestore().collection('rides').doc();
    await rideRef.set({
      status: 'requested',
      riderId: 'test-rider',
      driverId: 'test-driver'
    });
    
    // Update ride status to trigger function
    await rideRef.update({ status: 'accepted' });
    
    // Wait for function execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify notification was sent
    const notifications = await admin.firestore()
      .collection('notifications')
      .where('userId', '==', 'test-rider')
      .get();
      
    expect(notifications.size).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Function Timeout
```javascript
// Increase timeout for long-running functions
exports.longRunningFunction = onCall({
  timeoutSeconds: 540,  // 9 minutes
  memory: '512MB'
}, async (request) => {
  // Function logic
});
```

#### 2. Memory Issues
```javascript
// Optimize memory usage
const processLargeDataset = async (data) => {
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    await processBatch(batch);
  }
};
```

#### 3. Cold Start Optimization
```javascript
// Keep functions warm
exports.keepWarm = onSchedule('every 1 minutes', async () => {
  console.log('Keeping functions warm');
});
```

### Debug Mode
```javascript
// Enable debug logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';

const debugLog = (message, data) => {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data);
  }
};
```

## Deployment Checklist

- [ ] Set environment variables
- [ ] Update Firebase Functions config
- [ ] Test functions locally
- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Deploy to production
- [ ] Monitor function logs
- [ ] Verify external service integrations

## Best Practices

1. **Keep functions focused**: Each function should have a single responsibility
2. **Use proper error handling**: Implement comprehensive error handling
3. **Optimize for cold starts**: Minimize initialization time
4. **Implement retry logic**: Handle transient failures gracefully
5. **Monitor performance**: Track execution time and memory usage
6. **Secure sensitive data**: Use Firebase Functions config for secrets
7. **Test thoroughly**: Write unit and integration tests
8. **Document functions**: Provide clear documentation for each function

---

For detailed API documentation, see [API Reference](../docs/api/README.md).
