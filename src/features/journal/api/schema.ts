import { z } from 'zod';

import { manualJournalEntrySchema } from '@/shared/types/schema';

/**
 * 車載器へのジャーナル送信リクエストスキーマ
 */
export const syncJournalRequestSchema = z.object({
  entries: z.array(manualJournalEntrySchema).min(1, '送信するエントリーが必要です'),
  deviceId: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type SyncJournalRequest = z.infer<typeof syncJournalRequestSchema>;

/**
 * 同期成功時のエントリー結果スキーマ
 */
export const syncedEntryResultSchema = z.object({
  id: z.string().uuid(),
  synced: z.boolean(),
  error: z.string().optional(),
});

export type SyncedEntryResult = z.infer<typeof syncedEntryResultSchema>;

/**
 * 車載器からの同期レスポンススキーマ
 */
export const syncJournalResponseSchema = z.object({
  success: z.boolean(),
  syncedCount: z.number().int().min(0),
  failedCount: z.number().int().min(0),
  results: z.array(syncedEntryResultSchema),
  timestamp: z.string().datetime(),
  message: z.string().optional(),
});

export type SyncJournalResponse = z.infer<typeof syncJournalResponseSchema>;

/**
 * API エラーレスポンススキーマ
 */
export const syncErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  timestamp: z.string().datetime(),
});

export type SyncErrorResponse = z.infer<typeof syncErrorResponseSchema>;
