import { useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plus,
  BookOpen,
  Filter,
  Upload,
  Loader2,
  CheckCircle,
  ChevronDown,
} from 'lucide-react-native';

import {
  JournalEntryCard,
  useJournalStore,
  selectEntries,
  selectUnsyncedCount,
  useSyncJournal,
  SyncProgressScreen,
} from '@/features/journal';
import type { ManualJournalEntry, JournalSortOption } from '@/features/journal';

const SORT_OPTIONS: { value: JournalSortOption; label: string }[] = [
  { value: 'visited_at_desc', label: '訪問日（新しい順）' },
  { value: 'visited_at_asc', label: '訪問日（古い順）' },
  { value: 'rating_desc', label: '評価（高い順）' },
  { value: 'rating_asc', label: '評価（低い順）' },
  { value: 'created_at_desc', label: '登録日（新しい順）' },
];

type SyncStatus = 'syncing' | 'completed' | 'error';

export default function JournalScreen() {
  const router = useRouter();
  const entries = useJournalStore(selectEntries);
  const unsyncedCount = useJournalStore(selectUnsyncedCount);
  const getFilteredEntries = useJournalStore((s) => s.getFilteredEntries);

  const [sortOption, setSortOption] = useState<JournalSortOption>('visited_at_desc');
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Sync Progress State
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { syncUnsyncedEntries, isSyncing, errorMessage } = useSyncJournal();

  const sortedEntries = getFilteredEntries(undefined, sortOption);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

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

  const simulateProgress = useCallback(() => {
    setSyncProgress(0);
    setSyncStatus('syncing');

    // Simulate progress animation
    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      if (currentProgress >= 95) {
        currentProgress = 95; // Cap at 95% until actual completion
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
      setSyncProgress(Math.min(currentProgress, 95));
    }, 200);
  }, []);

  const handleSyncPress = useCallback(async () => {
    if (unsyncedCount === 0) {
      Alert.alert('同期完了', 'すべてのデータは既に同期済みです');
      return;
    }

    // Show progress screen
    setShowSyncProgress(true);
    simulateProgress();

    try {
      const result = await syncUnsyncedEntries();

      // Complete the progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setSyncProgress(100);
      setSyncStatus('completed');

      // Auto close after success
      setTimeout(() => {
        setShowSyncProgress(false);
        if (result) {
          Alert.alert('送信完了', `${result.response.syncedCount}件のデータを車載器に送信しました`);
        }
      }, 1500);
    } catch {
      // Show error state
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setSyncStatus('error');

      // Allow user to close manually on error
      setTimeout(() => {
        setShowSyncProgress(false);
        Alert.alert('送信エラー', errorMessage ?? '車載器への送信に失敗しました');
      }, 2000);
    }
  }, [unsyncedCount, syncUnsyncedEntries, errorMessage, simulateProgress]);

  const handleCloseSyncProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setShowSyncProgress(false);
  }, []);

  const handleUserPress = useCallback(() => {
    console.log('User menu pressed');
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
        <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-4">
          <BookOpen size={40} color="#94a3b8" />
        </View>
        <Text className="text-xl font-bold text-slate-800 mt-2">まだ記録がありません</Text>
        <Text className="text-slate-500 mt-2 text-center px-8">
          お気に入りの場所や思い出のスポットを{'\n'}記録してみましょう
        </Text>
        <Pressable
          onPress={handleAddPress}
          className="mt-6 bg-blue-500 rounded-xl px-6 py-3 flex-row items-center active:bg-blue-600"
        >
          <Plus size={20} color="#fff" />
          <Text className="text-white font-semibold ml-2">最初の記録を追加</Text>
        </Pressable>
      </View>
    ),
    [handleAddPress]
  );

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortOption)?.label ?? '';

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-slate-800">マイジャーナル</Text>
          <Pressable
            onPress={handleAddPress}
            className="bg-blue-500 rounded-xl px-4 py-2.5 flex-row items-center active:bg-blue-600"
            accessibilityRole="button"
            accessibilityLabel="新しい記録を追加"
          >
            <Plus size={18} color="#fff" />
            <Text className="text-white font-semibold ml-1.5">追加</Text>
          </Pressable>
        </View>

        {/* Sort Option & Sync Button */}
        {entries.length > 0 && (
          <View className="flex-row items-center justify-between">
            {/* Sort Dropdown */}
            <View className="relative">
              <Pressable
                onPress={() => setShowSortOptions(!showSortOptions)}
                accessibilityRole="button"
                accessibilityLabel={`並び替え: ${currentSortLabel}`}
                accessibilityHint="タップして並び替えオプションを表示"
                className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-slate-200"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Filter size={16} color="#64748b" />
                <Text className="text-slate-600 text-sm ml-2 mr-1">{currentSortLabel}</Text>
                <ChevronDown size={14} color="#94a3b8" />
              </Pressable>

              {showSortOptions && (
                <View
                  className="absolute top-14 left-0 bg-white rounded-xl py-2 z-10 min-w-[200px] border border-slate-100"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSortChange(option.value)}
                      accessibilityRole="menuitem"
                      className={`px-4 py-3 ${option.value === sortOption ? 'bg-blue-50' : ''}`}
                    >
                      <Text
                        className={`text-sm ${
                          option.value === sortOption
                            ? 'text-blue-600 font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Sync Button */}
            <Pressable
              onPress={handleSyncPress}
              disabled={isSyncing}
              accessibilityRole="button"
              accessibilityLabel={`車載器に送信${unsyncedCount > 0 ? `（${unsyncedCount}件未送信）` : ''}`}
              accessibilityState={{ disabled: isSyncing }}
              className={`flex-row items-center rounded-xl px-4 py-3 ${
                unsyncedCount > 0 ? 'bg-blue-500 active:bg-blue-600' : 'bg-green-500'
              } ${isSyncing ? 'opacity-50' : ''}`}
              style={{
                shadowColor: unsyncedCount > 0 ? '#3b82f6' : '#22c55e',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              {isSyncing ? (
                <Loader2 size={18} color="#fff" />
              ) : unsyncedCount === 0 ? (
                <CheckCircle size={18} color="#fff" />
              ) : (
                <Upload size={18} color="#fff" />
              )}
              <Text className="text-white text-sm font-semibold ml-2">
                {isSyncing
                  ? '送信中...'
                  : unsyncedCount > 0
                    ? `送信（${unsyncedCount}件）`
                    : '同期済み'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Entry Count */}
        {entries.length > 0 && (
          <Text className="text-slate-400 text-sm mt-3">{entries.length}件の記録</Text>
        )}
      </View>

      {/* Entry List */}
      <View className="flex-1 px-5">
        {entries.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={sortedEntries}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
          />
        )}
      </View>

      {/* Overlay to close sort dropdown */}
      {showSortOptions && (
        <Pressable className="absolute inset-0" onPress={() => setShowSortOptions(false)} />
      )}

      {/* Sync Progress Screen */}
      <SyncProgressScreen
        isVisible={showSyncProgress}
        progress={syncProgress}
        status={syncStatus}
        userName="Taro"
        onClose={handleCloseSyncProgress}
        onUserPress={handleUserPress}
      />
    </SafeAreaView>
  );
}
