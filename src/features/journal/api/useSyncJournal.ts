import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { ManualJournalEntry } from '@/shared/types/schema';

import { useJournalStore } from '../store/journalStore';
import { syncJournalToDevice, getErrorMessage } from './journalApi';
import type { SyncJournalResponse } from './schema';

/**
 * Query keys for journal sync
 */
export const journalSyncKeys = {
  all: ['journal-sync'] as const,
  sync: () => [...journalSyncKeys.all, 'sync'] as const,
};

/**
 * Sync mutation 結果型
 */
interface SyncResult {
  response: SyncJournalResponse;
  syncedIds: string[];
}

/**
 * 車載器へのジャーナル同期 Hook
 *
 * @example
 * ```tsx
 * const { syncToDevice, syncUnsyncedEntries, isSyncing, error } = useSyncJournal();
 *
 * // 未同期エントリーを同期
 * const handleSync = async () => {
 *   const result = await syncUnsyncedEntries();
 *   if (result) {
 *     console.log(`${result.response.syncedCount}件同期しました`);
 *   }
 * };
 * ```
 */
export function useSyncJournal() {
  const queryClient = useQueryClient();
  const markEntriesAsSynced = useJournalStore((s) => s.markEntriesAsSynced);
  const getUnsyncedEntries = useJournalStore((s) => s.getUnsyncedEntries);
  const setError = useJournalStore((s) => s.setError);
  const clearError = useJournalStore((s) => s.clearError);

  const mutation = useMutation({
    mutationKey: journalSyncKeys.sync(),
    mutationFn: async (entries: ManualJournalEntry[]): Promise<SyncResult> => {
      const response = await syncJournalToDevice(entries);

      // 成功したエントリーのIDを抽出
      const syncedIds = response.results
        .filter((result) => result.synced)
        .map((result) => result.id);

      return { response, syncedIds };
    },
    onSuccess: ({ syncedIds }) => {
      // 同期成功したエントリーをマーク
      if (syncedIds.length > 0) {
        markEntriesAsSynced(syncedIds);
      }
      clearError();

      // キャッシュを無効化（必要に応じて）
      queryClient.invalidateQueries({ queryKey: journalSyncKeys.all });
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      setError(message);
    },
  });

  /**
   * 指定したエントリーを車載器に送信
   */
  const syncToDevice = useCallback(
    async (entries: ManualJournalEntry[]) => {
      if (entries.length === 0) {
        return null;
      }
      return mutation.mutateAsync(entries);
    },
    [mutation]
  );

  /**
   * 未同期のエントリーをすべて車載器に送信
   */
  const syncUnsyncedEntries = useCallback(async () => {
    const unsyncedEntries = getUnsyncedEntries();
    if (unsyncedEntries.length === 0) {
      return null;
    }
    return mutation.mutateAsync(unsyncedEntries);
  }, [mutation, getUnsyncedEntries]);

  return {
    /** 指定したエントリーを同期 */
    syncToDevice,
    /** 未同期エントリーをすべて同期 */
    syncUnsyncedEntries,
    /** 同期中かどうか */
    isSyncing: mutation.isPending,
    /** 同期成功かどうか */
    isSuccess: mutation.isSuccess,
    /** エラー */
    error: mutation.error,
    /** エラーメッセージ */
    errorMessage: mutation.error ? getErrorMessage(mutation.error) : null,
    /** 最後の同期結果 */
    lastResult: mutation.data,
    /** ミューテーションをリセット */
    reset: mutation.reset,
  };
}
