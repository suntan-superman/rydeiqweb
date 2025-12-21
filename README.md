# 🌐 RydeIQ Web Application

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-10.14-FFCA28?logo=firebase)](https://firebase.google.com/)

Marketing platform, onboarding portal, and administrative dashboard for the RydeIQ transportation marketplace.

---

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Create environment file
cp .env.example .env
# Edit .env with your credentials

# Start development server
yarn start
```

App runs at: http://localhost:3000

---

## 📚 Documentation

- **[Complete Documentation](../docs/apps/web/README.md)** - Full web app guide
- **[Setup Guide](../docs/apps/web/setup.md)** - Detailed setup instructions
- **[Components API](../docs/apps/web/components.md)** - Component reference
- **[Services API](../docs/apps/web/services.md)** - Service layer documentation
- **[Quick Start](../docs/getting-started/quick-start.md)** - Get running in 15 minutes

---

## ✨ Features

- ✅ User & driver onboarding
- ✅ Admin dashboard with analytics
- ✅ Medical dispatcher portal
- ✅ Payment management (Stripe)
- ✅ Document upload & verification
- ✅ Real-time ride monitoring

---

## 🏗️ Tech Stack

- **React 19.1.0** - UI framework
- **TailwindCSS 3.4** - Styling
- **React Query 5.x** - Server state
- **Firebase** - Backend (Auth, Firestore, Storage)
- **Stripe** - Payment processing
- **Google Maps API** - Mapping & geocoding

---

## 📂 Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components (routes)
├── services/       # Business logic & API calls
├── contexts/       # React Context providers
├── layouts/        # Page layouts
└── styles/         # Global styles
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start development server (http://localhost:3000) |
| `yarn build` | Build for production |
| `yarn test` | Run tests |
| `yarn eject` | Eject from CRA (not recommended) |

---

## 🔐 Environment Variables

Required in `.env`:

```bash
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_GOOGLE_MAPS_API_KEY=...
```

See [Environment Variables Reference](../docs/reference/environment-variables.md) for complete list.

---

## 🚢 Deployment

**Netlify:** Automatic deployment on push to `main`

```bash
Build command: yarn build
Publish directory: build
```

**Vercel:** Deploy with Vercel CLI

```bash
vercel deploy --prod
```

See [Deployment Guide](../docs/deployment/web-deployment.md) for detailed instructions.

---

## 🆘 Need Help?

- **Docs:** [Complete Documentation](../docs/)
- **Troubleshooting:** [Common Issues](../docs/apps/web/troubleshooting.md)
- **Slack:** #rydeiq-web

---

## 📊 Project Status

- **Version:** 1.0.0
- **Status:** ✅ Production Ready
- **Test Coverage:** TODO: Add tests (target 70%)
- **Last Updated:** October 28, 2025

---

**For detailed documentation, see [/docs/apps/web/](../docs/apps/web/)**
