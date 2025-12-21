# Services Layer - Web Admin App

## Overview

The services directory contains modules that encapsulate business logic, external API integrations, and data management for the AnyRyde web administration dashboard. Services are stateless and designed for reuse across the application.

## Service Architecture

```
services/
├── adminService.js           # Admin dashboard operations
├── authService.js            # Firebase authentication
├── firebase.js               # Firebase SDK configuration
├── driverService.js          # Driver management
├── riderService.js           # Rider management
├── paymentService.js         # Payment processing & Stripe
├── notificationService.js    # Push notification management
├── googleMapsService.js      # Maps API integration
├── analyticsService.js       # Analytics and reporting
├── ratingService.js          # Rating & review system
├── safetyService.js          # Safety incident management
└── ...                       # Additional services
```

## Core Services

### Authentication Service

**File**: `authService.js`
- **Purpose**: Firebase Authentication for admin users
- **Features**: Admin login, role verification, session management
- **Key Methods**:
  - `signIn(email, password)` - Authenticate admin user
  - `signOut()` - End admin session
  - `getCurrentUser()` - Get current authenticated user
  - `onAuthStateChanged(callback)` - Listen for auth changes

### Admin Service

**File**: `adminService.js`
- **Purpose**: Admin dashboard operations and data aggregation
- **Features**: Dashboard metrics, user management, system configuration
- **Key Methods**:
  - `getDashboardMetrics()` - Aggregate dashboard statistics
  - `getUserList(filters)` - Get filtered user lists
  - `getSystemHealth()` - Check system status
  - `updateSystemConfig(config)` - Update system settings

### Driver Service

**File**: `driverService.js`
- **Purpose**: Manage driver data and applications
- **Features**: Application review, status management, performance tracking
- **Key Methods**:
  - `getPendingApplications()` - Get pending driver applications
  - `approveDriver(driverId)` - Approve driver application
  - `rejectDriver(driverId, reason)` - Reject driver application
  - `getDriverPerformance(driverId)` - Get driver metrics

### Rider Service

**File**: `riderService.js`
- **Purpose**: Manage rider accounts and activity
- **Features**: Account management, ride history, support tickets
- **Key Methods**:
  - `getRiderList(filters)` - Get rider list with filters
  - `getRideHistory(riderId)` - Get rider's ride history
  - `suspendRider(riderId, reason)` - Suspend rider account
  - `resolveSupport(ticketId)` - Resolve support ticket

## Integration Services

### Google Maps Service

**File**: `googleMapsService.js`
- **Purpose**: Google Maps API integration
- **Features**: Geocoding, distance matrix, place autocomplete
- **Key Methods**:
  - `geocodeAddress(address)` - Convert address to coordinates
  - `getDistanceMatrix(origins, destinations)` - Calculate distances
  - `getPlaceAutocomplete(input)` - Get place suggestions
  - `getReverseGeocode(lat, lng)` - Convert coordinates to address

### Payment Service

**File**: `paymentService.js`
- **Purpose**: Payment processing and Stripe integration
- **Features**: Transactions, refunds, payout management
- **Key Methods**:
  - `getTransactionHistory(filters)` - Get payment transactions
  - `processRefund(transactionId, amount)` - Issue refund
  - `getDriverPayouts(driverId)` - Get driver payout history
  - `updatePayoutSchedule(driverId, schedule)` - Configure payouts

### Notification Service

**File**: `notificationService.js`
- **Purpose**: Push notification management
- **Features**: Send notifications, manage templates, view delivery stats
- **Key Methods**:
  - `sendNotification(userId, message)` - Send to specific user
  - `sendBroadcast(userGroup, message)` - Send to user group
  - `getDeliveryStats()` - Get notification delivery statistics
  - `createTemplate(template)` - Create notification template

## Specialty Services

### Medical Appointment Service

**File**: `medicalAppointmentService.js`
- **Purpose**: Medical transport coordination
- **Features**: Appointment scheduling, HIPAA compliance, provider integration
- **Key Methods**:
  - `scheduleTransport(appointmentData)` - Schedule medical transport
  - `getUpcomingTransports(facilityId)` - Get scheduled transports
  - `cancelTransport(transportId)` - Cancel scheduled transport

### Medical Driver Integration Service

**File**: `medicalDriverIntegrationService.js`
- **Purpose**: Manage medical-certified driver pool
- **Features**: Certification tracking, specialized matching
- **Key Methods**:
  - `getMedicalDrivers()` - Get certified medical drivers
  - `verifyCertification(driverId)` - Verify driver certification
  - `assignMedicalTransport(transportId, driverId)` - Assign driver

### Driver Reliability Service

**File**: `driverReliabilityService.js`
- **Purpose**: Track and manage driver reliability metrics
- **Features**: Reliability scoring, anti-gaming measures
- **Key Methods**:
  - `getReliabilityScore(driverId)` - Get driver reliability score
  - `reportIncident(driverId, incidentType)` - Report reliability issue
  - `applyCooldown(driverId, duration)` - Apply cooldown period

### Safety Service

**File**: `safetyService.js`
- **Purpose**: Safety incident management
- **Features**: Incident reporting, video review, emergency contacts
- **Key Methods**:
  - `getOpenIncidents()` - Get unresolved safety incidents
  - `reviewVideoIncident(incidentId)` - Review video evidence
  - `resolveIncident(incidentId, resolution)` - Close incident
  - `escalateIncident(incidentId)` - Escalate to higher authority

## Usage Pattern

### Import Services

```javascript
import { adminService } from './services/adminService';
import { driverService } from './services/driverService';
import { notificationService } from './services/notificationService';
```

### Call Service Methods

```javascript
// Get dashboard metrics
const metrics = await adminService.getDashboardMetrics();

// Approve a driver application
await driverService.approveDriver(driverId);

// Send notification to all drivers
await notificationService.sendBroadcast('drivers', {
  title: 'New Feature',
  body: 'Check out our new bidding interface!'
});
```

### Response Format

All services return a consistent response format:

```typescript
{
  success: boolean;
  data?: any;
  error?: string | { message: string; code?: string };
}
```

## Design Principles

1. **Stateless**: Services don't maintain internal state
2. **Async/Await**: All external calls use async/await
3. **Error Handling**: Try-catch with structured error responses
4. **Type Safety**: JSDoc type annotations for IDE support
5. **Logging**: Consistent logging for debugging

## Related Documentation

- [Authentication Flow](../../../docs/architecture/authentication-flow.md)
- [Firestore Schema](../../../docs/database/firestore-schema.md)
- [Bidding System](../../../docs/features/bidding-system.md)
