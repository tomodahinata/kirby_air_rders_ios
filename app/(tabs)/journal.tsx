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
        <BookOpen size={64} color="#6b7280" />
        <Text className="text-xl font-semibold text-gray-300 mt-4">まだ記録がありません</Text>
        <Text className="text-gray-500 mt-2 text-center px-8">
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
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-white">My Journal</Text>
          <Button onPress={handleAddPress} size="sm" icon={<Plus size={18} color="#fff" />}>
            追加
          </Button>
        </View>

        {/* Sort Option */}
        {entries.length > 0 && (
          <View className="relative">
            <Pressable
              onPress={() => setShowSortOptions(!showSortOptions)}
              className="flex-row items-center bg-slate-800 rounded-lg px-3 py-2 self-start"
            >
              <Filter size={16} color="#9ca3af" />
              <Text className="text-gray-400 text-sm ml-2">{currentSortLabel}</Text>
            </Pressable>

            {showSortOptions && (
              <View className="absolute top-12 left-0 bg-slate-800 rounded-lg py-2 z-10 shadow-lg min-w-[200px]">
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSortChange(option.value)}
                    className={`px-4 py-3 ${option.value === sortOption ? 'bg-slate-700' : ''}`}
                  >
                    <Text
                      className={`text-sm ${
                        option.value === sortOption
                          ? 'text-orange-400 font-semibold'
                          : 'text-gray-300'
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
          <Text className="text-gray-500 text-sm mt-2">{entries.length}件の記録</Text>
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
