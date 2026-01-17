import { z } from 'zod';

import {
  manualJournalEntrySchema,
  createJournalEntrySchema,
  addressSchema,
  locationSchema,
} from '@/shared/types/schema';

// Re-export from shared schema
export { manualJournalEntrySchema, createJournalEntrySchema, addressSchema, locationSchema };

export type {
  ManualJournalEntry,
  CreateJournalEntry,
  UpdateJournalEntry,
  Address,
  Location,
} from '@/shared/types/schema';

/**
 * ジャーナルストア状態スキーマ
 */
export const journalStoreStateSchema = z.object({
  entries: z.array(manualJournalEntrySchema),
  isLoading: z.boolean(),
  error: z.string().nullable(),
  lastSyncedAt: z.string().datetime().nullable(),
});

export type JournalStoreState = z.infer<typeof journalStoreStateSchema>;

/**
 * ジャーナルフィルタースキーマ
 */
export const journalFilterSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  prefecture: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  searchQuery: z.string().optional(),
});

export type JournalFilter = z.infer<typeof journalFilterSchema>;

/**
 * ジャーナルソートオプション
 */
export const journalSortOptionSchema = z.enum([
  'visited_at_desc',
  'visited_at_asc',
  'rating_desc',
  'rating_asc',
  'created_at_desc',
]);

export type JournalSortOption = z.infer<typeof journalSortOptionSchema>;

/**
 * フォーム入力状態
 */
export interface JournalFormState {
  visited_at: Date;
  place_name: string;
  address: {
    country: string;
    prefecture: string;
    city: string;
    detail?: string;
  };
  rating: number;
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
}

/**
 * フォームエラー状態
 */
export interface JournalFormErrors {
  visited_at?: string;
  place_name?: string;
  address?: {
    country?: string;
    prefecture?: string;
    city?: string;
  };
  rating?: string;
  notes?: string;
}

/**
 * 都道府県リスト
 */
export const PREFECTURES = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
] as const;

export type Prefecture = (typeof PREFECTURES)[number];
