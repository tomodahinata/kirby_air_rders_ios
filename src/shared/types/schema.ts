import { z } from 'zod';

/**
 * 住所スキーマ
 */
export const addressSchema = z.object({
  country: z.string().min(1, '国を入力してください'),
  prefecture: z.string().min(1, '都道府県を入力してください'),
  city: z.string().min(1, '市区町村を入力してください'),
  detail: z.string().optional(),
});

export type Address = z.infer<typeof addressSchema>;

/**
 * 位置情報スキーマ
 */
export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type Location = z.infer<typeof locationSchema>;

/**
 * 手動ジャーナルエントリースキーマ
 * ユーザーが思い出やおすすめスポットを手動で登録
 */
export const manualJournalEntrySchema = z.object({
  id: z.string().uuid(),
  visited_at: z.string().datetime(),
  address: addressSchema,
  place_name: z.string().min(1, '場所の名前を入力してください').max(100),
  rating: z.number().int().min(1).max(5),
  location: locationSchema.optional(),
  notes: z.string().max(500).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  /** 車載器への同期日時（nullの場合は未送信） */
  synced_at: z.string().datetime().nullable().optional(),
});

export type ManualJournalEntry = z.infer<typeof manualJournalEntrySchema>;

/**
 * ジャーナルエントリー作成用スキーマ（IDと日時は自動生成）
 */
export const createJournalEntrySchema = manualJournalEntrySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreateJournalEntry = z.infer<typeof createJournalEntrySchema>;

/**
 * ジャーナルエントリー更新用スキーマ
 */
export const updateJournalEntrySchema = createJournalEntrySchema.partial();

export type UpdateJournalEntry = z.infer<typeof updateJournalEntrySchema>;
