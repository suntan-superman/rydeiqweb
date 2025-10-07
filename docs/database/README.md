# Database Schema Documentation

## Overview
AnyRyde uses Firestore as its primary database, a NoSQL document database that provides real-time synchronization and offline support.

## Collections Overview

### Core Collections
- `users` - User profiles and authentication data
- `drivers` - Driver-specific information and status
- `driverApplications` - Driver onboarding applications
- `rides` - Active and completed ride records
- `rideRequests` - Ride booking requests
- `notifications` - User notifications and messages
- `payments` - Payment transactions and records
- `earnings` - Driver earnings and payouts

### Administrative Collections
- `admins` - Administrative user accounts
- `analytics` - Platform analytics and metrics
- `systemSettings` - Platform configuration
- `supportTickets` - Customer support requests

### Safety & Emergency Collections
- `emergencyAlerts` - Emergency alert records
- `safetyIncidents` - Safety incident reports
- `messages` - In-app messaging system

## Detailed Schema

### Users Collection (`users`)
```javascript
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // User email address
  displayName: string,            // User's display name
  photoURL: string,               // Profile photo URL
  role: 'customer' | 'driver' | 'admin' | 'super_admin',
  userType: 'passenger' | 'driver',
  isEmailVerified: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // Profile information
  personalInfo: {
    firstName: string,
    lastName: string,
    phone: string,
    dateOfBirth: string,
    address: {
      street: string,
      city: string,
      state: string,
      zipCode: string,
      country: string
    }
  },
  
  // Preferences
  preferences: {
    language: string,
    timezone: string,
    notifications: {
      push: boolean,
      email: boolean,
      sms: boolean
    }
  },
  
  // Status
  isActive: boolean,
  isOnboarded: boolean,
  onboardingCompletedAt: timestamp
}
```

### Drivers Collection (`drivers`)
```javascript
{
  userId: string,                 // Reference to users.uid
  driverId: string,               // Unique driver identifier
  
  // Driver status
  status: 'pending' | 'active' | 'suspended' | 'inactive',
  isOnline: boolean,
  isAvailable: boolean,
  lastSeen: timestamp,
  
  // Vehicle information
  vehicleInfo: {
    make: string,
    model: string,
    year: number,
    color: string,
    licensePlate: string,
    vin: string
  },
  
  // Documents
  documents: {
    driverLicense: {
      number: string,
      expiryDate: string,
      status: 'pending' | 'approved' | 'rejected'
    },
    insurance: {
      provider: string,
      policyNumber: string,
      expiryDate: string,
      status: 'pending' | 'approved' | 'rejected'
    },
    registration: {
      number: string,
      expiryDate: string,
      status: 'pending' | 'approved' | 'rejected'
    }
  },
  
  // Background check
  backgroundCheck: {
    status: 'pending' | 'approved' | 'rejected',
    completedAt: timestamp,
    reportId: string
  },
  
  // Performance metrics
  metrics: {
    totalRides: number,
    rating: number,
    acceptanceRate: number,
    completionRate: number
  },
  
  // Financial
  earnings: {
    totalEarnings: number,
    pendingPayout: number,
    lastPayoutDate: timestamp
  },
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Rides Collection (`rides`)
```javascript
{
  rideId: string,                 // Unique ride identifier
  riderId: string,                // Reference to users.uid
  driverId: string,               // Reference to drivers.userId
  
  // Ride details
  status: 'requested' | 'accepted' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled',
  rideType: 'standard' | 'premium' | 'shared' | 'pet_friendly',
  
  // Locations
  pickup: {
    address: string,
    coordinates: {
      latitude: number,
      longitude: number
    },
    timestamp: timestamp
  },
  destination: {
    address: string,
    coordinates: {
      latitude: number,
      longitude: number
    }
  },
  
  // Multi-stop support
  isMultiStop: boolean,
  stops: [{
    address: string,
    coordinates: {
      latitude: number,
      longitude: number
    },
    order: number,
    completed: boolean,
    completedAt: timestamp
  }],
  currentStopIndex: number,
  stopCount: number,
  
  // Timing
  requestedAt: timestamp,
  acceptedAt: timestamp,
  startedAt: timestamp,
  completedAt: timestamp,
  
  // Fare information
  estimatedFare: number,
  actualFare: number,
  baseFare: number,
  distanceFare: number,
  timeFare: number,
  surgeMultiplier: number,
  
  // Payment
  payment: {
    method: 'card' | 'cash' | 'wallet',
    status: 'pending' | 'completed' | 'failed' | 'refunded',
    transactionId: string,
    totalFare: number,
    driverEarnings: number,
    platformFee: number,
    tip: number
  },
  
  // Driver information
  driverName: string,
  driverPhoto: string,
  vehicleInfo: object,
  
  // Ratings
  riderRating: number,
  driverRating: number,
  riderReview: string,
  driverReview: string,
  
  // Cancellation
  cancelledBy: 'rider' | 'driver' | 'system',
  cancelReason: string,
  cancelledAt: timestamp,
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Notifications Collection (`notifications`)
```javascript
{
  notificationId: string,         // Unique notification identifier
  userId: string,                 // Target user ID
  type: 'ride_update' | 'payment' | 'safety' | 'general',
  priority: 'low' | 'medium' | 'high' | 'critical',
  
  // Content
  title: string,
  body: string,
  data: object,                   // Additional payload data
  
  // Delivery
  channels: ['push' | 'sms' | 'email'],
  status: 'pending' | 'sent' | 'delivered' | 'failed',
  
  // Scheduling
  scheduledAt: timestamp,
  sentAt: timestamp,
  deliveredAt: timestamp,
  
  // Interaction
  isRead: boolean,
  readAt: timestamp,
  actionTaken: string,
  
  createdAt: timestamp
}
```

### Payments Collection (`payments`)
```javascript
{
  paymentId: string,              // Unique payment identifier
  userId: string,                 // Payer user ID
  driverId: string,               // Driver user ID (for payouts)
  rideId: string,                 // Associated ride ID
  
  // Payment details
  type: 'ride_payment' | 'driver_payout' | 'refund' | 'dispute',
  amount: number,
  currency: 'USD',
  
  // Payment method
  paymentMethod: {
    type: 'card' | 'bank_account' | 'wallet',
    last4: string,
    brand: string
  },
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
  
  // External references
  stripePaymentIntentId: string,
  stripeTransferId: string,
  
  // Metadata
  description: string,
  metadata: object,
  
  // Timestamps
  createdAt: timestamp,
  processedAt: timestamp,
  completedAt: timestamp
}
```

## Database Rules

### Security Rules Overview
Firestore security rules enforce data access permissions based on user authentication and roles.

### Key Rule Patterns

#### User Data Access
```javascript
// Users can only access their own data
match /users/{userId} {
  allow read, update: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null;
}
```

#### Driver Data Access
```javascript
// Drivers can only access their own driver document
match /drivers/{driverId} {
  allow read, update: if request.auth != null && request.auth.uid == driverId;
  allow create: if request.auth != null && request.auth.uid == driverId;
}
```

#### Ride Data Access
```javascript
// Users can access rides they're involved in
match /rides/{rideId} {
  allow read, write: if request.auth != null && 
    (resource.data.driverId == request.auth.uid || 
     resource.data.riderId == request.auth.uid);
}
```

#### Admin Access
```javascript
// Admin collections require admin role
match /analytics/{analyticsId} {
  allow read, write: if request.auth != null && 
    request.auth.token.role in ['admin', 'super_admin'];
}
```

## Indexes

### Composite Indexes
Firestore requires composite indexes for complex queries:

#### Notifications Index
```json
{
  "collectionGroup": "notifications",
  "fields": [
    {"fieldPath": "userId", "order": "ASCENDING"},
    {"fieldPath": "createdAt", "order": "DESCENDING"}
  ]
}
```

#### Rides Index (Driver)
```json
{
  "collectionGroup": "rides",
  "fields": [
    {"fieldPath": "driverId", "order": "ASCENDING"},
    {"fieldPath": "createdAt", "order": "DESCENDING"}
  ]
}
```

#### Rides Index (Multi-stop)
```json
{
  "collectionGroup": "rides",
  "fields": [
    {"fieldPath": "isMultiStop", "order": "ASCENDING"},
    {"fieldPath": "currentStopIndex", "order": "ASCENDING"},
    {"fieldPath": "createdAt", "order": "DESCENDING"}
  ]
}
```

## Data Relationships

### Document References
- Users → Drivers: One-to-one relationship via `userId`
- Users → Rides: One-to-many via `riderId` or `driverId`
- Rides → Payments: One-to-many via `rideId`
- Users → Notifications: One-to-many via `userId`

### Denormalization Strategy
- **Driver info in rides**: Store driver name, photo, vehicle info for performance
- **User preferences**: Embed notification preferences in user document
- **Ride summaries**: Store aggregated ride data for analytics

## Performance Considerations

### Query Optimization
- Use composite indexes for multi-field queries
- Limit query results with `.limit()`
- Use pagination for large result sets
- Cache frequently accessed data

### Real-time Listeners
- Unsubscribe from listeners on component unmount
- Use specific document listeners when possible
- Implement listener cleanup to prevent memory leaks

### Batch Operations
- Use batch writes for multiple document updates
- Group related operations in transactions
- Minimize individual document reads

## Backup & Recovery

### Automated Backups
- **Firestore**: Automatic daily backups (7-day retention)
- **Custom Backups**: Export collections to Cloud Storage
- **Point-in-time Recovery**: Available for recent data

### Data Export
```bash
# Export specific collections
gcloud firestore export gs://backup-bucket/backup-path \
  --collection-ids=users,drivers,rides
```

## Monitoring & Analytics

### Database Metrics
- **Read/Write Operations**: Track usage patterns
- **Query Performance**: Monitor slow queries
- **Storage Usage**: Track document count and size
- **Error Rates**: Monitor failed operations

### Custom Analytics
- **User Engagement**: Track active users and sessions
- **Ride Metrics**: Success rates, completion times
- **Financial Metrics**: Revenue, payouts, disputes
- **Safety Metrics**: Incident reports, emergency alerts

## Migration Strategies

### Schema Evolution
- **Additive Changes**: Add new fields without breaking existing data
- **Backward Compatibility**: Maintain support for old field names
- **Data Migration**: Use Cloud Functions for bulk updates

### Example Migration
```javascript
// Migrate user documents to include new field
exports.migrateUsers = functions.https.onCall(async (data, context) => {
  const batch = db.batch();
  const usersSnapshot = await db.collection('users').get();
  
  usersSnapshot.forEach(doc => {
    if (!doc.data().newField) {
      batch.update(doc.ref, { newField: 'defaultValue' });
    }
  });
  
  await batch.commit();
  return { success: true, updated: usersSnapshot.size };
});
```
