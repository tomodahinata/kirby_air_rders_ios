// App-wide constants
export const APP_NAME = 'LLM-Navi';

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.llm-navi.local',
  TIMEOUT: 30000,
} as const;

// Suggestion configuration
export const SUGGESTION_CONFIG = {
  MAX_SUGGESTIONS: 5,
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// UI configuration for car displays
export const CAR_UI_CONFIG = {
  MIN_TOUCH_SIZE: 48,
  LARGE_TOUCH_SIZE: 64,
  BASE_FONT_SIZE: 18,
  ANIMATION_DURATION: 200,
} as const;
