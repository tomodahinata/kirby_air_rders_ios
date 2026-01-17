import { memo, useCallback } from 'react';
import { View, Text, RefreshControl, FlatList } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

import { SuggestionCard } from './SuggestionCard';
import { SuggestionSkeleton } from '@/shared/components/ui/Skeleton';
import { Button } from '@/shared/components/ui/Button';

import type { Suggestion } from '../types/suggestion';

interface SuggestionListProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  onNavigate: (suggestion: Suggestion) => void;
  selectedId?: string | null;
}

function SuggestionListComponent({
  suggestions,
  isLoading,
  isError,
  error,
  onRefresh,
  isRefreshing,
  onSelectSuggestion,
  onNavigate,
  selectedId,
}: SuggestionListProps) {
  const renderItem = useCallback(
    ({ item }: { item: Suggestion }) => (
      <View className="px-4 mb-4">
        <SuggestionCard
          suggestion={item}
          onPress={onSelectSuggestion}
          onNavigate={onNavigate}
          isSelected={item.id === selectedId}
        />
      </View>
    ),
    [onSelectSuggestion, onNavigate, selectedId]
  );

  const keyExtractor = useCallback((item: Suggestion) => item.id, []);

  // Loading state with skeletons
  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 px-4 gap-4">
        {[1, 2, 3].map((i) => (
          <SuggestionSkeleton key={i} />
        ))}
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <AlertCircle size={48} color="#ef4444" />
        <Text className="text-car-lg font-semibold text-white mt-4 text-center">
          データの取得に失敗しました
        </Text>
        <Text className="text-car-base text-gray-400 mt-2 text-center">
          {error?.message ?? '不明なエラーが発生しました'}
        </Text>
        <View className="mt-6">
          <Button onPress={onRefresh} size="car">
            再試行
          </Button>
        </View>
      </View>
    );
  }

  // Empty state
  if (suggestions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-car-lg font-semibold text-white text-center">
          おすすめの行き先が見つかりませんでした
        </Text>
        <Text className="text-car-base text-gray-400 mt-2 text-center">
          もう少し行動履歴が蓄積されると、より良い提案ができます
        </Text>
        <View className="mt-6">
          <Button onPress={onRefresh} variant="secondary" size="car">
            再読み込み
          </Button>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={suggestions}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#60a5fa"
          colors={['#60a5fa']}
        />
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={5}
    />
  );
}

export const SuggestionList = memo(SuggestionListComponent);
