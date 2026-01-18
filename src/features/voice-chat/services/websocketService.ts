import {
  serverMessageSchema,
  type ClientMessage,
  type MessageType,
  type ServerMessage,
  type WebSocketCallbacks,
  type WebSocketConfig,
} from '../types';

/**
 * デフォルトのWebSocket設定
 */
const DEFAULT_CONFIG: WebSocketConfig = {
  url: process.env.EXPO_PUBLIC_WEBSOCKET_URL ?? 'ws://localhost:8000/api/v1/ws/voice',
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
  private isManualClose = false;
  /** React NativeではreadyStateが正しく更新されないことがあるため、独自フラグで管理 */
  private isSocketOpen = false;
  /** 接続試行中かどうか（重複接続防止用） */
  private isConnecting = false;
  /** 接続中のPromise（重複呼び出し時に同じPromiseを返す） */
  private connectPromise: Promise<void> | null = null;

  // 統計情報
  private stats = {
    messagesSent: 0,
    messagesReceived: 0,
    binaryMessagesReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
    lastMessageAt: null as Date | null,
    connectedAt: null as Date | null,
  };

  constructor(config?: Partial<WebSocketConfig>, callbacks?: WebSocketCallbacks) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks ?? {};
  }

  /**
   * WebSocket接続を開始
   * 重複呼び出し時は既存のPromiseを返す
   */
  connect(): Promise<void> {
    // 既に接続済みの場合はスキップ
    if (this.isSocketOpen && this.socket) {
      console.log('[VoiceWS] Already connected, skipping');
      return Promise.resolve();
    }

    // 接続試行中の場合は既存のPromiseを返す
    if (this.isConnecting && this.connectPromise) {
      console.log('[VoiceWS] Connection already in progress, returning existing promise');
      return this.connectPromise;
    }

    // 既存のソケットがある場合はクリーンアップ
    if (this.socket) {
      console.log('[VoiceWS] Cleaning up existing socket before new connection');
      try {
        this.socket.onopen = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.onmessage = null;
        this.socket.close();
      } catch {
        // 無視
      }
      this.socket = null;
    }

    this.isConnecting = true;
    this.connectPromise = new Promise((resolve, reject) => {
      this.isManualClose = false;
      this.isSocketOpen = false;
      // 統計をリセット
      this.stats = {
        messagesSent: 0,
        messagesReceived: 0,
        binaryMessagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
        lastMessageAt: null,
        connectedAt: null,
      };

      try {
        console.log('[VoiceWS] ====== CONNECTION START ======');
        console.log('[VoiceWS] URL:', this.config.url);
        console.log('[VoiceWS] Config:', {
          reconnectAttempts: this.config.reconnectAttempts,
          reconnectInterval: this.config.reconnectInterval,
          pingInterval: this.config.pingInterval,
          autoReconnect: this.config.autoReconnect,
        });
        this.socket = new WebSocket(this.config.url);

        this.socket.onopen = () => {
          this.stats.connectedAt = new Date();
          // React NativeではreadyStateが正しく更新されないことがあるため、独自フラグで管理
          this.isSocketOpen = true;
          this.isConnecting = false;

          console.log('[VoiceWS] ====== CONNECTED ======');
          console.log('[VoiceWS] Connected at:', this.stats.connectedAt.toISOString());
          console.log('[VoiceWS] ReadyState:', this.getReadyStateString());
          console.log('[VoiceWS] isSocketOpen:', this.isSocketOpen);

          this.reconnectAttempt = 0;
          this.startPingInterval();
          this.callbacks.onOpen?.();
          resolve();
        };

        this.socket.onclose = (event) => {
          // ソケットクローズ時にフラグをリセット
          this.isSocketOpen = false;
          this.isConnecting = false;
          this.connectPromise = null;

          const duration = this.stats.connectedAt
            ? Math.round((Date.now() - this.stats.connectedAt.getTime()) / 1000)
            : 0;
          console.log('[VoiceWS] ====== DISCONNECTED ======');
          console.log('[VoiceWS] Code:', event.code, '| Reason:', event.reason || '(none)');
          console.log('[VoiceWS] Session duration:', duration, 'seconds');
          console.log('[VoiceWS] Stats:', {
            messagesSent: this.stats.messagesSent,
            messagesReceived: this.stats.messagesReceived,
            binaryMessagesReceived: this.stats.binaryMessagesReceived,
            bytesSent: `${Math.round(this.stats.bytesSent / 1024)}KB`,
            bytesReceived: `${Math.round(this.stats.bytesReceived / 1024)}KB`,
          });
          this.stopPingInterval();
          this.callbacks.onClose?.(event.code, event.reason);

          if (!this.isManualClose && this.config.autoReconnect) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (event) => {
          this.isSocketOpen = false;
          this.isConnecting = false;
          this.connectPromise = null;
          console.error('[VoiceWS] ====== ERROR ======');
          console.error('[VoiceWS] ReadyState:', this.getReadyStateString());
          console.error('[VoiceWS] Event:', event);
          const error = new WebSocketError('WebSocket connection error');
          this.callbacks.onError?.(error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        this.isConnecting = false;
        this.connectPromise = null;
        console.error('[VoiceWS] ====== CONNECTION FAILED ======');
        console.error('[VoiceWS] Error:', error);
        const wsError =
          error instanceof Error
            ? new WebSocketError(error.message)
            : new WebSocketError('Unknown connection error');
        reject(wsError);
      }
    });

    return this.connectPromise;
  }

  /**
   * ReadyState を文字列に変換
   */
  private getReadyStateString(): string {
    if (!this.socket) return 'NO_SOCKET';
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING (0)';
      case WebSocket.OPEN:
        return 'OPEN (1)';
      case WebSocket.CLOSING:
        return 'CLOSING (2)';
      case WebSocket.CLOSED:
        return 'CLOSED (3)';
      default:
        return `UNKNOWN (${this.socket.readyState})`;
    }
  }

  /**
   * 現在の接続状態をログ出力
   */
  logStatus(): void {
    const duration = this.stats.connectedAt
      ? Math.round((Date.now() - this.stats.connectedAt.getTime()) / 1000)
      : 0;
    console.log('[VoiceWS] ====== STATUS ======');
    console.log('[VoiceWS] ReadyState:', this.getReadyStateString());
    console.log('[VoiceWS] isSocketOpen:', this.isSocketOpen);
    console.log('[VoiceWS] IsConnected:', this.isConnected());
    console.log('[VoiceWS] Session duration:', duration, 'seconds');
    console.log('[VoiceWS] Stats:', {
      messagesSent: this.stats.messagesSent,
      messagesReceived: this.stats.messagesReceived,
      binaryMessagesReceived: this.stats.binaryMessagesReceived,
      bytesSent: `${Math.round(this.stats.bytesSent / 1024)}KB`,
      bytesReceived: `${Math.round(this.stats.bytesReceived / 1024)}KB`,
      lastMessageAt: this.stats.lastMessageAt?.toISOString() ?? 'never',
    });
  }

  /**
   * WebSocket接続を切断
   */
  disconnect(): void {
    this.isManualClose = true;
    this.isSocketOpen = false;
    this.isConnecting = false;
    this.connectPromise = null;
    this.clearReconnectTimer();
    this.stopPingInterval();

    if (this.socket) {
      try {
        this.socket.onopen = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.onmessage = null;
        this.socket.close(1000, 'Client disconnect');
      } catch {
        // 無視
      }
      this.socket = null;
    }

    console.log('[VoiceWS] Disconnected');
  }

  /**
   * 音声データを送信（バイナリ形式で直接送信）
   * React Nativeではonopenが呼ばれてもsendがまだできないことがあるため、リトライロジックを実装
   * @param audioData Base64エンコードされた音声データ
   */
  async sendAudioData(audioData: string, _format: 'pcm' | 'wav' | 'opus' = 'wav'): Promise<void> {
    if (!this.socket || !this.isSocketOpen) {
      console.warn('[VoiceWS] Cannot send audio: not connected');
      console.warn('[VoiceWS] isSocketOpen:', this.isSocketOpen);
      return;
    }

    // Base64をバイナリ（ArrayBuffer）に変換
    const binaryData = this.base64ToArrayBuffer(audioData);
    const dataSizeKB = Math.round(binaryData.byteLength / 1024);

    // React NativeのWebSocketはonopenが呼ばれてもsend可能になるまで時間がかかることがある
    // リトライロジックで対応
    const maxRetries = 20;
    const retryDelay = 100; // ms

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[VoiceWS] Sending binary audio data: size=${dataSizeKB}KB`);

        // バイナリデータを直接送信
        this.socket.send(binaryData);

        // 統計更新
        this.stats.messagesSent++;
        this.stats.bytesSent += binaryData.byteLength;

        console.log(
          `[VoiceWS] >>> SENT [BINARY AUDIO] ${binaryData.byteLength} bytes ` +
            `(total: ${this.stats.messagesSent} msgs, ${Math.round(this.stats.bytesSent / 1024)}KB)`
        );
        return; // 成功したら終了
      } catch (error) {
        const isInvalidState = error instanceof Error && error.message.includes('INVALID_STATE');

        if (isInvalidState && attempt < maxRetries - 1) {
          // INVALID_STATE_ERRの場合はリトライ
          if (attempt === 0) {
            console.log('[VoiceWS] Socket not ready for audio send, waiting...');
          }
          await new Promise((r) => setTimeout(r, retryDelay));
          continue;
        }

        // 最後のリトライでも失敗、または別のエラー
        console.error('[VoiceWS] Failed to send audio data after retries:', error);
        return;
      }
    }
  }

  /**
   * Base64文字列をArrayBufferに変換
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * ASR（音声認識）開始を通知
   * バックエンドに音声データの送信が始まることを伝える
   */
  async sendStartAsr(): Promise<void> {
    console.log('[VoiceWS] Sending start_asr command');
    await this.sendMessage('start_asr', {});
  }

  /**
   * ASR（音声認識）終了を通知
   * バックエンドに音声データの送信が終了したことを伝える
   */
  async sendStopAsr(): Promise<void> {
    console.log('[VoiceWS] Sending stop_asr command');
    await this.sendMessage('stop_asr', {});
  }

  /**
   * 音声録音開始を通知（レガシー互換）
   */
  async sendAudioStart(): Promise<void> {
    // start_asrを送信
    await this.sendStartAsr();
  }

  /**
   * 音声録音終了を通知（レガシー互換）
   */
  async sendAudioEnd(): Promise<void> {
    // stop_asrを送信
    await this.sendStopAsr();
  }

  /**
   * テキストメッセージを送信
   */
  async sendText(text: string): Promise<void> {
    await this.sendMessage('text', {
      text,
    });
  }

  /**
   * 初期メタデータ（位置情報等）を送信
   */
  async sendMetadata(
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
  ): Promise<void> {
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

    await this.sendMessage('metadata', {
      location,
    });
  }

  /**
   * 接続状態を取得
   * React NativeではreadyStateが正しく更新されないため、独自フラグで判断
   */
  isConnected(): boolean {
    return this.isSocketOpen && this.socket !== null;
  }

  /**
   * コールバックを更新
   */
  setCallbacks(callbacks: WebSocketCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * メッセージを送信
   * React Nativeではonopenが呼ばれてもsendがまだできないことがあるため、リトライロジックを実装
   */
  private async sendMessage(type: MessageType, payload: ClientMessage['payload']): Promise<void> {
    if (!this.socket || !this.isSocketOpen) {
      console.warn('[VoiceWS] Cannot send message: not connected');
      console.warn('[VoiceWS] isSocketOpen:', this.isSocketOpen);
      return;
    }

    const message: ClientMessage = {
      type,
      timestamp: new Date().toISOString(),
      payload,
    };

    const jsonStr = JSON.stringify(message);

    // React NativeのWebSocketはonopenが呼ばれてもsend可能になるまで時間がかかることがある
    // リトライロジックで対応
    const maxRetries = 20;
    const retryDelay = 100; // ms

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.socket.send(jsonStr);

        // 統計更新
        this.stats.messagesSent++;
        this.stats.bytesSent += jsonStr.length;

        // pingメッセージ以外はログ出力
        if (type !== 'ping') {
          console.log(
            `[VoiceWS] >>> SENT [${type}] ${jsonStr.length} bytes (total: ${this.stats.messagesSent} msgs, ${Math.round(this.stats.bytesSent / 1024)}KB)`
          );
        }
        return; // 成功したら終了
      } catch (error) {
        const isInvalidState = error instanceof Error && error.message.includes('INVALID_STATE');

        if (isInvalidState && attempt < maxRetries - 1) {
          // INVALID_STATE_ERRの場合はリトライ
          if (attempt === 0) {
            console.log(`[VoiceWS] Socket not ready for send, waiting... (type: ${type})`);
          }
          await new Promise((r) => setTimeout(r, retryDelay));
          continue;
        }

        // 最後のリトライでも失敗、または別のエラー
        console.error('[VoiceWS] Send error after retries:', error);
        console.error('[VoiceWS] ReadyState:', this.getReadyStateString());
        return;
      }
    }
  }

  /**
   * 受信メッセージを処理
   */
  private handleMessage(data: string | ArrayBuffer | Blob): void {
    this.stats.lastMessageAt = new Date();

    // バイナリデータ（音声）の処理
    if (data instanceof ArrayBuffer || data instanceof Blob) {
      const byteSize = data instanceof ArrayBuffer ? data.byteLength : 0;
      this.stats.binaryMessagesReceived++;
      this.stats.bytesReceived += byteSize;
      console.log(
        `[VoiceWS] <<< RECV [BINARY] ${byteSize} bytes (total: ${this.stats.binaryMessagesReceived} binary msgs)`
      );
      this.handleBinaryAudio(data);
      return;
    }

    // 文字列でない場合はスキップ
    if (typeof data !== 'string') {
      console.warn('[VoiceWS] Unexpected data type:', typeof data);
      return;
    }

    // 統計更新
    this.stats.messagesReceived++;
    this.stats.bytesReceived += data.length;

    try {
      const parsed: unknown = JSON.parse(data);
      const result = serverMessageSchema.safeParse(parsed);

      if (!result.success) {
        console.warn('[VoiceWS] Invalid message format:', result.error);
        console.warn('[VoiceWS] Raw data:', data.substring(0, 200));
        return;
      }

      const message: ServerMessage = result.data;

      // pong以外はログ出力
      if (message.type !== 'pong') {
        console.log(
          `[VoiceWS] <<< RECV [${message.type}] ${data.length} bytes (total: ${this.stats.messagesReceived} msgs, ${Math.round(this.stats.bytesReceived / 1024)}KB)`
        );
        // メッセージ内容も表示（長すぎる場合は省略）
        const preview = data.length > 200 ? data.substring(0, 200) + '...' : data;
        console.log(`[VoiceWS] Content: ${preview}`);
      }

      // 共通コールバック
      this.callbacks.onMessage?.(message);

      // メッセージタイプ別の処理
      switch (message.type) {
        case 'connected':
          // サーバー接続確認メッセージ（ログは上で出力済み）
          break;

        case 'session_start':
          // セッション開始メッセージ（挨拶テキスト付き）
          // has_audio=true の場合は次にバイナリ音声データが送られてくる
          console.log(`[VoiceWS]   -> has_audio: ${message.has_audio}`);
          break;

        case 'asr_starting':
          // ASR（音声認識）開始中
          console.log(`[VoiceWS]   -> ASR starting: ${message.message ?? '(no message)'}`);
          break;

        case 'asr_connected':
          // ASR（音声認識）接続完了 - 音声データ送信可能
          console.log(`[VoiceWS]   -> ASR connected: ${message.message ?? '(no message)'}`);
          break;

        case 'asr_stopped':
          // ASR（音声認識）停止完了
          console.log(`[VoiceWS]   -> ASR stopped: ${message.message ?? '(no message)'}`);
          break;

        case 'transcription': {
          // 音声認識結果（新形式）
          const transcriptionText = message.text;
          if (transcriptionText !== undefined) {
            // is_final=true は is_partial=false と同義
            const isPartial = message.is_final === true ? false : (message.is_partial ?? true);
            console.log(
              `[VoiceWS]   -> transcription: "${transcriptionText}" (final: ${message.is_final})`
            );
            this.callbacks.onTranscript?.(transcriptionText, isPartial);
          }
          break;
        }

        case 'response': {
          // AIレスポンス
          console.log(
            `[VoiceWS]   -> response: turn=${message.turn_count}, complete=${message.is_complete}`
          );
          if (message.message) {
            console.log(`[VoiceWS]   -> message: "${message.message.substring(0, 100)}..."`);
          }
          break;
        }

        case 'response_audio': {
          // 新形式: audio_data, 旧形式: payload.audioData
          const audioData = message.audio_data ?? message.payload?.audioData;
          if (audioData) {
            const audioSizeKB = Math.round((audioData.length * 0.75) / 1024);
            console.log(`[VoiceWS]   -> audio_data: ${audioSizeKB}KB (base64)`);
            this.callbacks.onAudioReceived?.(audioData);
          }
          break;
        }

        case 'transcript': {
          // 新形式: text, is_partial, 旧形式: payload.transcript, payload.isPartial
          const transcript = message.text ?? message.payload?.transcript;
          if (transcript !== undefined) {
            const isPartial = message.is_partial ?? message.payload?.isPartial ?? false;
            console.log(`[VoiceWS]   -> transcript: "${transcript}" (partial: ${isPartial})`);
            this.callbacks.onTranscript?.(transcript, isPartial);
          }
          break;
        }

        case 'pong':
          // Ping応答（ログ省略）
          break;

        case 'destination': {
          // 新形式: latitude, longitude が直接ルートに存在
          if (message.latitude !== undefined && message.longitude !== undefined) {
            const destination = {
              latitude: message.latitude,
              longitude: message.longitude,
              name: message.name,
              address: message.address,
            };
            console.log(
              `[VoiceWS]   -> destination: lat=${destination.latitude}, lng=${destination.longitude}, name=${destination.name ?? 'N/A'}`
            );
            this.callbacks.onDestinationReceived?.(destination);
          } else if (message.payload?.destination) {
            // 旧形式との互換性
            console.log(`[VoiceWS]   -> destination (legacy): ${message.payload.destination.name}`);
            this.callbacks.onDestinationReceived?.(message.payload.destination);
          }
          break;
        }

        case 'error': {
          // 新形式: message, 旧形式: payload.error
          const errorMsg = message.message ?? message.payload?.error;
          if (errorMsg) {
            console.error(`[VoiceWS]   -> ERROR: ${errorMsg}`);
            this.callbacks.onError?.(new WebSocketError(errorMsg));
          }
          break;
        }

        default:
          console.log(`[VoiceWS]   -> (no specific handler for type: ${message.type})`);
      }
    } catch (error) {
      console.error('[VoiceWS] Message parse error:', error);
    }
  }

  /**
   * バイナリ音声データを処理
   */
  private async handleBinaryAudio(data: ArrayBuffer | Blob): Promise<void> {
    try {
      let base64Audio: string;

      if (data instanceof Blob) {
        // BlobをArrayBufferに変換
        const arrayBuffer = await data.arrayBuffer();
        base64Audio = this.arrayBufferToBase64(arrayBuffer);
      } else {
        base64Audio = this.arrayBufferToBase64(data);
      }

      const audioSizeBytes = Math.round(base64Audio.length * 0.75);
      console.log(`[VoiceWS] Binary audio converted: size=${Math.round(audioSizeBytes / 1024)}KB`);

      this.callbacks.onAudioReceived?.(base64Audio);
    } catch (error) {
      console.error('[VoiceWS] Failed to process binary audio:', error);
    }
  }

  /**
   * ArrayBufferをBase64文字列に変換
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    return btoa(binary);
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
