# Database Schema (Planned)

> **Status:** Draft / Initial Architecture Specification

## Collections Overview (Firestore - Planned)

- **`users`**: User profiles (Donors, Volunteers, Community Coordinators, Admins).
- **`donations`**: Food donation listings, items, allergen info, expiry timestamps, pickup windows, state.
- **`reservations`**: Coordinator claims on donation listings, status, confirmation timestamps.
- **`rescues`**: Volunteer rescue missions, route mappings, pickup/delivery verification codes, audit logs.
- **`routes`**: Volunteer saved routes, origin, destination, detour tolerance, schedule.
- **`notifications`**: User notifications, delivery status, deep link payload, read state.
- **`issues`**: Reported food condition concerns, discrepancy logs, resolution state.
