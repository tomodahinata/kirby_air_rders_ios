import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { File } from 'expo-file-system';

/**
 * ArrayBufferをBase64に変換
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
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
 * 録音設定（サーバー側と一致させる必要あり）
 */
export const RECORDING_CONFIG = {
  sampleRate: 16000,
  numberOfChannels: 1,
  bitDepthHint: 16,
  format: 'pcm' as const,
  /** チャンク送信間隔 (ms) */
  chunkIntervalMs: 250,
};

/**
 * expo-av録音オプション
 */
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: RECORDING_CONFIG.sampleRate,
    numberOfChannels: RECORDING_CONFIG.numberOfChannels,
    bitRate: RECORDING_CONFIG.sampleRate * RECORDING_CONFIG.numberOfChannels * 16,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: RECORDING_CONFIG.sampleRate,
    numberOfChannels: RECORDING_CONFIG.numberOfChannels,
    bitDepthHint: RECORDING_CONFIG.bitDepthHint,
    bitRate: RECORDING_CONFIG.sampleRate * RECORDING_CONFIG.numberOfChannels * 16,
    linearPCMBitDepth: RECORDING_CONFIG.bitDepthHint,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/wav',
    bitsPerSecond: RECORDING_CONFIG.sampleRate * RECORDING_CONFIG.numberOfChannels * 16,
  },
};

/**
 * 録音状態
 */
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  durationMs: number;
  metering: number | null;
}

/**
 * 録音コールバック
 */
export interface RecordingCallbacks {
  /** 録音チャンクが準備できた時（Base64エンコード済み） */
  onAudioChunk?: (base64Data: string, durationMs: number) => void;
  /** 録音状態が変化した時 */
  onStateChange?: (state: RecordingState) => void;
  /** エラー発生時 */
  onError?: (error: Error) => void;
}

/**
 * 音声録音サービスクラス
 * マイクからの音声をリアルタイムでBase64チャンクとして出力
 */
export class AudioRecorderService {
  private recording: Audio.Recording | null = null;
  private callbacks: RecordingCallbacks;
  private chunkTimer: ReturnType<typeof setInterval> | null = null;
  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    durationMs: 0,
    metering: null,
  };
  private lastChunkTime = 0;

  constructor(callbacks: RecordingCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * 録音を開始
   */
  async start(): Promise<void> {
    try {
      // Audio セッションを設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 録音パーミッションを確認
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('マイクの権限が許可されていません');
      }

      // 録音オブジェクトを作成
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(RECORDING_OPTIONS);

      console.log('[AudioRecorder] Recording prepared');
      console.log(
        `[AudioRecorder] Config: ${RECORDING_CONFIG.sampleRate}Hz, ${RECORDING_CONFIG.numberOfChannels}ch`
      );

      // ステータス更新コールバックを設定
      this.recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          this.state = {
            isRecording: true,
            isPaused: false,
            durationMs: status.durationMillis,
            metering: status.metering ?? null,
          };
          this.callbacks.onStateChange?.(this.state);
        }
      });

      // 録音開始
      await this.recording.startAsync();
      this.lastChunkTime = Date.now();

      console.log('[AudioRecorder] Recording started');

      // チャンク送信タイマーを開始
      this.startChunkTimer();

      this.updateState({ isRecording: true });
    } catch (error) {
      console.error('[AudioRecorder] Start error:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * 録音を停止し、最終チャンクを送信
   */
  async stop(): Promise<string | null> {
    if (!this.recording) {
      console.warn('[AudioRecorder] No active recording to stop');
      return null;
    }

    try {
      // タイマーを停止
      this.stopChunkTimer();

      // 録音を停止
      await this.recording.stopAndUnloadAsync();
      console.log('[AudioRecorder] Recording stopped');

      // 録音ファイルのURIを取得
      const uri = this.recording.getURI();
      console.log(`[AudioRecorder] Recording URI: ${uri}`);

      if (uri) {
        // 新しいFileSystem APIを使用してファイルを読み取り
        const file = new File(uri);
        const arrayBuffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);

        const fileSizeKB = Math.round(arrayBuffer.byteLength / 1024);
        console.log(`[AudioRecorder] Final audio size: ${fileSizeKB}KB`);

        // ファイルを削除（クリーンアップ）
        try {
          await file.delete();
        } catch {
          // 削除失敗は無視
        }

        this.recording = null;
        this.updateState({ isRecording: false, durationMs: 0, metering: null });

        // Audio セッションをリセット
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        return base64;
      }

      this.recording = null;
      this.updateState({ isRecording: false });
      return null;
    } catch (error) {
      console.error('[AudioRecorder] Stop error:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      this.recording = null;
      this.updateState({ isRecording: false });
      return null;
    }
  }

  /**
   * 録音をキャンセル
   */
  async cancel(): Promise<void> {
    if (!this.recording) {
      return;
    }

    this.stopChunkTimer();

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      if (uri) {
        const file = new File(uri);
        try {
          await file.delete();
        } catch {
          // 無視
        }
      }
    } catch {
      // エラーは無視
    }

    this.recording = null;
    this.updateState({ isRecording: false, durationMs: 0, metering: null });
    console.log('[AudioRecorder] Recording cancelled');
  }

  /**
   * 現在の状態を取得
   */
  getState(): RecordingState {
    return { ...this.state };
  }

  /**
   * 録音中かどうか
   */
  isRecording(): boolean {
    return this.state.isRecording;
  }

  /**
   * コールバックを更新
   */
  setCallbacks(callbacks: RecordingCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * チャンク送信タイマーを開始
   * 注意: expo-avは録音中にファイルアクセスできないため、
   * このタイマーは主にUIフィードバック用のメータリング更新に使用
   */
  private startChunkTimer(): void {
    this.stopChunkTimer();

    this.chunkTimer = setInterval(async () => {
      if (!this.recording || !this.state.isRecording) {
        return;
      }

      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          const currentTime = Date.now();
          const chunkDuration = currentTime - this.lastChunkTime;

          // デバッグ: メータリング情報をログ
          console.log(
            `[AudioRecorder] Recording... Duration: ${status.durationMillis}ms, ` +
              `Metering: ${status.metering?.toFixed(2) ?? 'N/A'}dB, ` +
              `Chunk interval: ${chunkDuration}ms`
          );

          this.lastChunkTime = currentTime;
        }
      } catch (error) {
        console.error('[AudioRecorder] Chunk timer error:', error);
      }
    }, RECORDING_CONFIG.chunkIntervalMs);
  }

  /**
   * チャンク送信タイマーを停止
   */
  private stopChunkTimer(): void {
    if (this.chunkTimer) {
      clearInterval(this.chunkTimer);
      this.chunkTimer = null;
    }
  }

  /**
   * 状態を更新
   */
  private updateState(partial: Partial<RecordingState>): void {
    this.state = { ...this.state, ...partial };
    this.callbacks.onStateChange?.(this.state);
  }
}

/**
 * シングルトンインスタンス
 */
let recorderInstance: AudioRecorderService | null = null;

/**
 * 録音サービスのシングルトンを取得
 */
export function getAudioRecorderService(callbacks?: RecordingCallbacks): AudioRecorderService {
  if (!recorderInstance) {
    recorderInstance = new AudioRecorderService(callbacks);
  } else if (callbacks) {
    recorderInstance.setCallbacks(callbacks);
  }
  return recorderInstance;
}

/**
 * 録音サービスをリセット
 */
export async function resetAudioRecorderService(): Promise<void> {
  if (recorderInstance) {
    await recorderInstance.cancel();
    recorderInstance = null;
  }
}
