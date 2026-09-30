# Community Food Rescue (`food-rescue-app`)

> **University Group Project** — HCI & Mobile Application Development  
> **Current Project Status:** Foundation / Initial Architecture

---

## 📌 Project Description

**Community Food-Bank and Surplus-Food Donation Mobile Application** is a collaborative mobile platform engineered to eliminate food waste by connecting food donors (restaurants, supermarkets, caterers, and individuals) with community food banks, soup kitchens, and local coordinators, facilitated by volunteer drivers for pickup and delivery.

---

## 👥 Planned User Roles

1. **Food Donor**
   - Publish surplus food listings with safety declarations, expiry timestamps, and pickup availability.
   - Real-time tracking of pickup progress with secure verification codes.
   - Comprehensive donation history and environmental impact analytics.

2. **Volunteer Rescue Driver**
   - Smart discovery of rescue opportunities along commuting routes.
   - GPS navigation, multi-stop route optimization, and detour matching.
   - Step-by-step pickup and drop-off verification workflows with mismatch handling.

3. **Community Coordinator**
   - Review and reserve available donations for food banks and distribution centers.
   - Double-reservation prevention and scheduled delivery tracking.
   - Food condition verification, clarification requests, and issue escalation.

---

## 🛠 Technology Stack

- **Framework:** React Native with Expo (SDK 57)
- **Language:** TypeScript (Strict Mode)
- **Routing:** Expo Router (File-based navigation)
- **Runtime:** Node.js
- **Backend / Cloud (Planned):** Firebase Authentication, Cloud Firestore, Cloud Functions, Cloud Storage

---

## 🏗 Project Architecture & Structure

```
food-rescue-app/
├── app/                        # Expo Router file-based screens and layouts
│   ├── _layout.tsx             # Root layout and global providers
│   ├── index.tsx               # Entry / validation screen
│   ├── (auth)/                 # Authentication routes (Future)
│   ├── (donor)/                # Donor feature routes (Future)
│   ├── (volunteer)/            # Volunteer feature routes (Future)
│   └── (coordinator)/          # Coordinator feature routes (Future)
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base atomic design components
│   │   ├── forms/              # Input fields, validators
│   │   ├── food/               # Food cards, item badges
│   │   ├── donation/           # Donation summary, listing widgets
│   │   ├── rescue/             # Active rescue mission components
│   │   ├── maps/               # Map wrappers, route overlays
│   │   ├── notifications/      # Notification list items & badges
│   │   └── feedback/           # Modals, toasts, alerts
│   ├── design-system/          # Design tokens, typography, themes
│   ├── services/               # API & business logic service layer
│   ├── hooks/                  # Custom React hooks
│   ├── contexts/               # Global state contexts
│   ├── store/                  # Client state stores
│   ├── types/                  # Shared TypeScript interfaces & types
│   ├── utils/                  # Utility and helper functions
│   └── constants/              # Global application constants
├── firebase/                   # Firebase configuration & security rules
├── functions/                  # Cloud Functions backend codebase
├── assets/                     # Static media assets (fonts, images, icons)
├── docs/                       # Project specifications and architecture docs
├── tests/                      # Unit, integration, and rule test suites
├── .env.example                # Environment variable template
├── app.json                    # Expo configuration
├── package.json                # Project dependencies and scripts
└── tsconfig.json               # TypeScript compiler options
```

---

## 👥 Member Feature Ownership

See [docs/member-allocation.md](docs/member-allocation.md) for full breakdown.

| Member | Branch | Primary Responsibility |
|---|---|---|
| **Member 1 (Leader)** | `feature/leader-smart-donation` | Smart Donation Management & Core Platform |
| **Member 2** | `feature/smart-routing` | Smart Discovery, Location, Maps & Route Matching |
| **Member 3** | `feature/rescue-notifications` | Volunteer Rescue, Pickup/Delivery & Notifications |
| **Member 4** | `feature/coordinator-trust` | Coordinator, Reservation, Privacy & Issue Management |

---

## 🌿 Git Branching Strategy

See [docs/branch-strategy.md](docs/branch-strategy.md) for details.

```
main (Production/Stable)
  └── dev (Integration)
        ├── feature/leader-smart-donation
        ├── feature/smart-routing
        ├── feature/rescue-notifications
        └── feature/coordinator-trust
```

- Direct commits to `main` are disabled.
- All development takes place in assigned `feature/*` branches and merges into `dev` via Pull Requests.
- Release tags are cut strictly from `dev` to `main`.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)
- Expo Go app on iOS/Android (for testing on physical devices)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd food-rescue-app

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env
```

### Running the App

```bash
# Start the Expo development server
npx expo start

# Run on Android emulator / device
npx expo run:android

# Run on iOS simulator / device
npx expo run:ios

# Run in Web browser
npx expo start --web
```

---

## 📋 Quality & Verification Commands

```bash
# Type check TypeScript files
npx tsc --noEmit

# Diagnose Expo configuration & dependencies
npx expo-doctor
```
