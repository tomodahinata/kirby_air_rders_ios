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
  'connected', // サーバー接続確認
  'session_start', // セッション開始（音声挨拶付き）
  'metadata', // 初期メタデータ（位置情報等）
  'start_asr', // ASR（音声認識）開始コマンド
  'asr_starting', // ASR開始中（サーバーからの応答）
  'asr_connected', // ASR接続完了（サーバーからの応答）
  'stop_asr', // ASR終了コマンド
  'asr_stopped', // ASR停止完了（サーバーからの応答）
  'audio_start',
  'audio_data',
  'audio_end',
  'text',
  'transcript', // 音声認識結果（旧形式）
  'transcription', // 音声認識結果（新形式）
  'response', // AIレスポンス
  'response_start',
  'response_audio',
  'response_end',
  'destination', // 目的地レスポンス
  'error',
  'ping',
  'pong',
]);

export type MessageType = z.infer<typeof messageTypeSchema>;

/**
 * 目的地ペイロードスキーマ
 */
export const destinationPayloadSchema = z.object({
  latitude: z.number(), // 緯度（必須）
  longitude: z.number(), // 経度（必須）
  name: z.string().optional(), // 目的地名（オプション）
  address: z.string().optional(), // 住所（オプション）
});

export type DestinationPayload = z.infer<typeof destinationPayloadSchema>;

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
    location: locationPayloadSchema.optional(), // 位置情報（metadataタイプで使用）
  }),
});

export type ClientMessage = z.infer<typeof clientMessageSchema>;

/**
 * サーバー→クライアントメッセージ
 * サーバーからのメッセージ形式に対応:
 * - connected: { type, message, session_id }
 * - destination: { type, latitude, longitude, name?, address? }
 * - transcript: { type, text, is_partial? }
 * - error: { type, message }
 */
export const serverMessageSchema = z.object({
  type: messageTypeSchema,
  // サーバーからのフィールド（フラット形式）
  message: z.string().optional(),
  session_id: z.string().optional(),
  // session_start用フィールド
  has_audio: z.boolean().optional(),
  // destination用フィールド
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  // transcript/transcription用フィールド
  text: z.string().optional(),
  is_partial: z.boolean().optional(),
  is_final: z.boolean().optional(), // transcription用（is_partialの逆）
  // response用フィールド
  turn_count: z.number().optional(),
  is_complete: z.boolean().optional(),
  suggestions: z.array(z.unknown()).optional(),
  suggestion_index: z.number().optional(),
  // audio用フィールド
  audio_data: z.string().optional(),
  // 旧形式との互換性（timestamp, payload）
  timestamp: z.string().optional(),
  payload: z
    .object({
      audioData: z.string().optional(),
      text: z.string().optional(),
      transcript: z.string().optional(),
      isPartial: z.boolean().optional(),
      error: z.string().optional(),
      destination: destinationPayloadSchema.optional(),
    })
    .optional(),
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

  // 会話履歴
  conversationHistory: ConversationEntry[];

  // 現在の転写テキスト
  currentTranscript: string;
  isPartialTranscript: boolean;

  // 目的地
  destination: DestinationPayload | null;

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
  onDestinationReceived?: (destination: DestinationPayload) => void;
}
