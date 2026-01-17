import { useCallback, useState } from 'react';
import { View, Text, SafeAreaView, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, BookOpen, Filter } from 'lucide-react-native';

import { Button } from '@/shared/components/ui/Button';
import { JournalEntryCard, useJournalStore, selectEntries } from '@/features/journal';
import type { ManualJournalEntry, JournalSortOption } from '@/features/journal';

const SORT_OPTIONS: { value: JournalSortOption; label: string }[] = [
  { value: 'visited_at_desc', label: '訪問日（新しい順）' },
  { value: 'visited_at_asc', label: '訪問日（古い順）' },
  { value: 'rating_desc', label: '評価（高い順）' },
  { value: 'rating_asc', label: '評価（低い順）' },
  { value: 'created_at_desc', label: '登録日（新しい順）' },
];

export default function JournalScreen() {
  const router = useRouter();
  const entries = useJournalStore(selectEntries);
  const getFilteredEntries = useJournalStore((s) => s.getFilteredEntries);

  const [sortOption, setSortOption] = useState<JournalSortOption>('visited_at_desc');
  const [showSortOptions, setShowSortOptions] = useState(false);

  const sortedEntries = getFilteredEntries(undefined, sortOption);

  const handleAddPress = useCallback(() => {
    router.push('/journal/new');
  }, [router]);

  const handleEntryPress = useCallback(
    (entry: ManualJournalEntry) => {
      router.push(`/journal/${entry.id}`);
    },
    [router]
  );

  const handleSortChange = useCallback((option: JournalSortOption) => {
    setSortOption(option);
    setShowSortOptions(false);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ManualJournalEntry }) => (
      <JournalEntryCard entry={item} onPress={handleEntryPress} />
    ),
    [handleEntryPress]
  );

  const renderEmptyState = useCallback(
    () => (
      <View className="flex-1 items-center justify-center py-20">
        <BookOpen size={64} color="#64748b" />
        <Text className="text-car-lg font-semibold text-text-secondary mt-4">
          まだ記録がありません
        </Text>
        <Text className="text-text-muted mt-2 text-center px-8">
          お気に入りの場所や思い出のスポットを{'\n'}記録してみましょう
        </Text>
        <Button onPress={handleAddPress} size="lg" className="mt-6">
          最初の記録を追加
        </Button>
      </View>
    ),
    [handleAddPress]
  );

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortOption)?.label ?? '';

  return (
    <SafeAreaView className="flex-1 bg-surface-base">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-car-2xl font-bold text-text-primary">My Journal</Text>
          <Button onPress={handleAddPress} size="sm" icon={<Plus size={18} color="#fff" />}>
            追加
          </Button>
        </View>

        {/* Sort Option */}
        {entries.length > 0 && (
          <View className="relative">
            <Pressable
              onPress={() => setShowSortOptions(!showSortOptions)}
              accessibilityRole="button"
              accessibilityLabel={`並び替え: ${currentSortLabel}`}
              accessibilityHint="タップして並び替えオプションを表示"
              className="flex-row items-center bg-surface-elevated rounded-xl px-4 py-3 min-h-[48px] self-start"
            >
              <Filter size={18} color="#94a3b8" />
              <Text className="text-text-secondary text-car-base ml-2">{currentSortLabel}</Text>
            </Pressable>

            {showSortOptions && (
              <View className="absolute top-14 left-0 bg-surface-elevated rounded-xl py-2 z-10 shadow-lg min-w-[220px] border border-slate-700">
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSortChange(option.value)}
                    accessibilityRole="menuitem"
                    className={`px-4 py-3 min-h-[48px] justify-center ${
                      option.value === sortOption ? 'bg-surface-overlay' : ''
                    }`}
                  >
                    <Text
                      className={`text-car-base ${
                        option.value === sortOption
                          ? 'text-warning font-semibold'
                          : 'text-text-secondary'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Entry Count */}
        {entries.length > 0 && (
          <Text className="text-text-muted text-car-sm mt-3">{entries.length}件の記録</Text>
        )}
      </View>

      {/* Entry List */}
      <View className="flex-1 px-4">
        {entries.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={sortedEntries}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          />
        )}
      </View>

      {/* Overlay to close sort dropdown */}
      {showSortOptions && (
        <Pressable className="absolute inset-0" onPress={() => setShowSortOptions(false)} />
      )}
    </SafeAreaView>
  );
}
