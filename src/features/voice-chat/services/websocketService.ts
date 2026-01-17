import {
  serverMessageSchema,
  type ClientMessage,
  type ServerMessage,
  type WebSocketConfig,
  type WebSocketCallbacks,
  type MessageType,
} from '../types';

/**
 * デフォルトのWebSocket設定
 */
const DEFAULT_CONFIG: WebSocketConfig = {
  url: process.env.EXPO_PUBLIC_WEBSOCKET_URL ?? 'ws://localhost:8080/ws/voice',
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  pingInterval: 30000,
  autoReconnect: true,
};

/**
 * WebSocket接続エラー
 */
export class WebSocketError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly reason?: string
  ) {
    super(message);
    this.name = 'WebSocketError';
    Object.setPrototypeOf(this, WebSocketError.prototype);
  }
}

/**
 * 音声WebSocketサービスクラス
 * 音声データの送受信を管理
 */
export class VoiceWebSocketService {
  private socket: WebSocket | null = null;
  private config: WebSocketConfig;
  private callbacks: WebSocketCallbacks;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string | null = null;
  private isManualClose = false;

  constructor(config?: Partial<WebSocketConfig>, callbacks?: WebSocketCallbacks) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks ?? {};
  }

  /**
   * WebSocket接続を開始
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isManualClose = false;

      try {
        this.socket = new WebSocket(this.config.url);

        this.socket.onopen = () => {
          console.log('[VoiceWS] Connected');
          this.reconnectAttempt = 0;
          this.startPingInterval();
          this.sessionId = this.generateSessionId();
          this.callbacks.onOpen?.();
          resolve();
        };

        this.socket.onclose = (event) => {
          console.log('[VoiceWS] Closed:', event.code, event.reason);
          this.stopPingInterval();
          this.callbacks.onClose?.(event.code, event.reason);

          if (!this.isManualClose && this.config.autoReconnect) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (event) => {
          console.error('[VoiceWS] Error:', event);
          const error = new WebSocketError('WebSocket connection error');
          this.callbacks.onError?.(error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        const wsError =
          error instanceof Error
            ? new WebSocketError(error.message)
            : new WebSocketError('Unknown connection error');
        reject(wsError);
      }
    });
  }

  /**
   * WebSocket接続を切断
   */
  disconnect(): void {
    this.isManualClose = true;
    this.clearReconnectTimer();
    this.stopPingInterval();

    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }

    this.sessionId = null;
    console.log('[VoiceWS] Disconnected');
  }

  /**
   * 音声データを送信
   */
  sendAudioData(audioData: string, format: 'pcm' | 'wav' | 'opus' = 'wav'): void {
    const dataSizeBytes = Math.round(audioData.length * 0.75);
    console.log(
      `[VoiceWS] Sending audio data: ` +
        `size=${Math.round(dataSizeBytes / 1024)}KB, ` +
        `format=${format}, ` +
        `sampleRate=16000, ` +
        `type=${typeof audioData}`
    );

    this.sendMessage('audio_data', {
      audioData,
      format,
      sampleRate: 16000,
      sessionId: this.sessionId ?? undefined,
    });
  }

  /**
   * 音声録音開始を通知
   */
  sendAudioStart(): void {
    this.sendMessage('audio_start', {
      sessionId: this.sessionId ?? undefined,
      sampleRate: 16000,
      format: 'pcm',
    });
  }

  /**
   * 音声録音終了を通知
   */
  sendAudioEnd(): void {
    this.sendMessage('audio_end', {
      sessionId: this.sessionId ?? undefined,
    });
  }

  /**
   * テキストメッセージを送信
   */
  sendText(text: string): void {
    this.sendMessage('text', {
      text,
      sessionId: this.sessionId ?? undefined,
    });
  }

  /**
   * 初期メタデータ（位置情報等）を送信
   */
  sendMetadata(
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      altitude?: number | null;
      address?: {
        city?: string | null;
        region?: string | null;
        country?: string | null;
      } | null;
    } | null
  ): void {
    console.log(
      '[VoiceWS] Sending metadata:',
      location
        ? {
            lat: location.latitude,
            lng: location.longitude,
            city: location.address?.city,
          }
        : 'null (location unavailable)'
    );

    this.sendMessage('metadata', {
      location,
      sessionId: this.sessionId ?? undefined,
    });
  }

  /**
   * 接続状態を取得
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * セッションIDを取得
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * コールバックを更新
   */
  setCallbacks(callbacks: WebSocketCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * メッセージを送信
   */
  private sendMessage(type: MessageType, payload: ClientMessage['payload']): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[VoiceWS] Cannot send message: not connected');
      return;
    }

    const message: ClientMessage = {
      type,
      timestamp: new Date().toISOString(),
      payload,
    };

    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('[VoiceWS] Send error:', error);
    }
  }

  /**
   * 受信メッセージを処理
   */
  private handleMessage(data: string): void {
    try {
      // デバッグ: 受信データのサイズと型をログ
      console.log(`[VoiceWS] Received message: size=${data.length} bytes, type=${typeof data}`);

      const parsed: unknown = JSON.parse(data);
      const result = serverMessageSchema.safeParse(parsed);

      if (!result.success) {
        console.warn('[VoiceWS] Invalid message format:', result.error);
        return;
      }

      const message: ServerMessage = result.data;
      console.log(`[VoiceWS] Message type: ${message.type}`);

      // 共通コールバック
      this.callbacks.onMessage?.(message);

      // メッセージタイプ別の処理
      switch (message.type) {
        case 'response_audio':
          if (message.payload.audioData) {
            const audioSizeBytes = Math.round(message.payload.audioData.length * 0.75);
            console.log(`[VoiceWS] Audio received: size=${Math.round(audioSizeBytes / 1024)}KB`);
            this.callbacks.onAudioReceived?.(message.payload.audioData);
          }
          break;

        case 'transcript':
          if (message.payload.transcript !== undefined) {
            this.callbacks.onTranscript?.(
              message.payload.transcript,
              message.payload.isPartial ?? false
            );
          }
          break;

        case 'pong':
          // Ping応答（レイテンシ計測用）
          break;

        case 'error':
          if (message.payload.error) {
            console.error('[VoiceWS] Server error:', message.payload.error);
            this.callbacks.onError?.(new WebSocketError(message.payload.error));
          }
          break;
      }
    } catch (error) {
      console.error('[VoiceWS] Message parse error:', error);
    }
  }

  /**
   * 再接続をスケジュール
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= this.config.reconnectAttempts) {
      console.log('[VoiceWS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempt++;
    const delay = this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempt - 1);

    console.log(`[VoiceWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[VoiceWS] Reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * 再接続タイマーをクリア
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Ping送信を開始
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingTimer = setInterval(() => {
      this.sendMessage('ping', {});
    }, this.config.pingInterval);
  }

  /**
   * Ping送信を停止
   */
  private stopPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * セッションID生成
   */
  private generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * シングルトンインスタンス
 */
let serviceInstance: VoiceWebSocketService | null = null;

/**
 * WebSocketサービスのシングルトンを取得
 */
export function getVoiceWebSocketService(
  config?: Partial<WebSocketConfig>,
  callbacks?: WebSocketCallbacks
): VoiceWebSocketService {
  if (!serviceInstance) {
    serviceInstance = new VoiceWebSocketService(config, callbacks);
  } else if (callbacks) {
    serviceInstance.setCallbacks(callbacks);
  }
  return serviceInstance;
}

/**
 * WebSocketサービスをリセット
 */
export function resetVoiceWebSocketService(): void {
  if (serviceInstance) {
    serviceInstance.disconnect();
    serviceInstance = null;
  }
}
