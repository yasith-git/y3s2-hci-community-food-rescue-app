/**
 * Development Fixtures for Testing Volunteer Matching & Map Rendering
 * Clearly labeled and isolated from production data.
 */

import { Donation } from '../../types/donation';
import { VolunteerRoute } from '../../types/route';

const now = new Date();
const inOneHour = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
const inFiveHours = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();

export const DEV_DEFAULT_VOLUNTEER_ROUTE: VolunteerRoute = {
  id: 'dev-route-colombo',
  volunteerId: 'dev-volunteer-1',
  name: 'Fort Station → Borella Junction',
  origin: {
    address: 'Colombo Fort Railway Station, Colombo',
    latitude: 6.9344,
    longitude: 79.8504,
  },
  destination: {
    address: 'Borella Junction, Colombo 08',
    latitude: 6.9147,
    longitude: 79.8778,
  },
  availableFromAt: now.toISOString(),
  availableUntilAt: inFiveHours,
  maxDetourMinutes: 15,
  transportMode: 'DRIVING',
  routeType: 'SAVED',
  isActive: true,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
};

export const DEV_MOCK_DONATIONS: Donation[] = [
  {
    id: 'dev-donation-1',
    donorId: 'donor-101',
    donorName: 'Green Café Colombo',
    food: {
      name: 'Fresh Croissants & Sandwiches',
      category: 'Bakery',
      description: '15 freshly baked cheese croissants and 10 egg sandwiches from our evening display.',
      quantity: 25,
      unit: 'portions',
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    },
    safety: {
      preparedAt: inOneHour,
      storageCondition: 'Room Temperature',
      packagingCondition: 'Individually Sealed',
      allergens: ['Gluten/Wheat', 'Egg', 'Milk/Dairy'],
      donorDeclarationAccepted: true,
      donorDeclarationText: 'Food has been prepared and stored according to safety guidelines.',
    },
    pickup: {
      address: 'Maradana Road, Colombo 10',
      latitude: 6.9272,
      longitude: 79.8614,
      locationSource: 'GPS',
      pickupStartAt: now.toISOString(),
      pickupDeadlineAt: inThreeHours,
      instructions: 'Ask for Chef Sunimal at the side counter.',
    },
    verification: {
      pickupCode: '4829',
      isVerified: false,
    },
    status: 'PUBLISHED',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    publishedAt: now.toISOString(),
    expiresAt: inThreeHours,
  },
  {
    id: 'dev-donation-2',
    donorId: 'donor-102',
    donorName: 'Spice Garden Catering',
    food: {
      name: 'Vegetarian Rice & Curry Boxes',
      category: 'Prepared Meals',
      description: 'Hot vegetarian curry boxes packaged in biodegradable trays.',
      quantity: 30,
      unit: 'boxes',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    },
    safety: {
      preparedAt: now.toISOString(),
      storageCondition: 'Warm / Heated',
      packagingCondition: 'Food-Safe Containers',
      allergens: ['None'],
      donorDeclarationAccepted: true,
      donorDeclarationText: 'Kept in thermal warmers.',
    },
    pickup: {
      address: 'Panchikawatte Rd, Colombo 10',
      latitude: 6.9310,
      longitude: 79.8650,
      locationSource: 'GPS',
      pickupStartAt: now.toISOString(),
      pickupDeadlineAt: inOneHour,
      instructions: 'Park near loading bay #2.',
    },
    verification: {
      pickupCode: '7193',
      isVerified: false,
    },
    status: 'PUBLISHED',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    publishedAt: now.toISOString(),
    expiresAt: inOneHour,
  },
  {
    id: 'dev-donation-3',
    donorId: 'donor-103',
    donorName: 'Cinnamon Grand Buffet',
    food: {
      name: 'Fresh Mixed Fruit Platter Boxes',
      category: 'Fruit',
      description: 'Assorted sliced melon, papaya, and pineapple in sealed boxes.',
      quantity: 18,
      unit: 'containers',
      imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
    },
    safety: {
      preparedAt: now.toISOString(),
      storageCondition: 'Refrigerated',
      packagingCondition: 'Individually Sealed',
      allergens: ['None'],
      donorDeclarationAccepted: true,
      donorDeclarationText: 'Refrigerated and sealed.',
    },
    pickup: {
      address: 'Galle Face Terrace, Colombo 03',
      latitude: 6.9180,
      longitude: 79.8480,
      locationSource: 'GPS',
      pickupStartAt: now.toISOString(),
      pickupDeadlineAt: inFiveHours,
      instructions: 'Contact security desk at service entrance.',
    },
    verification: {
      pickupCode: '3912',
      isVerified: false,
    },
    status: 'PUBLISHED',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    publishedAt: now.toISOString(),
    expiresAt: inFiveHours,
  },
];
