import { memo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Navigation, Clock, MapPin } from 'lucide-react-native';

import { ScoreBadge } from './ScoreBadge';
import { CategoryBadge } from './CategoryBadge';
import { ReasonCard } from './ReasonCard';

import type { Suggestion } from '../types/suggestion';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onPress: (suggestion: Suggestion) => void;
  onNavigate: (suggestion: Suggestion) => void;
  isSelected?: boolean;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}分`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
}

function SuggestionCardComponent({
  suggestion,
  onPress,
  onNavigate,
  isSelected = false,
}: SuggestionCardProps) {
  const handlePress = useCallback(() => {
    onPress(suggestion);
  }, [suggestion, onPress]);

  const handleNavigate = useCallback(() => {
    onNavigate(suggestion);
  }, [suggestion, onNavigate]);

  return (
    <Pressable
      onPress={handlePress}
      className={`
        bg-surface rounded-2xl p-4 border-2
        ${isSelected ? 'border-primary-500' : 'border-gray-700'}
        active:bg-surface-light
      `}
    >
      {/* Header: Score and Category */}
      <View className="flex-row justify-between items-start mb-3">
        <ScoreBadge score={suggestion.score} size="lg" />
        <CategoryBadge category={suggestion.category} />
      </View>

      {/* Destination name */}
      <Text className="text-car-xl font-bold text-white mb-1">{suggestion.destination}</Text>

      {/* Address */}
      <View className="flex-row items-center gap-1 mb-4">
        <MapPin size={14} color="#9ca3af" />
        <Text className="text-car-sm text-gray-400 flex-1" numberOfLines={1}>
          {suggestion.address}
        </Text>
      </View>

      {/* AI Reason */}
      <ReasonCard reason={suggestion.reason} />

      {/* Footer: Distance, Duration, Navigate button */}
      <View className="flex-row items-center justify-between mt-4">
        <View className="flex-row items-center gap-4">
          {/* Distance */}
          <View className="flex-row items-center gap-1.5">
            <MapPin size={18} color="#60a5fa" />
            <Text className="text-car-base font-medium text-primary-400">
              {formatDistance(suggestion.estimatedDistance)}
            </Text>
          </View>

          {/* Duration */}
          <View className="flex-row items-center gap-1.5">
            <Clock size={18} color="#22c55e" />
            <Text className="text-car-base font-medium text-green-400">
              {formatDuration(suggestion.estimatedDuration)}
            </Text>
          </View>
        </View>

        {/* Navigate button */}
        <Pressable
          onPress={handleNavigate}
          className="
            flex-row items-center gap-2
            bg-primary-600 active:bg-primary-700
            px-5 py-3 rounded-xl
            min-h-[52px]
          "
        >
          <Navigation size={20} color="#ffffff" />
          <Text className="text-car-base font-semibold text-white">ナビ開始</Text>
        </Pressable>
      </View>

      {/* Visit history indicator */}
      {suggestion.visitCount > 0 && (
        <View className="mt-3 pt-3 border-t border-gray-700">
          <Text className="text-sm text-gray-500">
            過去{suggestion.visitCount}回訪問
            {suggestion.lastVisited && (
              <> • 最終訪問: {new Date(suggestion.lastVisited).toLocaleDateString('ja-JP')}</>
            )}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export const SuggestionCard = memo(SuggestionCardComponent);
