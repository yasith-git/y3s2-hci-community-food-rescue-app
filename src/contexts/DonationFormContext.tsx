/**
 * Donation Step Form Context
 * Preserves multi-step draft inputs across navigation screens
 */

import React, { createContext, useContext, useState } from 'react';
import {
  CreateDonationInput,
  FoodCategory,
  QuantityUnit,
  StorageCondition,
  PackagingCondition,
  Allergen,
} from '../types/donation';

const initialDonationState: CreateDonationInput = {
  donorId: '',
  donorName: '',
  donorOrganization: '',
  food: {
    name: '',
    category: 'Prepared Meals',
    description: '',
    quantity: 1,
    unit: 'portions',
    imageUrl: undefined,
  },
  safety: {
    preparedAt: new Date().toISOString(),
    storageCondition: 'Room Temperature',
    packagingCondition: 'Covered Trays',
    ingredients: '',
    allergens: ['None'],
    donorDeclarationAccepted: false,
    donorDeclarationText:
      'I confirm that the food has been handled in accordance with good hygiene practices and information provided is accurate to the best of my knowledge.',
  },
  pickup: {
    address: '',
    locationSource: 'MANUAL',
    pickupStartAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    pickupDeadlineAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    instructions: '',
  },
  expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
};

interface DonationFormContextType {
  formData: CreateDonationInput;
  updateFood: (food: Partial<CreateDonationInput['food']>) => void;
  updateSafety: (safety: Partial<CreateDonationInput['safety']>) => void;
  updatePickup: (pickup: Partial<CreateDonationInput['pickup']>) => void;
  resetForm: () => void;
}

const DonationFormContext = createContext<DonationFormContextType | undefined>(undefined);

export const DonationFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<CreateDonationInput>(initialDonationState);

  const updateFood = (food: Partial<CreateDonationInput['food']>) => {
    setFormData((prev: CreateDonationInput) => ({
      ...prev,
      food: { ...prev.food, ...food },
    }));
  };

  const updateSafety = (safety: Partial<CreateDonationInput['safety']>) => {
    setFormData((prev: CreateDonationInput) => ({
      ...prev,
      safety: { ...prev.safety, ...safety },
    }));
  };

  const updatePickup = (pickup: Partial<CreateDonationInput['pickup']>) => {
    setFormData((prev: CreateDonationInput) => ({
      ...prev,
      pickup: { ...prev.pickup, ...pickup },
      expiresAt: pickup.pickupDeadlineAt || prev.expiresAt,
    }));
  };

  const resetForm = () => {
    setFormData({
      ...initialDonationState,
      safety: {
        ...initialDonationState.safety,
        preparedAt: new Date().toISOString(),
      },
      pickup: {
        ...initialDonationState.pickup,
        pickupStartAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        pickupDeadlineAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      },
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    });
  };

  return (
    <DonationFormContext.Provider
      value={{
        formData,
        updateFood,
        updateSafety,
        updatePickup,
        resetForm,
      }}
    >
      {children}
    </DonationFormContext.Provider>
  );
};

export function useDonationForm(): DonationFormContextType {
  const context = useContext(DonationFormContext);
  if (!context) {
    throw new Error('useDonationForm must be used within a DonationFormProvider');
  }
  return context;
}
