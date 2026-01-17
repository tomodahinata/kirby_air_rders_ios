import { z } from 'zod';

import { coordinatesSchema } from '@/shared/types/common';

// Category of destinations
export const destinationCategorySchema = z.enum([
  'restaurant',
  'cafe',
  'shopping',
  'entertainment',
  'nature',
  'culture',
  'sports',
  'work',
  'home',
  'other',
]);

export type DestinationCategory = z.infer<typeof destinationCategorySchema>;

// Time context for the suggestion
export const timeContextSchema = z.enum([
  'morning',
  'lunch',
  'afternoon',
  'evening',
  'night',
  'weekend',
  'holiday',
]);

export type TimeContext = z.infer<typeof timeContextSchema>;

// Reason why this destination is recommended
export const suggestionReasonSchema = z.object({
  primary: z.string().min(1).describe('Main reason for the recommendation'),
  factors: z.array(z.string()).describe('Contributing factors'),
  confidence: z.number().min(0).max(1).describe('AI confidence in this reason'),
});

export type SuggestionReason = z.infer<typeof suggestionReasonSchema>;

// Main suggestion schema
export const suggestionSchema = z.object({
  id: z.string().uuid(),
  destination: z.string().min(1).describe('Name of the destination'),
  address: z.string().min(1).describe('Full address'),
  coordinates: coordinatesSchema,
  category: destinationCategorySchema,
  score: z.number().min(0).max(100).describe('Recommendation score 0-100'),
  reason: suggestionReasonSchema,
  estimatedDistance: z.number().positive().describe('Distance in meters'),
  estimatedDuration: z.number().positive().describe('Duration in minutes'),
  imageUrl: z.string().url().optional(),
  timeContext: timeContextSchema,
  visitCount: z.number().int().nonnegative().describe('Previous visit count'),
  lastVisited: z.string().datetime().nullable(),
});

export type Suggestion = z.infer<typeof suggestionSchema>;

// User action log schema (input for LLM)
export const userActionLogSchema = z.object({
  userId: z.string(),
  timestamp: z.string().datetime(),
  action: z.enum(['visit', 'search', 'favorite', 'share', 'navigate']),
  destination: z.string(),
  category: destinationCategorySchema,
  coordinates: coordinatesSchema,
  duration: z.number().optional().describe('Duration of visit in minutes'),
  rating: z.number().min(1).max(5).optional(),
});

export type UserActionLog = z.infer<typeof userActionLogSchema>;

// Request schema for getting suggestions
export const getSuggestionsRequestSchema = z.object({
  currentLocation: coordinatesSchema,
  userActionLogs: z.array(userActionLogSchema),
  preferences: z
    .object({
      maxDistance: z.number().positive().optional(),
      preferredCategories: z.array(destinationCategorySchema).optional(),
      excludeCategories: z.array(destinationCategorySchema).optional(),
      maxResults: z.number().int().positive().max(10).default(5),
    })
    .optional(),
});

export type GetSuggestionsRequest = z.infer<typeof getSuggestionsRequestSchema>;

// Response schema
export const getSuggestionsResponseSchema = z.object({
  suggestions: z.array(suggestionSchema),
  generatedAt: z.string().datetime(),
  modelVersion: z.string(),
});

export type GetSuggestionsResponse = z.infer<typeof getSuggestionsResponseSchema>;
