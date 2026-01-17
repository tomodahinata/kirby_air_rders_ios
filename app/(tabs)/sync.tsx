import { useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, BookOpen, MapPin, Star, Calendar, CheckCircle2, Clock } from 'lucide-react-native';

import {
  useCarSync,
  useConnectionStatus,
  ConnectionStatusCard,
  SyncButton,
  type SyncableData,
} from '@/features/connection';
import {
  useJournalStore,
  selectUnsyncedEntries,
  selectSyncedCount,
} from '@/features/journal/store/journalStore';
import type { ManualJournalEntry } from '@/features/journal/types';

/**
 * 日時フォーマット関数
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

/**
 * ジャーナルエントリーカード
 */
function JournalEntryItem({ entry, isSynced }: { entry: ManualJournalEntry; isSynced?: boolean }) {
  return (
    <View
      className={`rounded-xl p-4 mb-2 min-h-[52px] ${
        isSynced ? 'bg-surface-overlay' : 'bg-surface-elevated'
      }`}
    >
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center flex-1 mr-2">
          {isSynced && <CheckCircle2 size={14} color="#22c55e" className="mr-1" />}
          <Text
            className={`text-car-base font-semibold flex-1 ${
              isSynced ? 'text-text-muted' : 'text-text-primary'
            }`}
            numberOfLines={1}
          >
            {entry.place_name}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Star
            size={14}
            color={isSynced ? '#64748b' : '#f59e0b'}
            fill={isSynced ? '#64748b' : '#f59e0b'}
          />
          <Text className={`text-car-sm ml-1 ${isSynced ? 'text-text-muted' : 'text-warning'}`}>
            {entry.rating}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <MapPin size={12} color="#94a3b8" />
        <Text className="text-car-sm text-text-secondary ml-1 flex-1" numberOfLines={1}>
          {entry.address.prefecture} {entry.address.city}
        </Text>
        <Text className="text-car-sm text-text-muted ml-2">{formatDate(entry.visited_at)}</Text>
      </View>
      {entry.notes && (
        <Text className="text-car-sm text-text-secondary mt-1" numberOfLines={2}>
          {entry.notes}
        </Text>
      )}
    </View>
  );
}

/**
 * 同期データペイロードの型
 */
interface SyncPayload {
  type: 'journal_entries';
  syncedAt: string;
  entries: Array<{
    id: string;
    place_name: string;
    address: ManualJournalEntry['address'];
    visited_at: string;
    rating: number;
    notes?: string;
    location?: ManualJournalEntry['location'];
  }>;
  metadata: {
    totalEntries: number;
    appVersion: string;
  };
}

export default function SyncScreen() {
  // Journal - 未同期と同期済みを分けて取得
  const unsyncedEntries = useJournalStore(selectUnsyncedEntries);
  const syncedCount = useJournalStore(selectSyncedCount);
  const totalEntries = useJournalStore((state) => state.entries.length);
  const markEntriesAsSynced = useJournalStore((state) => state.markEntriesAsSynced);
  const lastSyncedAt = useJournalStore((state) => state.lastSyncedAt);

  // Connection
  const syncMutation = useCarSync();
  const {
    status: connectionStatus,
    vehicle,
    transferProgress,
    error: connectionError,
  } = useConnectionStatus();

  // 未同期エントリーのIDリスト
  const unsyncedEntryIds = useMemo(
    () => unsyncedEntries.map((entry) => entry.id),
    [unsyncedEntries]
  );

  // 同期するデータを準備（未同期のみ）
  const syncData: SyncPayload = useMemo(
    () => ({
      type: 'journal_entries',
      syncedAt: new Date().toISOString(),
      entries: unsyncedEntries.map((entry) => ({
        id: entry.id,
        place_name: entry.place_name,
        address: entry.address,
        visited_at: entry.visited_at,
        rating: entry.rating,
        notes: entry.notes,
        location: entry.location,
      })),
      metadata: {
        totalEntries: unsyncedEntries.length,
        appVersion: '1.0.0',
      },
    }),
    [unsyncedEntries]
  );

  const hasUnsyncedEntries = unsyncedEntries.length > 0;

  const handleSync = useCallback(() => {
    if (hasUnsyncedEntries) {
      // 型安全な構造を持つ syncData を SyncableData として送信
      syncMutation.mutate(syncData as unknown as SyncableData, {
        onSuccess: () => {
          // 送信したエントリーを同期済みにマーク
          markEntriesAsSynced(unsyncedEntryIds);
        },
      });
    }
  }, [syncData, syncMutation, hasUnsyncedEntries, markEntriesAsSynced, unsyncedEntryIds]);

  // 最終同期日時のフォーマット
  const lastSyncedDisplay = useMemo(() => {
    if (!lastSyncedAt) return null;
    const date = new Date(lastSyncedAt);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  }, [lastSyncedAt]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-base">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-car-2xl font-bold text-text-primary">データ同期</Text>
              <Text className="text-car-base text-text-secondary mt-1">
                ジャーナルを車載器にアップロード
              </Text>
            </View>
            <View className="bg-primary-600/20 p-3 rounded-full">
              <Upload size={28} color="#60a5fa" />
            </View>
          </View>
        </View>

        {/* 同期状態サマリー */}
        <View className="px-5 mb-4">
          <View className="flex-row gap-3">
            {/* 未送信 */}
            <View className="flex-1 bg-amber-900/30 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Clock size={16} color="#f59e0b" />
                <Text className="text-sm text-amber-400 ml-1 font-medium">未送信</Text>
              </View>
              <Text className="text-3xl font-bold text-amber-400">{unsyncedEntries.length}</Text>
              <Text className="text-xs text-amber-400/70">件</Text>
            </View>

            {/* 送信済み */}
            <View className="flex-1 bg-green-900/30 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <CheckCircle2 size={16} color="#22c55e" />
                <Text className="text-sm text-green-400 ml-1 font-medium">送信済み</Text>
              </View>
              <Text className="text-3xl font-bold text-green-400">{syncedCount}</Text>
              <Text className="text-xs text-green-400/70">件</Text>
            </View>
          </View>
        </View>

        {/* 未送信ジャーナルデータセクション */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center mb-3">
            <BookOpen size={20} color="#f59e0b" />
            <Text className="text-car-lg font-semibold text-text-primary ml-2">未送信の記録</Text>
            {hasUnsyncedEntries && (
              <View className="bg-amber-600/30 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-car-sm text-warning">{unsyncedEntries.length}件</Text>
              </View>
            )}
          </View>

          {hasUnsyncedEntries ? (
            <View className="bg-surface-elevated rounded-2xl p-4 border border-slate-700">
              {/* 統計 */}
              <View className="flex-row mb-4">
                <View className="flex-1 items-center">
                  <Text className="text-car-xl font-bold text-text-primary">
                    {unsyncedEntries.length}
                  </Text>
                  <Text className="text-car-sm text-text-muted">未送信数</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-car-xl font-bold text-warning">
                    {unsyncedEntries.length > 0
                      ? (
                          unsyncedEntries.reduce((sum, e) => sum + e.rating, 0) /
                          unsyncedEntries.length
                        ).toFixed(1)
                      : '-'}
                  </Text>
                  <Text className="text-car-sm text-text-muted">平均評価</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-car-xl font-bold text-success">
                    {new Set(unsyncedEntries.map((e) => e.address.prefecture)).size}
                  </Text>
                  <Text className="text-car-sm text-text-muted">訪問地域</Text>
                </View>
              </View>

              {/* 未送信エントリー一覧（最大5件） */}
              <Text className="text-car-sm font-medium text-text-secondary mb-2">
                送信予定の記録
              </Text>
              {unsyncedEntries.slice(0, 5).map((entry) => (
                <JournalEntryItem key={entry.id} entry={entry} />
              ))}

              {unsyncedEntries.length > 5 && (
                <Text className="text-car-sm text-text-muted text-center mt-2">
                  他 {unsyncedEntries.length - 5} 件の未送信記録
                </Text>
              )}
            </View>
          ) : totalEntries > 0 ? (
            <View className="bg-green-900/20 rounded-2xl p-6 items-center border border-green-700/30">
              <CheckCircle2 size={48} color="#22c55e" />
              <Text className="text-success mt-4 text-center font-semibold text-car-base">
                すべての記録が送信済みです
              </Text>
              <Text className="text-text-muted text-car-sm mt-1 text-center">
                合計 {syncedCount} 件の記録が車載器に送信されています
              </Text>
            </View>
          ) : (
            <View className="bg-surface-elevated rounded-2xl p-8 items-center border border-slate-700">
              <BookOpen size={48} color="#64748b" />
              <Text className="text-text-secondary mt-4 text-center text-car-base">
                ジャーナル記録がありません
              </Text>
              <Text className="text-text-muted text-car-sm mt-1 text-center">
                「ジャーナル」タブで訪問した場所を記録してください
              </Text>
            </View>
          )}

          {/* 最終同期日時 */}
          {lastSyncedDisplay && (
            <View className="flex-row items-center justify-center mt-3">
              <Calendar size={14} color="#64748b" />
              <Text className="text-car-sm text-text-muted ml-1">
                最終同期: {lastSyncedDisplay}
              </Text>
            </View>
          )}
        </View>

        {/* 接続・転送セクション */}
        <View className="px-5 mb-6">
          <Text className="text-car-lg font-semibold text-text-primary mb-3">車載器へ送信</Text>

          <ConnectionStatusCard
            status={connectionStatus}
            vehicle={vehicle}
            transferProgress={transferProgress}
            error={connectionError}
          />
        </View>

        {/* 送信ボタン */}
        <View className="px-5">
          <SyncButton
            status={connectionStatus}
            isExtractionComplete={hasUnsyncedEntries}
            onPress={handleSync}
            disabled={syncMutation.isPending || !hasUnsyncedEntries}
          />

          {!hasUnsyncedEntries && totalEntries > 0 && (
            <Text className="text-car-sm text-success text-center mt-3">
              すべてのジャーナルが送信済みです
            </Text>
          )}

          {totalEntries === 0 && (
            <Text className="text-car-sm text-text-muted text-center mt-3">
              ジャーナルに記録を追加してから送信してください
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
