/**
 * Centralized Donation Form & Payload Validation
 * Community Food Rescue App
 */

import { CreateDonationInput, Allergen } from '../../types/donation';

export interface DonationValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export function validateFoodStep(food: {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
}): DonationValidationResult {
  const errors: { [key: string]: string } = {};

  if (!food.name || !food.name.trim()) {
    errors.name = 'Please enter a name for the surplus food.';
  } else if (food.name.trim().length < 2) {
    errors.name = 'Food name must be at least 2 characters long.';
  }

  if (!food.category) {
    errors.category = 'Please select a food category.';
  }

  if (food.quantity === undefined || food.quantity === null || isNaN(food.quantity)) {
    errors.quantity = 'Please enter the available quantity.';
  } else if (food.quantity <= 0) {
    errors.quantity = 'Quantity must be greater than 0.';
  }

  if (!food.unit) {
    errors.unit = 'Please select a portion/quantity unit.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSafetyStep(safety: {
  preparedAt?: string;
  storageCondition?: string;
  packagingCondition?: string;
  allergens?: Allergen[];
  donorDeclarationAccepted?: boolean;
}): DonationValidationResult {
  const errors: { [key: string]: string } = {};

  if (!safety.preparedAt) {
    errors.preparedAt = 'Please select when the food was prepared or packaged.';
  }

  if (!safety.storageCondition) {
    errors.storageCondition = 'Please select the current storage condition.';
  }

  if (!safety.packagingCondition) {
    errors.packagingCondition = 'Please select the packaging condition.';
  }

  if (!safety.allergens || safety.allergens.length === 0) {
    errors.allergens = 'Please select applicable allergens or indicate None/Unknown.';
  }

  if (!safety.donorDeclarationAccepted) {
    errors.donorDeclaration =
      'You must confirm the food-handling and accuracy declaration before continuing.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePickupStep(pickup: {
  address?: string;
  pickupStartAt?: string;
  pickupDeadlineAt?: string;
}): DonationValidationResult {
  const errors: { [key: string]: string } = {};

  if (!pickup.address || !pickup.address.trim()) {
    errors.address = 'Please enter or detect the pickup address.';
  }

  if (!pickup.pickupStartAt) {
    errors.pickupStartAt = 'Please select when pickup can start.';
  }

  if (!pickup.pickupDeadlineAt) {
    errors.pickupDeadlineAt = 'Please select the final pickup deadline.';
  }

  if (pickup.pickupStartAt && pickup.pickupDeadlineAt) {
    const start = new Date(pickup.pickupStartAt).getTime();
    const deadline = new Date(pickup.pickupDeadlineAt).getTime();
    const now = new Date().getTime() - 1000 * 60 * 5; // 5 min grace

    if (deadline <= start) {
      errors.pickupDeadlineAt = 'Pickup deadline must be after the start time.';
    } else if (deadline < now) {
      errors.pickupDeadlineAt = 'Pickup deadline cannot be in the past.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateFullDonation(input: CreateDonationInput): DonationValidationResult {
  const foodValidation = validateFoodStep(input.food);
  const safetyValidation = validateSafetyStep(input.safety);
  const pickupValidation = validatePickupStep(input.pickup);

  const errors = {
    ...foodValidation.errors,
    ...safetyValidation.errors,
    ...pickupValidation.errors,
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
