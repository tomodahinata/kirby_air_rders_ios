import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  ManualJournalEntry,
  CreateJournalEntry,
  UpdateJournalEntry,
  JournalFilter,
  JournalSortOption,
} from '../types';

/**
 * UUID生成ユーティリティ
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * ジャーナルストア状態
 */
interface JournalState {
  // データ
  entries: ManualJournalEntry[];

  // UI状態
  isLoading: boolean;
  error: string | null;

  // 同期状態
  lastSyncedAt: string | null;
  pendingSync: boolean;

  // アクション
  addEntry: (entry: CreateJournalEntry) => ManualJournalEntry;
  updateEntry: (id: string, updates: UpdateJournalEntry) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => ManualJournalEntry | undefined;
  getFilteredEntries: (filter?: JournalFilter, sort?: JournalSortOption) => ManualJournalEntry[];

  // 同期関連
  markAsSynced: () => void;
  setPendingSync: (pending: boolean) => void;

  // エラーハンドリング
  setError: (error: string | null) => void;
  clearError: () => void;

  // リセット
  reset: () => void;
}

/**
 * エントリーをフィルタリング
 */
function filterEntries(
  entries: ManualJournalEntry[],
  filter?: JournalFilter
): ManualJournalEntry[] {
  if (!filter) return entries;

  return entries.filter((entry) => {
    // 評価フィルター
    if (filter.rating !== undefined && entry.rating !== filter.rating) {
      return false;
    }

    // 都道府県フィルター
    if (filter.prefecture && entry.address.prefecture !== filter.prefecture) {
      return false;
    }

    // 日付範囲フィルター
    if (filter.dateFrom) {
      const entryDate = new Date(entry.visited_at);
      const fromDate = new Date(filter.dateFrom);
      if (entryDate < fromDate) return false;
    }

    if (filter.dateTo) {
      const entryDate = new Date(entry.visited_at);
      const toDate = new Date(filter.dateTo);
      if (entryDate > toDate) return false;
    }

    // 検索クエリフィルター
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matchesPlaceName = entry.place_name.toLowerCase().includes(query);
      const matchesCity = entry.address.city.toLowerCase().includes(query);
      const matchesNotes = entry.notes?.toLowerCase().includes(query) ?? false;
      if (!matchesPlaceName && !matchesCity && !matchesNotes) {
        return false;
      }
    }

    return true;
  });
}

/**
 * エントリーをソート
 */
function sortEntries(
  entries: ManualJournalEntry[],
  sort: JournalSortOption = 'visited_at_desc'
): ManualJournalEntry[] {
  const sorted = [...entries];

  switch (sort) {
    case 'visited_at_desc':
      return sorted.sort(
        (a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()
      );
    case 'visited_at_asc':
      return sorted.sort(
        (a, b) => new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime()
      );
    case 'rating_desc':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'rating_asc':
      return sorted.sort((a, b) => a.rating - b.rating);
    case 'created_at_desc':
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    default:
      return sorted;
  }
}

/**
 * ジャーナルストア
 */
export const useJournalStore = create<JournalState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初期状態
        entries: [],
        isLoading: false,
        error: null,
        lastSyncedAt: null,
        pendingSync: false,

        // エントリー追加
        addEntry: (entryData: CreateJournalEntry) => {
          const now = new Date().toISOString();
          const newEntry: ManualJournalEntry = {
            ...entryData,
            id: generateUUID(),
            created_at: now,
            updated_at: now,
          };

          set((state) => ({
            entries: [newEntry, ...state.entries],
            pendingSync: true,
          }));

          return newEntry;
        },

        // エントリー更新
        updateEntry: (id: string, updates: UpdateJournalEntry) => {
          set((state) => ({
            entries: state.entries.map((entry) =>
              entry.id === id
                ? {
                    ...entry,
                    ...updates,
                    updated_at: new Date().toISOString(),
                  }
                : entry
            ),
            pendingSync: true,
          }));
        },

        // エントリー削除
        deleteEntry: (id: string) => {
          set((state) => ({
            entries: state.entries.filter((entry) => entry.id !== id),
            pendingSync: true,
          }));
        },

        // エントリー取得
        getEntry: (id: string) => {
          return get().entries.find((entry) => entry.id === id);
        },

        // フィルタリング・ソート済みエントリー取得
        getFilteredEntries: (filter?: JournalFilter, sort?: JournalSortOption) => {
          const entries = get().entries;
          const filtered = filterEntries(entries, filter);
          return sortEntries(filtered, sort);
        },

        // 同期完了マーク
        markAsSynced: () => {
          set({
            lastSyncedAt: new Date().toISOString(),
            pendingSync: false,
          });
        },

        // 同期待ち設定
        setPendingSync: (pending: boolean) => {
          set({ pendingSync: pending });
        },

        // エラー設定
        setError: (error: string | null) => {
          set({ error });
        },

        // エラークリア
        clearError: () => {
          set({ error: null });
        },

        // リセット
        reset: () => {
          set({
            entries: [],
            isLoading: false,
            error: null,
            lastSyncedAt: null,
            pendingSync: false,
          });
        },
      }),
      {
        name: 'journal-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          entries: state.entries,
          lastSyncedAt: state.lastSyncedAt,
        }),
      }
    ),
    { name: 'journal-store' }
  )
);

/**
 * セレクター
 */
export const selectEntries = (state: JournalState) => state.entries;
export const selectEntriesCount = (state: JournalState) => state.entries.length;
export const selectIsLoading = (state: JournalState) => state.isLoading;
export const selectError = (state: JournalState) => state.error;
export const selectPendingSync = (state: JournalState) => state.pendingSync;
export const selectLastSyncedAt = (state: JournalState) => state.lastSyncedAt;
