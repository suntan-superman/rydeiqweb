# AnyRyde Platform Documentation

## Overview
AnyRyde is a comprehensive ride-sharing platform built with React, Firebase, and Node.js. This documentation covers the web application, mobile apps, backend services, and database architecture.

## Quick Links

### Core Documentation
- [Architecture Overview](./architecture/README.md) - System architecture and design patterns
- [API Reference](./api/README.md) - Service layer and Firebase functions
- [Database Schema](./database/README.md) - Firestore collections and rules
- [Authentication](./auth/README.md) - User roles and security

### Application Modules
- [Web Application](./web-app/README.md) - React frontend components and pages
- [Driver Tools](./driver-tools/README.md) - Driver onboarding and management
- [Rider Experience](./rider-experience/README.md) - Ride booking and tracking
- [Admin Dashboard](./admin/README.md) - Platform management tools
- [Notification System](./notifications/README.md) - Multi-channel messaging

### Advanced Features
- [AI Pricing Engine](./ai-pricing/README.md) - Dynamic pricing and matching
- [Multi-Stop Rides](./multi-stop/README.md) - Complex route handling
- [Safety Features](./safety/README.md) - Emergency alerts and monitoring
- [Analytics](./analytics/README.md) - Platform metrics and insights

### Development
- [Setup Guide](./development/setup.md) - Local development environment
- [Deployment](./development/deployment.md) - Production deployment steps
- [Testing](./development/testing.md) - Testing strategies and tools
- [Contributing](./development/contributing.md) - Code standards and workflows

## Tech Stack
- **Frontend**: React 19.1.0, TailwindCSS, React Query
- **Backend**: Firebase Functions (Node.js 18), Firestore
- **Authentication**: Firebase Auth with custom claims
- **Storage**: Firebase Storage for file uploads
- **Notifications**: Firebase Cloud Messaging, Twilio SMS
- **Maps**: Google Maps API integration
- **Payments**: Stripe integration

## Getting Started
1. Clone the repository
2. Install dependencies: `yarn install`
3. Set up environment variables (see [Setup Guide](./development/setup.md))
4. Start development server: `yarn start`

## Project Structure
```
rydeIQWeb/
├── src/                    # React application source
├── functions/              # Firebase Cloud Functions
├── docs/                   # This documentation
├── public/                 # Static assets
└── firebase.json          # Firebase configuration
```

## Support
For questions or issues, refer to the troubleshooting guides in each module or contact the development team.
