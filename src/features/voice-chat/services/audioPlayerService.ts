import { Audio, InterruptionModeIOS, InterruptionModeAndroid, AVPlaybackStatus } from 'expo-av';
import { File, Directory, Paths } from 'expo-file-system';
import { loggers } from '@/shared/lib/logger';

const log = loggers.audio;

/**
 * 再生設定
 */
export const PLAYBACK_CONFIG = {
  sampleRate: 16000,
  numberOfChannels: 1,
  /** 再生キューの最大サイズ */
  maxQueueSize: 50,
  /** 再生開始前の最小バッファ数（ジッターバッファ） */
  minBufferBeforePlay: 1,
};

/**
 * 再生キュー内のアイテム
 */
interface QueueItem {
  id: string;
  base64Data: string;
  timestamp: number;
}

/**
 * 再生状態
 */
export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  queueLength: number;
  currentItemId: string | null;
}

/**
 * 再生コールバック
 */
export interface PlayerCallbacks {
  /** 再生状態が変化した時 */
  onStateChange?: (state: PlayerState) => void;
  /** 音声アイテムの再生が完了した時 */
  onItemComplete?: (itemId: string) => void;
  /** 全キューの再生が完了した時 */
  onQueueComplete?: () => void;
  /** エラー発生時 */
  onError?: (error: Error) => void;
}

/**
 * Base64文字列をUint8Arrayに変換
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * 音声再生サービスクラス
 * 受信した音声データをキューで管理し、順次再生
 */
export class AudioPlayerService {
  private queue: QueueItem[] = [];
  private currentSound: Audio.Sound | null = null;
  private callbacks: PlayerCallbacks;
  private state: PlayerState = {
    isPlaying: false,
    isPaused: false,
    queueLength: 0,
    currentItemId: null,
  };
  private isProcessingQueue = false;
  private itemCounter = 0;
  private tempDir: Directory;
  /** 再生中のステータスコールバックを有効にするかどうか */
  private isStatusCallbackActive = false;

  constructor(callbacks: PlayerCallbacks = {}) {
    this.callbacks = callbacks;
    this.tempDir = new Directory(Paths.cache, 'voice-audio');
    this.ensureTempDir();
  }

  /**
   * 一時ディレクトリを確保
   */
  private async ensureTempDir(): Promise<void> {
    try {
      if (!this.tempDir.exists) {
        this.tempDir.create();
      }
    } catch (error) {
      log.error('Failed to create temp dir:', error);
    }
  }

  /**
   * 音声データをキューに追加
   */
  async enqueue(base64Data: string): Promise<string> {
    const itemId = `audio-${Date.now()}-${++this.itemCounter}`;

    const item: QueueItem = {
      id: itemId,
      base64Data,
      timestamp: Date.now(),
    };

    // キューサイズの制限
    if (this.queue.length >= PLAYBACK_CONFIG.maxQueueSize) {
      log.warn('Queue full, dropping oldest item');
      this.queue.shift();
    }

    this.queue.push(item);
    const dataSize = Math.round((base64Data.length * 0.75) / 1024);
    log.debug(`Enqueued: ${itemId}, Size: ${dataSize}KB, Queue length: ${this.queue.length}`);

    this.updateState({ queueLength: this.queue.length });

    // 再生を開始（まだ再生中でなければ）
    if (!this.isProcessingQueue && this.queue.length >= PLAYBACK_CONFIG.minBufferBeforePlay) {
      this.processQueue();
    }

    return itemId;
  }

  /**
   * キューを処理して順次再生
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;
    log.debug('Starting queue processing');

    // Audio セッションを設定
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      log.error('Failed to set audio mode:', error);
    }

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      this.updateState({
        queueLength: this.queue.length,
        currentItemId: item.id,
        isPlaying: true,
      });

      try {
        await this.playItem(item);
        this.callbacks.onItemComplete?.(item.id);
        log.debug(`Completed: ${item.id}`);
      } catch (error) {
        log.error(`Error playing ${item.id}:`, error);
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.isProcessingQueue = false;
    this.updateState({
      isPlaying: false,
      currentItemId: null,
      queueLength: 0,
    });

    log.debug('Queue processing complete');
    this.callbacks.onQueueComplete?.();
  }

  /**
   * 単一のアイテムを再生
   */
  private async playItem(item: QueueItem): Promise<void> {
    const tempFile = new File(this.tempDir, `${item.id}.wav`);

    try {
      // Base64データを一時ファイルに書き込み
      const bytes = base64ToUint8Array(item.base64Data);
      await tempFile.write(bytes);

      log.debug(`Playing: ${item.id}, File size: ${bytes.byteLength} bytes`);

      // ステータスコールバックを有効化
      this.isStatusCallbackActive = true;

      // 音声を読み込んで再生
      const { sound } = await Audio.Sound.createAsync(
        { uri: tempFile.uri },
        { shouldPlay: true },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.currentSound = sound;

      // 再生完了を待つ
      await new Promise<void>((resolve) => {
        // ポーリングで完了を検出
        const interval = setInterval(async () => {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded && status.didJustFinish) {
              clearInterval(interval);
              resolve();
            }
          } catch {
            clearInterval(interval);
            resolve();
          }
        }, 100);

        // タイムアウト（30秒）
        setTimeout(() => {
          clearInterval(interval);
          resolve(); // タイムアウト時は次に進む
        }, 30000);
      });

      // ステータスコールバックを無効化
      this.isStatusCallbackActive = false;

      // クリーンアップ
      await sound.unloadAsync();
      this.currentSound = null;

      // 一時ファイルを削除
      try {
        await tempFile.delete();
      } catch {
        // 無視
      }
    } catch (error) {
      // クリーンアップを試みる
      if (this.currentSound) {
        try {
          await this.currentSound.unloadAsync();
        } catch {
          // 無視
        }
        this.currentSound = null;
      }
      try {
        await tempFile.delete();
      } catch {
        // 無視
      }
      throw error;
    }
  }

  /**
   * 再生ステータス更新ハンドラ
   */
  private onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    // コールバックが無効な場合はスキップ
    if (!this.isStatusCallbackActive) {
      return;
    }

    if (!status.isLoaded) {
      if (status.error) {
        log.error('Playback error:', status.error);
      }
      return;
    }

    // 再生中または完了時のみログを出力（ログスパム防止）
    if (status.isPlaying || status.didJustFinish) {
      log.debug(
        `Playback: ` +
          `${Math.round(status.positionMillis / 1000)}s / ` +
          `${Math.round((status.durationMillis ?? 0) / 1000)}s` +
          (status.didJustFinish ? ' [FINISHED]' : '')
      );
    }
  }

  /**
   * 再生を停止
   */
  async stop(): Promise<void> {
    log.debug('Stopping playback');

    // ステータスコールバックを無効化
    this.isStatusCallbackActive = false;

    // キューをクリア
    this.queue = [];

    // 現在の再生を停止
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (error) {
        log.error('Error stopping sound:', error);
      }
      this.currentSound = null;
    }

    this.isProcessingQueue = false;
    this.updateState({
      isPlaying: false,
      isPaused: false,
      queueLength: 0,
      currentItemId: null,
    });
  }

  /**
   * 再生を一時停止
   */
  async pause(): Promise<void> {
    if (this.currentSound && this.state.isPlaying) {
      await this.currentSound.pauseAsync();
      this.updateState({ isPaused: true });
      log.debug('Paused');
    }
  }

  /**
   * 再生を再開
   */
  async resume(): Promise<void> {
    if (this.currentSound && this.state.isPaused) {
      await this.currentSound.playAsync();
      this.updateState({ isPaused: false });
      log.debug('Resumed');
    }
  }

  /**
   * キューをクリア
   */
  clearQueue(): void {
    this.queue = [];
    this.updateState({ queueLength: 0 });
    log.debug('Queue cleared');
  }

  /**
   * 現在の状態を取得
   */
  getState(): PlayerState {
    return { ...this.state };
  }

  /**
   * 再生中かどうか
   */
  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * コールバックを更新
   */
  setCallbacks(callbacks: PlayerCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * 一時ファイルをすべて削除
   */
  async cleanup(): Promise<void> {
    try {
      if (this.tempDir.exists) {
        await this.tempDir.delete();
      }
      await this.ensureTempDir();
      log.debug('Cleaned up temp files');
    } catch (error) {
      log.error('Cleanup error:', error);
    }
  }

  /**
   * 状態を更新
   */
  private updateState(partial: Partial<PlayerState>): void {
    this.state = { ...this.state, ...partial };
    this.callbacks.onStateChange?.(this.state);
  }
}

/**
 * シングルトンインスタンス
 */
let playerInstance: AudioPlayerService | null = null;

/**
 * 再生サービスのシングルトンを取得
 */
export function getAudioPlayerService(callbacks?: PlayerCallbacks): AudioPlayerService {
  if (!playerInstance) {
    playerInstance = new AudioPlayerService(callbacks);
  } else if (callbacks) {
    playerInstance.setCallbacks(callbacks);
  }
  return playerInstance;
}

/**
 * 再生サービスをリセット
 */
export async function resetAudioPlayerService(): Promise<void> {
  if (playerInstance) {
    await playerInstance.stop();
    await playerInstance.cleanup();
    playerInstance = null;
  }
}
