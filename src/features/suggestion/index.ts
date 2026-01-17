// Components
export { SuggestionScreen } from './components/SuggestionScreen';
export { SuggestionCard } from './components/SuggestionCard';
export { SuggestionList } from './components/SuggestionList';
export { ScoreBadge } from './components/ScoreBadge';
export { CategoryBadge } from './components/CategoryBadge';
export { ReasonCard } from './components/ReasonCard';

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
