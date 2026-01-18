import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { loggers } from '@/shared/lib/logger';
import type { GetSuggestionsRequest, Suggestion } from '@/features/suggestion/types/suggestion';
import { fetchSuggestions, fetchSuggestionById } from '@/mocks/handlers/suggestionHandler';

const log = loggers.suggestion;

// Query keys for cache management
export const suggestionKeys = {
  all: ['suggestions'] as const,
  lists: () => [...suggestionKeys.all, 'list'] as const,
  list: (request: GetSuggestionsRequest) => [...suggestionKeys.lists(), request] as const,
  details: () => [...suggestionKeys.all, 'detail'] as const,
  detail: (id: string) => [...suggestionKeys.details(), id] as const,
};

/**
 * Hook to fetch personalized suggestions based on user location and behavior
 */
export function useSuggestions(request: GetSuggestionsRequest) {
  return useQuery({
    queryKey: suggestionKeys.list(request),
    queryFn: () => fetchSuggestions(request),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
}

/**
 * Hook to fetch a single suggestion by ID
 */
export function useSuggestion(id: string) {
  return useQuery({
    queryKey: suggestionKeys.detail(id),
    queryFn: () => fetchSuggestionById(id),
    enabled: Boolean(id),
  });
}

/**
 * Hook to prefetch suggestions (for optimistic loading)
 */
export function usePrefetchSuggestions() {
  const queryClient = useQueryClient();

  return (request: GetSuggestionsRequest) => {
    return queryClient.prefetchQuery({
      queryKey: suggestionKeys.list(request),
      queryFn: () => fetchSuggestions(request),
    });
  };
}

/**
 * Hook to invalidate and refetch suggestions
 */
export function useRefreshSuggestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GetSuggestionsRequest) => {
      await queryClient.invalidateQueries({
        queryKey: suggestionKeys.lists(),
      });
      return fetchSuggestions(request);
    },
    onSuccess: (data, request) => {
      queryClient.setQueryData(suggestionKeys.list(request), data);
    },
  });
}

/**
 * Hook to select a suggestion (for navigation)
 */
export function useSelectSuggestion() {
  return useMutation({
    mutationFn: async (suggestion: Suggestion) => {
      log.debug('Selected suggestion:', suggestion.destination);
      return suggestion;
    },
  });
}
