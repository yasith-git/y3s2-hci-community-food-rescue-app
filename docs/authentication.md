# Authentication & User Account Architecture

> **Status:** Leader Feature - Phase 1 Foundation Completed
> **Branch Source:** `feature/leader-smart-donation`

---

## 1. Overview

The Community Food Rescue App authentication flow is powered by **Firebase Authentication** combined with a typed **Cloud Firestore** user profile document model (`users/{uid}`).

The authentication subsystem is fully decoupled from the UI presentation layer through `AuthContext` and unified singleton services in `src/services/firebase/`.

---

## 2. Authentication Flow & Lifecycle

```
App Starts
    ↓
Root Splash / Auth Session Check (isLoading)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ If Unauthenticated:                                         │
│   → Onboarding Screen (3-step interactive carousel)        │
│   → Login Screen                                            │
│   → Register Screen (Full Name, Email, Password, Confirm)   │
│   → Forgot Password (Secure neutral reset email)            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ If Authenticated but Email NOT Verified:                    │
│   → Verify Email Screen                                     │
│     - Cooldown timer on resend (45s)                        │
│     - Live reload verification check                        │
│     - Account switcher / Sign out option                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ If Authenticated + Verified but NO Role:                    │
│   → Role Selection Screen                                   │
│     - DONOR (Individuals & Food Businesses)                │
│     - VOLUNTEER (Rescue Drivers & Walkers)                  │
│     - COORDINATOR (Community Food Bank / Pantry Hubs)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Role-Based Routing Gate (Protected Areas):                  │
│   → DONOR:       /(donor)       (Home, Donations, Impact, Profile) │
│   → VOLUNTEER:   /(volunteer)   (Reserved for Volunteer Branch)   │
│   → COORDINATOR: /(coordinator) (Reserved for Coordinator Branch) │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. User Profile Data Model (`users/{uid}`)

```typescript
export type UserRole = 'DONOR' | 'VOLUNTEER' | 'COORDINATOR';

export type VerificationStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole | null;
  verificationStatus: VerificationStatus;
  phoneNumber?: string;
  organizationName?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Coordinator Verification Security
Selecting `COORDINATOR` automatically initializes the `verificationStatus` as `PENDING`. Elevated coordinator hub features require server-confirmed verified status.

---

## 4. Security Rules (`firebase/firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 5. Firebase Configuration via Environment Variables

All Firebase configuration is injected via Expo public environment variables:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

If environment variables are missing, the UI gracefully renders `FirebaseUnconfiguredBanner` without crashing.
