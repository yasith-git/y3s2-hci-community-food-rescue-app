# Community Food Rescue

## Project Overview

The Community Food Rescue application is developed for the IT3060 Human Computer Interaction module by Group WD_18.

The aim of the project is to create a mobile platform that connects surplus food donors, volunteer drivers and community authorities so usable food can be collected and transferred to community collection centres instead of being wasted.

## Main User Roles

- Donor
- Volunteer
- Community Authority

## Planned Functional Modules

- Authentication and Role Management
- Smart Donation
- Volunteer Routing and Maps
- Rescue and Notifications
- Community Authority and Collection Centres
- RescueAI
- Surplus Food Summary and Reporting

## Planned Technology Stack

- React Native
- Expo
- TypeScript
- Expo Router
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions

## Repository Structure

- `app/` — Screen navigation hierarchy and layout routing
- `src/` — Modular components, services, contexts, hooks, utilities, constants, and types
- `assets/` — Application images and icon assets
- `supabase/` — Database migrations and Edge Functions
- `tests/` — Test suites and verification specifications

## Branch Strategy

- `main` — stable release branch
- `dev` — integration branch
- `feature/leader-smart-donation` — authentication, donor features, RescueAI and core integration
- `feature/smart-routing` — volunteer routes, location, discovery and maps
- `feature/rescue-notifications` — rescue lifecycle, activity, issues and notifications
- `feature/coordinator-trust` — community authority, collection centres, handover and reporting

## Team

- **Group:** WD_18
- **Module:** IT3060 Human Computer Interaction

## Development Status

The repository has been initialized with the final project structure. Implementation is developed separately in feature branches and integrated through the dev branch.

## Academic Project Notice

This repository is a university academic project developed for educational and demonstration purposes.
