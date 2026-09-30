# System Architecture

> **Status:** Leader Phase 1 (Authentication + Role Routing + Donor Foundation Completed)
> **Branch Source:** `feature/leader-smart-donation`

## Architectural Overview

The Community Food-Bank and Surplus-Food Donation Mobile Application is built as a cross-platform mobile solution powered by React Native and Expo Router, with a modular service-oriented architecture designed for seamless Firebase integration.

```
┌─────────────────────────────────────────────────────────────┐
│                      Expo Router (app/)                     │
│  (auth)  │  (donor)  │  (volunteer)  │  (coordinator)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Presentation Layer (src/)                  │
│   Shared UI Components (src/components/ui/)                  │
│   Design System Tokens (src/design-system/)                 │
│   Authentication Context & Provider (src/contexts/)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Service Layer (src/services/)            │
│   Firebase Auth, Firestore User Profiles                    │
│   Donations, Reservations, Matching, Location (Future)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend & Cloud Storage                  │
│   Firebase Authentication, Cloud Firestore                  │
└─────────────────────────────────────────────────────────────┘
```

## Shared UI/UX Foundation Layer

All role-based feature modules (`(auth)`, `(donor)`, `(volunteer)`, `(coordinator)`) consume the centralized UI layer:

- **`src/design-system/`**: Source of truth for Colors, Typography, Spacing, Radius, Shadows, Glass tokens, Motion, and Haptics.
- **`src/components/ui/`**: 20+ production-grade shared UI building blocks (`GlassSurface`, `GlassButton`, `GlassCard`, `PrimaryTextInput`, `StatusBadge`, `ScreenContainer`, etc.).

## Authentication & Role-Based Routing Architecture

1. **Authentication State:** Managed through `AuthContext` (`src/contexts/AuthContext.tsx`).
2. **Session Persistence:** Handled by Firebase Auth listeners.
3. **Route Guards (`app/_layout.tsx`):**
   - Unauthenticated users are redirected to `/(auth)/onboarding` or `/(auth)/login`.
   - Users with unverified email addresses are routed to `/(auth)/verify-email`.
   - Users without an assigned role are routed to `/(auth)/role-selection`.
   - Authenticated and verified users are routed directly to their designated workspace (`/(donor)`, `/(volunteer)`, `/(coordinator)`).
4. **User Profiles:** Stored in Cloud Firestore (`users/{uid}`) with role and verification tracking.

## Module Structure

- **`app/`**: File-based routing with Expo Router grouping routes by role:
  - `(auth)/`: Onboarding, login, register, forgot-password, verify-email, role-selection.
  - `(donor)/`: Donor dashboard, donations, impact, and profile tabs.
  - `(volunteer)/`: Volunteer workspace placeholder.
  - `(coordinator)/`: Coordinator workspace placeholder.
- **`src/components/ui/`**: Shared Design System components.
- **`src/contexts/`**: Central React contexts (`AuthContext`).
- **`src/design-system/`**: Centralized design tokens and theme exports.
- **`src/services/firebase/`**: Encapsulated Firebase Auth & Firestore client wrappers.
- **`src/types/`**: Shared TypeScript domain interfaces (`auth.ts`).
- **`src/utils/`**: Validation and error mapping utilities.
