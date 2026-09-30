# System Architecture

> **Status:** UI/UX Shared Foundation Completed (Phase 1)
> **Branch Source:** `dev`

## Architectural Overview

The Community Food-Bank and Surplus-Food Donation Mobile Application is built as a cross-platform mobile solution powered by React Native and Expo Router, with a modular service-oriented architecture designed for seamless Firebase integration in subsequent phases.

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
│   Feature Components, Contexts, Hooks, Store                │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Service Layer (src/services/)            │
│   Auth, Donations, Reservations, Matching, Location, Rescue │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend & Cloud (Future)                 │
│   Firebase Auth, Cloud Firestore, Cloud Functions, Storage  │
└─────────────────────────────────────────────────────────────┘
```

## Shared UI/UX Foundation Layer

All 4 future feature roles (`(auth)`, `(donor)`, `(volunteer)`, `(coordinator)`) **MUST** consume the centralized UI layer:

- **`src/design-system/`**: Source of truth for Colors, Typography, Spacing, Radius, Shadows, Glass tokens, Motion, and Haptics.
- **`src/components/ui/`**: 20+ production-grade shared UI building blocks (`GlassSurface`, `GlassButton`, `GlassCard`, `PrimaryTextInput`, `StatusBadge`, `ScreenContainer`, etc.).

## Module Structure

- **`app/`**: File-based routing with Expo Router grouping routes by role.
- **`src/components/`**: Reusable atomic and feature-specific UI components.
  - **`src/components/ui/`**: Shared Design System components.
- **`src/design-system/`**: Centralized design tokens and theme export.
- **`src/services/`**: Encapsulated business logic and API service wrappers.
- **`src/types/`**: Shared TypeScript domain interfaces and type definitions.
- **`functions/`**: Cloud Functions backend codebase (to be implemented in future phase).
