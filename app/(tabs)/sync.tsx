import { useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, MapPin, Star, Calendar, CheckCircle2, Clock, Car } from 'lucide-react-native';

import {
  useCarSync,
  useConnectionStatus,
  ConnectionStatusCard,
  SyncButton,
  type SyncableData,
} from '@/features/connection';
import { useJournalStore } from '@/features/journal/store/journalStore';
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
 * ジャーナルエントリーカード（ライトモード）
 */
function JournalEntryItem({ entry, isSynced }: { entry: ManualJournalEntry; isSynced?: boolean }) {
  return (
    <View
      className={`rounded-xl p-4 mb-2 ${isSynced ? 'bg-slate-50' : 'bg-white'}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center flex-1 mr-2">
          {isSynced && <CheckCircle2 size={14} color="#22c55e" />}
          <Text
            className={`text-base font-semibold flex-1 ml-1 ${
              isSynced ? 'text-slate-400' : 'text-slate-800'
            }`}
            numberOfLines={1}
          >
            {entry.place_name}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Star
            size={14}
            color={isSynced ? '#cbd5e1' : '#f59e0b'}
            fill={isSynced ? '#cbd5e1' : '#f59e0b'}
          />
          <Text className={`text-sm ml-1 ${isSynced ? 'text-slate-400' : 'text-amber-500'}`}>
            {entry.rating}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <MapPin size={12} color="#94a3b8" />
        <Text className="text-sm text-slate-500 ml-1 flex-1" numberOfLines={1}>
          {entry.address.prefecture} {entry.address.city}
        </Text>
        <Text className="text-sm text-slate-400 ml-2">{formatDate(entry.visited_at)}</Text>
      </View>
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
  // Journal - ストアから安定した参照で取得
  const entries = useJournalStore((state) => state.entries);
  const markEntriesAsSynced = useJournalStore((state) => state.markEntriesAsSynced);
  const lastSyncedAt = useJournalStore((state) => state.lastSyncedAt);

  // useMemoで派生データを計算（無限ループを回避）
  const unsyncedEntries = useMemo(() => entries.filter((entry) => !entry.synced_at), [entries]);
  const syncedCount = useMemo(() => entries.filter((entry) => entry.synced_at).length, [entries]);
  const totalEntries = entries.length;

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
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-slate-800">データ同期</Text>
              <Text className="text-base text-slate-500 mt-1">
                ジャーナルを車載器にアップロード
              </Text>
            </View>
            <View className="bg-blue-100 p-3 rounded-2xl">
              <Car size={28} color="#3b82f6" />
            </View>
          </View>
        </View>

        {/* 同期状態サマリー */}
        <View className="px-5 mb-5">
          <View className="flex-row gap-3">
            {/* 未送信 */}
            <View
              className="flex-1 bg-white rounded-2xl p-4"
              style={{
                shadowColor: '#f59e0b',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="flex-row items-center mb-2">
                <View className="w-6 h-6 rounded-full bg-amber-100 items-center justify-center">
                  <Clock size={14} color="#f59e0b" />
                </View>
                <Text className="text-sm text-amber-600 ml-2 font-medium">未送信</Text>
              </View>
              <Text className="text-3xl font-bold text-amber-500">{unsyncedEntries.length}</Text>
              <Text className="text-xs text-slate-400 mt-0.5">件</Text>
            </View>

            {/* 送信済み */}
            <View
              className="flex-1 bg-white rounded-2xl p-4"
              style={{
                shadowColor: '#22c55e',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="flex-row items-center mb-2">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center">
                  <CheckCircle2 size={14} color="#22c55e" />
                </View>
                <Text className="text-sm text-green-600 ml-2 font-medium">送信済み</Text>
              </View>
              <Text className="text-3xl font-bold text-green-500">{syncedCount}</Text>
              <Text className="text-xs text-slate-400 mt-0.5">件</Text>
            </View>
          </View>
        </View>

        {/* 未送信ジャーナルデータセクション */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center mb-3">
            <BookOpen size={20} color="#3b82f6" />
            <Text className="text-lg font-semibold text-slate-800 ml-2">未送信の記録</Text>
            {hasUnsyncedEntries && (
              <View className="bg-amber-100 px-2.5 py-1 rounded-full ml-2">
                <Text className="text-xs font-semibold text-amber-600">
                  {unsyncedEntries.length}件
                </Text>
              </View>
            )}
          </View>

          {hasUnsyncedEntries ? (
            <View
              className="bg-white rounded-2xl p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {/* 統計 */}
              <View className="flex-row mb-4 pb-4 border-b border-slate-100">
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-slate-800">
                    {unsyncedEntries.length}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">未送信数</Text>
                </View>
                <View className="flex-1 items-center border-l border-r border-slate-100">
                  <Text className="text-2xl font-bold text-amber-500">
                    {unsyncedEntries.length > 0
                      ? (
                          unsyncedEntries.reduce((sum, e) => sum + e.rating, 0) /
                          unsyncedEntries.length
                        ).toFixed(1)
                      : '-'}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">平均評価</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-blue-500">
                    {new Set(unsyncedEntries.map((e) => e.address.prefecture)).size}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">訪問地域</Text>
                </View>
              </View>

              {/* 未送信エントリー一覧（最大5件） */}
              <Text className="text-sm font-medium text-slate-500 mb-2">送信予定の記録</Text>
              {unsyncedEntries.slice(0, 5).map((entry) => (
                <JournalEntryItem key={entry.id} entry={entry} />
              ))}

              {unsyncedEntries.length > 5 && (
                <Text className="text-sm text-slate-400 text-center mt-2">
                  他 {unsyncedEntries.length - 5} 件の未送信記録
                </Text>
              )}
            </View>
          ) : totalEntries > 0 ? (
            <View
              className="bg-green-50 rounded-2xl p-6 items-center border border-green-100"
              style={{
                shadowColor: '#22c55e',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-3">
                <CheckCircle2 size={32} color="#22c55e" />
              </View>
              <Text className="text-green-600 font-semibold text-base text-center">
                すべての記録が送信済みです
              </Text>
              <Text className="text-slate-400 text-sm mt-1 text-center">
                合計 {syncedCount} 件の記録が車載器に送信されています
              </Text>
            </View>
          ) : (
            <View
              className="bg-white rounded-2xl p-8 items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
                <BookOpen size={32} color="#94a3b8" />
              </View>
              <Text className="text-slate-700 font-semibold text-base text-center">
                ジャーナル記録がありません
              </Text>
              <Text className="text-slate-400 text-sm mt-1 text-center">
                「ジャーナル」タブで訪問した場所を記録してください
              </Text>
            </View>
          )}

          {/* 最終同期日時 */}
          {lastSyncedDisplay && (
            <View className="flex-row items-center justify-center mt-4">
              <Calendar size={14} color="#94a3b8" />
              <Text className="text-sm text-slate-400 ml-1">最終同期: {lastSyncedDisplay}</Text>
            </View>
          )}
        </View>

        {/* 接続・転送セクション */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-semibold text-slate-800 mb-3">車載器へ送信</Text>

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
            <Text className="text-sm text-green-500 text-center mt-3">
              すべてのジャーナルが送信済みです
            </Text>
          )}

          {totalEntries === 0 && (
            <Text className="text-sm text-slate-400 text-center mt-3">
              ジャーナルに記録を追加してから送信してください
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
