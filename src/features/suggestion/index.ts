// Components
export { AISuggestionCard } from './components/AISuggestionCard';

// API hooks
export {
  useSuggestions,
  useSuggestion,
  usePrefetchSuggestions,
  useRefreshSuggestions,
  suggestionKeys,
} from './api/useSuggestions';

// Store
export { useSuggestionStore } from './store/suggestionStore';

// Types
export type {
  Suggestion,
  SuggestionReason,
  DestinationCategory,
  TimeContext,
  UserActionLog,
  GetSuggestionsRequest,
  GetSuggestionsResponse,
} from './types/suggestion';

export {
  suggestionSchema,
  userActionLogSchema,
  getSuggestionsRequestSchema,
  getSuggestionsResponseSchema,
} from './types/suggestion';
