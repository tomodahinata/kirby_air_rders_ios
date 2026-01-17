import { z } from 'zod';

/**
 * 接続状態スキーマ
 */
export const connectionStatusSchema = z.enum([
  'disconnected',
  'connecting',
  'connected',
  'transferring',
  'done',
  'error',
]);

export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;

/**
 * 接続タイプスキーマ
 */
export const connectionTypeSchema = z.enum([
  'usb_c',
  'bluetooth',
  'wifi',
  'carplay',
  'android_auto',
]);

export type ConnectionType = z.infer<typeof connectionTypeSchema>;

/**
 * 車両情報スキーマ
 */
export const vehicleInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  displayType: z.enum(['basic', 'standard', 'premium']).default('standard'),
});

export type VehicleInfo = z.infer<typeof vehicleInfoSchema>;

/**
 * 転送進捗スキーマ
 */
export const transferProgressSchema = z.object({
  status: connectionStatusSchema,
  progress: z.number().min(0).max(100),
  bytesTransferred: z.number().min(0),
  totalBytes: z.number().min(0),
  estimatedTimeRemainingMs: z.number().min(0).optional(),
  currentPhase: z.enum([
    'preparing',
    'compressing',
    'encrypting',
    'sending',
    'verifying',
    'complete',
  ]),
});

export type TransferProgress = z.infer<typeof transferProgressSchema>;

/**
 * 同期結果スキーマ
 */
export const syncResultSchema = z.object({
  success: z.boolean(),
  syncedAt: z.string().datetime(),
  duration: z.number().min(0),
  bytesTransferred: z.number().min(0),
  errorMessage: z.string().optional(),
  retryCount: z.number().int().min(0).default(0),
});

export type SyncResult = z.infer<typeof syncResultSchema>;

/**
 * 接続ステート全体スキーマ
 */
export const connectionStateSchema = z.object({
  status: connectionStatusSchema,
  connectionType: connectionTypeSchema.optional(),
  vehicle: vehicleInfoSchema.optional(),
  transferProgress: transferProgressSchema.optional(),
  lastSyncResult: syncResultSchema.optional(),
  errorMessage: z.string().optional(),
});

export type ConnectionState = z.infer<typeof connectionStateSchema>;

/**
 * 同期リクエストスキーマ
 */
export const syncRequestSchema = z.object({
  contextData: z.unknown(), // StructuredContext, but avoid circular import
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  compress: z.boolean().default(true),
  encrypt: z.boolean().default(true),
});

export type SyncRequest = z.infer<typeof syncRequestSchema>;

/**
 * 接続イベントスキーマ
 */
export const connectionEventSchema = z.object({
  type: z.enum([
    'connection_started',
    'connection_established',
    'transfer_started',
    'transfer_progress',
    'transfer_complete',
    'connection_lost',
    'error',
  ]),
  timestamp: z.string().datetime(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ConnectionEvent = z.infer<typeof connectionEventSchema>;

/**
 * 同期可能なデータ型
 * JSONシリアライズ可能な任意のデータ構造
 */
export type SyncableData = Record<string, unknown> | unknown[];
