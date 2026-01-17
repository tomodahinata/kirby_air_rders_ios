import { useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Sparkles } from 'lucide-react-native';

import { SuggestionList } from './SuggestionList';
import { useSuggestions, useRefreshSuggestions } from '../api/useSuggestions';
import { useSuggestionStore } from '../store/suggestionStore';
import { mockUserActionLogs } from '@/mocks/data/suggestions';

import type { Suggestion, GetSuggestionsRequest, DestinationCategory } from '../types/suggestion';

export function SuggestionScreen() {
  const {
    currentLocation,
    selectedSuggestionId,
    selectSuggestion,
    preferredCategories,
    maxDistance,
  } = useSuggestionStore();

  // Build request with current state
  const request: GetSuggestionsRequest = useMemo(
    () => ({
      // Default to Shibuya station if no location
      currentLocation: currentLocation ?? { lat: 35.658, lng: 139.7016 },
      userActionLogs: mockUserActionLogs,
      preferences: {
        maxResults: 5,
        ...(preferredCategories.length > 0 && {
          preferredCategories: preferredCategories as DestinationCategory[],
        }),
        ...(maxDistance && { maxDistance }),
      },
    }),
    [currentLocation, preferredCategories, maxDistance]
  );

  const { data, isLoading, isError, error, refetch, isRefetching } = useSuggestions(request);

  const refreshMutation = useRefreshSuggestions();

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleSelectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      selectSuggestion(suggestion.id);
    },
    [selectSuggestion]
  );

  const handleNavigate = useCallback((suggestion: Suggestion) => {
    // In a real app, this would start navigation
    console.log('Starting navigation to:', suggestion.destination);
    // Could integrate with Apple Maps / Google Maps here
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-surface-dark" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-800">
        <View className="flex-row items-center gap-3">
          <View className="bg-primary-600/20 rounded-full p-2">
            <Sparkles size={24} color="#60a5fa" />
          </View>
          <View className="flex-1">
            <Text className="text-car-xl font-bold text-white">おすすめの行き先</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <MapPin size={14} color="#9ca3af" />
              <Text className="text-car-sm text-gray-400">渋谷駅周辺</Text>
            </View>
          </View>
        </View>

        {/* Model info badge */}
        {data?.modelVersion && (
          <View className="mt-3 flex-row items-center">
            <View className="bg-gray-800 rounded-full px-3 py-1">
              <Text className="text-xs text-gray-400">AI: {data.modelVersion}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Suggestion List */}
      <View className="flex-1">
        <SuggestionList
          suggestions={data?.suggestions ?? []}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRefresh={handleRefresh}
          isRefreshing={isRefetching || refreshMutation.isPending}
          onSelectSuggestion={handleSelectSuggestion}
          onNavigate={handleNavigate}
          selectedId={selectedSuggestionId}
        />
      </View>
    </SafeAreaView>
  );
}
