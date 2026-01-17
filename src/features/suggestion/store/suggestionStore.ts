import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Coordinates } from '@/shared/types/common';

interface SuggestionState {
  // Current user location
  currentLocation: Coordinates | null;
  setCurrentLocation: (location: Coordinates) => void;

  // Selected suggestion for navigation
  selectedSuggestionId: string | null;
  selectSuggestion: (id: string) => void;
  clearSelection: () => void;

  // UI state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Filter preferences
  preferredCategories: string[];
  setPreferredCategories: (categories: string[]) => void;
  maxDistance: number | null;
  setMaxDistance: (distance: number | null) => void;
}

export const useSuggestionStore = create<SuggestionState>()(
  devtools(
    (set) => ({
      // Location
      currentLocation: null,
      setCurrentLocation: (location) =>
        set({ currentLocation: location }, false, 'setCurrentLocation'),

      // Selection
      selectedSuggestionId: null,
      selectSuggestion: (id) => set({ selectedSuggestionId: id }, false, 'selectSuggestion'),
      clearSelection: () => set({ selectedSuggestionId: null }, false, 'clearSelection'),

      // UI
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),

      // Filters
      preferredCategories: [],
      setPreferredCategories: (categories) =>
        set({ preferredCategories: categories }, false, 'setPreferredCategories'),
      maxDistance: null,
      setMaxDistance: (distance) => set({ maxDistance: distance }, false, 'setMaxDistance'),
    }),
    { name: 'suggestion-store' }
  )
);
