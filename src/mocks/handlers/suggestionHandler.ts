import {
  getSuggestionsRequestSchema,
  getSuggestionsResponseSchema,
  type GetSuggestionsRequest,
  type GetSuggestionsResponse,
} from '@/features/suggestion/types/suggestion';
import { mockSuggestions } from '@/mocks/data/suggestions';

// Simulated network delay range (ms)
const MOCK_DELAY_MIN = 500;
const MOCK_DELAY_MAX = 1500;

/**
 * Simulates network delay for realistic UX testing
 */
function simulateNetworkDelay(): Promise<void> {
  const delay = Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN) + MOCK_DELAY_MIN;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Calculates distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Mock LLM-powered suggestion API
 *
 * This function simulates an LLM backend that analyzes user behavior logs
 * and returns personalized destination suggestions with reasoning.
 *
 * @param request - User's current location and action logs
 * @returns Personalized destination suggestions with LLM-style explanations
 */
export async function fetchSuggestions(
  request: GetSuggestionsRequest
): Promise<GetSuggestionsResponse> {
  // Validate input with Zod
  const validatedRequest = getSuggestionsRequestSchema.parse(request);

  // Simulate network delay
  await simulateNetworkDelay();

  // Filter and sort suggestions based on request
  let filteredSuggestions = [...mockSuggestions];

  // Apply category filters if specified
  if (validatedRequest.preferences?.preferredCategories?.length) {
    const preferred = new Set(validatedRequest.preferences.preferredCategories);
    filteredSuggestions = filteredSuggestions.filter((s) => preferred.has(s.category));
  }

  if (validatedRequest.preferences?.excludeCategories?.length) {
    const excluded = new Set(validatedRequest.preferences.excludeCategories);
    filteredSuggestions = filteredSuggestions.filter((s) => !excluded.has(s.category));
  }

  // Calculate actual distances from current location
  filteredSuggestions = filteredSuggestions.map((suggestion) => ({
    ...suggestion,
    estimatedDistance: Math.round(
      calculateDistance(
        validatedRequest.currentLocation.lat,
        validatedRequest.currentLocation.lng,
        suggestion.coordinates.lat,
        suggestion.coordinates.lng
      )
    ),
  }));

  // Apply max distance filter if specified
  if (validatedRequest.preferences?.maxDistance) {
    filteredSuggestions = filteredSuggestions.filter(
      (s) => s.estimatedDistance <= (validatedRequest.preferences?.maxDistance ?? Infinity)
    );
  }

  // Sort by score (highest first)
  filteredSuggestions.sort((a, b) => b.score - a.score);

  // Limit results
  const maxResults = validatedRequest.preferences?.maxResults ?? 5;
  filteredSuggestions = filteredSuggestions.slice(0, maxResults);

  const response: GetSuggestionsResponse = {
    suggestions: filteredSuggestions,
    generatedAt: new Date().toISOString(),
    modelVersion: 'llm-navi-mock-v1.0.0',
  };

  // Validate output with Zod
  return getSuggestionsResponseSchema.parse(response);
}

/**
 * Mock API for fetching a single suggestion by ID
 */
export async function fetchSuggestionById(id: string) {
  await simulateNetworkDelay();

  const suggestion = mockSuggestions.find((s) => s.id === id);

  if (!suggestion) {
    throw new Error(`Suggestion not found: ${id}`);
  }

  return suggestion;
}
