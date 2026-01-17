import { z } from 'zod';

/**
 * WebSocket接続状態
 */
export const connectionStateSchema = z.enum([
  'disconnected',
  'connecting',
  'connected',
  'reconnecting',
  'error',
]);

export type ConnectionState = z.infer<typeof connectionStateSchema>;

/**
 * 会話状態
 */
export const conversationStateSchema = z.enum(['idle', 'listening', 'processing', 'speaking']);

export type ConversationState = z.infer<typeof conversationStateSchema>;

/**
 * 音声メッセージの種類
 */
export const messageTypeSchema = z.enum([
  'metadata', // 初期メタデータ（位置情報等）
  'audio_start',
  'audio_data',
  'audio_end',
  'text',
  'transcript',
  'response_start',
  'response_audio',
  'response_end',
  'error',
  'ping',
  'pong',
]);

export type MessageType = z.infer<typeof messageTypeSchema>;

/**
 * 位置情報ペイロードスキーマ
 */
export const locationPayloadSchema = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().nullable().optional(),
    altitude: z.number().nullable().optional(),
    address: z
      .object({
        city: z.string().nullable().optional(),
        region: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .nullable();

export type LocationPayload = z.infer<typeof locationPayloadSchema>;

/**
 * クライアント→サーバーメッセージ
 */
export const clientMessageSchema = z.object({
  type: messageTypeSchema,
  timestamp: z.string().datetime(),
  payload: z.object({
    audioData: z.string().optional(), // Base64エンコードされた音声データ
    text: z.string().optional(),
    sampleRate: z.number().optional(),
    format: z.enum(['pcm', 'wav', 'opus']).optional(),
    sessionId: z.string().uuid().optional(),
    location: locationPayloadSchema.optional(), // 位置情報（metadataタイプで使用）
  }),
});

export type ClientMessage = z.infer<typeof clientMessageSchema>;

/**
 * サーバー→クライアントメッセージ
 */
export const serverMessageSchema = z.object({
  type: messageTypeSchema,
  timestamp: z.string().datetime(),
  payload: z.object({
    audioData: z.string().optional(), // Base64エンコードされた音声データ
    text: z.string().optional(),
    transcript: z.string().optional(),
    isPartial: z.boolean().optional(),
    error: z.string().optional(),
    sessionId: z.string().uuid().optional(),
  }),
});

export type ServerMessage = z.infer<typeof serverMessageSchema>;

/**
 * 会話履歴エントリ
 */
export const conversationEntrySchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string().datetime(),
  audioUrl: z.string().optional(),
});

export type ConversationEntry = z.infer<typeof conversationEntrySchema>;

/**
 * WebSocket設定
 */
export const websocketConfigSchema = z.object({
  url: z.string().url(),
  reconnectAttempts: z.number().int().min(0).default(5),
  reconnectInterval: z.number().int().min(100).default(3000),
  pingInterval: z.number().int().min(1000).default(30000),
  autoReconnect: z.boolean().default(true),
});

export type WebSocketConfig = z.infer<typeof websocketConfigSchema>;

/**
 * 音声チャットストア状態
 */
export interface VoiceChatState {
  // 接続状態
  connectionState: ConnectionState;
  conversationState: ConversationState;
  sessionId: string | null;

  // 会話履歴
  conversationHistory: ConversationEntry[];

  // 現在の転写テキスト
  currentTranscript: string;
  isPartialTranscript: boolean;

  // エラー
  error: string | null;

  // 統計
  lastPingAt: string | null;
  latencyMs: number | null;
}

/**
 * WebSocket イベントコールバック
 */
export interface WebSocketCallbacks {
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: ServerMessage) => void;
  onAudioReceived?: (audioData: string) => void;
  onTranscript?: (text: string, isPartial: boolean) => void;
}
