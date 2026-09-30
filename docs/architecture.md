# System Architecture

> **Status:** Initial Architecture / Foundation Phase

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
│   Components (UI, Forms, Maps, Rescue, Notifications)       │
│   Design System, Contexts, Hooks, Store                     │
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

## Module Structure

- **`app/`**: File-based routing with Expo Router grouping routes by role.
- **`src/components/`**: Reusable atomic and feature-specific UI components.
- **`src/services/`**: Encapsulated business logic and API service wrappers.
- **`src/types/`**: Shared TypeScript domain interfaces and type definitions.
- **`functions/`**: Cloud Functions backend codebase (to be implemented in future phase).
