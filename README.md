# AnyRyde Platform

A comprehensive ride-sharing platform built with React, Firebase, and modern web technologies.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Build for production
yarn build
```

## 📚 Documentation

- [Architecture Overview](docs/architecture/README.md) - System design and patterns
- [API Reference](docs/api/README.md) - Service layer and endpoints
- [Database Schema](docs/database/README.md) - Firestore collections and rules
- [Web Application](docs/web-app/README.md) - React frontend components
- [Notification System](docs/notifications/README.md) - Multi-channel messaging
- [Development Setup](docs/development/setup.md) - Local development guide

## 🏗️ Tech Stack

- **Frontend**: React 19.1.0, TailwindCSS, React Query
- **Backend**: Firebase Functions (Node.js 18), Firestore
- **Authentication**: Firebase Auth with custom claims
- **Notifications**: Firebase Cloud Messaging, Twilio SMS, SendGrid
- **Payments**: Stripe integration
- **Maps**: Google Maps API

## 🎯 Features

- **Ride Management**: Request, track, and complete rides
- **Driver Onboarding**: Complete driver application process
- **Multi-Stop Rides**: Support for complex routes
- **Real-time Notifications**: Push, SMS, and email alerts
- **Admin Dashboard**: Platform management tools
- **Safety Features**: Emergency alerts and monitoring
- **AI Pricing**: Dynamic pricing and matching
- **Analytics**: Platform metrics and insights

## 📁 Project Structure

```
rydeIQWeb/
├── src/                    # React application
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React Context providers
│   ├── pages/             # Route components
│   ├── services/          # API and business logic
│   └── layouts/           # Layout components
├── functions/             # Firebase Cloud Functions
├── docs/                  # Documentation
├── public/                # Static assets
└── firebase.json          # Firebase configuration
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- Yarn package manager
- Firebase CLI
- Firebase project setup

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Configure Firebase
firebase login
firebase init

# Start emulators
firebase emulators:start
```

See [Development Setup](docs/development/setup.md) for detailed instructions.

## 🚀 Deployment

```bash
# Deploy to Firebase
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
```

## 📊 Monitoring

- **Firebase Console**: Authentication, Firestore, Functions
- **Stripe Dashboard**: Payment processing
- **Twilio Console**: SMS delivery
- **SendGrid Dashboard**: Email delivery

## 🔒 Security

- Firebase Auth with custom claims
- Firestore security rules
- Input validation and sanitization
- Rate limiting and throttling
- Secure API key management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For questions or issues:
- Check the [documentation](docs/README.md)
- Review [troubleshooting guides](docs/development/setup.md#troubleshooting)
- Contact the development team

---

**AnyRyde Platform** - Smart Transportation Solutions