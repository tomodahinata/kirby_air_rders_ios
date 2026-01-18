import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { File } from 'expo-file-system';
import { loggers } from '@/shared/lib/logger';

const log = loggers.audio;

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
  /** ストリーミングモードでのセグメント間隔 (ms) - 短すぎると音が途切れる */
  streamingSegmentIntervalMs: 1000,
  /** UIフィードバック用のメータリング更新間隔 (ms) */
  meteringIntervalMs: 100,
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
  /** ストリーミングモードかどうか */
  isStreaming: boolean;
  /** 送信済みセグメント数 */
  segmentsSent: number;
}

/**
 * 録音コールバック
 */
export interface RecordingCallbacks {
  /** 録音チャンクが準備できた時（Base64エンコード済み） - ストリーミングモードで使用 */
  onAudioChunk?: (base64Data: string, segmentNumber: number, durationMs: number) => void;
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
  private meteringTimer: ReturnType<typeof setInterval> | null = null;
  private streamingTimer: ReturnType<typeof setTimeout> | null = null;
  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    durationMs: 0,
    metering: null,
    isStreaming: false,
    segmentsSent: 0,
  };

  /** start()の重複呼び出し防止用 */
  private isStarting = false;
  /** ストリーミングモードかどうか */
  private isStreamingMode = false;
  /** 現在のセグメント番号 */
  private segmentNumber = 0;
  /** 合計録音時間 (ms) */
  private totalDurationMs = 0;
  /** セグメント処理中かどうか */
  private isProcessingSegment = false;
  /** ストリーミング停止リクエスト中かどうか */
  private stopRequested = false;

  constructor(callbacks: RecordingCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * 録音を開始（従来モード - 停止時に全データを返す）
   */
  async start(): Promise<void> {
    await this.startInternal(false);
  }

  /**
   * ストリーミングモードで録音を開始
   * 一定間隔でonAudioChunkコールバックを呼び出し、音声チャンクを送信
   */
  async startStreaming(): Promise<void> {
    await this.startInternal(true);
  }

  /**
   * 録音開始の内部実装
   */
  private async startInternal(streamingMode: boolean): Promise<void> {
    // 重複呼び出し防止
    if (this.isStarting) {
      log.warn('start() already in progress, skipping');
      return;
    }

    // 既に録音中の場合はスキップ
    if (this.state.isRecording) {
      log.warn('Already recording, skipping');
      return;
    }

    this.isStarting = true;
    this.isStreamingMode = streamingMode;
    this.segmentNumber = 0;
    this.totalDurationMs = 0;
    this.stopRequested = false;

    try {
      // 既存の録音オブジェクトがある場合はクリーンアップ
      if (this.recording) {
        log.debug('Cleaning up existing recording before start');
        try {
          await this.recording.stopAndUnloadAsync();
        } catch {
          // 既に停止している場合は無視
        }
        this.recording = null;
      }

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

      log.debug(`Starting in ${streamingMode ? 'STREAMING' : 'NORMAL'} mode`);
      log.debug(`Config: ${RECORDING_CONFIG.sampleRate}Hz, ${RECORDING_CONFIG.numberOfChannels}ch`);

      if (streamingMode) {
        // ストリーミングモード: 最初のセグメントを開始
        await this.startNewSegment();
        // メータリング用タイマーを開始
        this.startMeteringTimer();
      } else {
        // 通常モード: 単一の録音を開始
        await this.startSingleRecording();
      }

      this.updateState({
        isRecording: true,
        isStreaming: streamingMode,
        segmentsSent: 0,
      });
    } catch (error) {
      log.error('Start error:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * 通常モードの録音開始
   */
  private async startSingleRecording(): Promise<void> {
    this.recording = new Audio.Recording();
    await this.recording.prepareToRecordAsync(RECORDING_OPTIONS);

    // ステータス更新コールバックを設定
    this.recording.setOnRecordingStatusUpdate((status) => {
      if (status.isRecording) {
        this.state = {
          ...this.state,
          isRecording: true,
          isPaused: false,
          durationMs: status.durationMillis,
          metering: status.metering ?? null,
        };
        this.callbacks.onStateChange?.(this.state);
      }
    });

    await this.recording.startAsync();
    log.debug('Recording started (normal mode)');
  }

  /**
   * ストリーミングモード: 新しいセグメントを開始
   */
  private async startNewSegment(): Promise<void> {
    if (this.stopRequested) {
      log.debug('Stop requested, not starting new segment');
      return;
    }

    try {
      // iOSでは録音停止後にオーディオモードがリセットされるため、
      // 新しいセグメント開始前に再度設定が必要
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(RECORDING_OPTIONS);
      await this.recording.startAsync();

      log.debug(`Segment ${this.segmentNumber} started`);

      // 次のセグメント処理をスケジュール
      this.streamingTimer = setTimeout(() => {
        this.processSegment();
      }, RECORDING_CONFIG.streamingSegmentIntervalMs);
    } catch (error) {
      log.error('Failed to start new segment:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * ストリーミングモード: 現在のセグメントを処理して次を開始
   */
  private async processSegment(): Promise<void> {
    if (this.isProcessingSegment || !this.recording) {
      return;
    }

    this.isProcessingSegment = true;

    try {
      // 現在の録音を停止
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      if (uri) {
        // ファイルからデータを読み取り
        const file = new File(uri);
        const arrayBuffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        const segmentDurationMs = Math.round(
          (arrayBuffer.byteLength / (RECORDING_CONFIG.sampleRate * 2)) * 1000
        );

        this.totalDurationMs += segmentDurationMs;

        const fileSizeKB = Math.round(arrayBuffer.byteLength / 1024);
        log.debug(
          `Segment ${this.segmentNumber} complete: ${fileSizeKB}KB, ` +
            `${segmentDurationMs}ms, total: ${this.totalDurationMs}ms`
        );

        // コールバックで音声チャンクを送信
        this.callbacks.onAudioChunk?.(base64, this.segmentNumber, segmentDurationMs);

        // ファイルを削除
        try {
          await file.delete();
        } catch {
          // 無視
        }

        this.segmentNumber++;
        this.updateState({
          segmentsSent: this.segmentNumber,
          durationMs: this.totalDurationMs,
        });
      }

      this.recording = null;

      // 停止リクエストがなければ次のセグメントを開始
      if (!this.stopRequested) {
        await this.startNewSegment();
      } else {
        log.debug('Streaming stopped after segment processing');
        await this.finalizeStreaming();
      }
    } catch (error) {
      log.error('Segment processing error:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isProcessingSegment = false;
    }
  }

  /**
   * ストリーミング終了処理
   */
  private async finalizeStreaming(): Promise<void> {
    this.stopMeteringTimer();
    this.stopStreamingTimer();

    // Audio セッションをリセット
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    this.updateState({
      isRecording: false,
      isStreaming: false,
      durationMs: 0,
      metering: null,
    });

    log.debug(
      `Streaming finalized. Total segments: ${this.segmentNumber}, ` +
        `Total duration: ${this.totalDurationMs}ms`
    );
  }

  /**
   * 録音を停止（従来モード用）
   * @returns 録音した音声データ（Base64）
   */
  async stop(): Promise<string | null> {
    if (this.isStreamingMode) {
      // ストリーミングモードの場合はstopStreamingを使用
      await this.stopStreaming();
      return null;
    }

    if (!this.recording) {
      log.warn('No active recording to stop');
      return null;
    }

    try {
      // 録音を停止
      await this.recording.stopAndUnloadAsync();
      log.debug('Recording stopped');

      // 録音ファイルのURIを取得
      const uri = this.recording.getURI();
      log.debug(`Recording URI: ${uri}`);

      if (uri) {
        // 新しいFileSystem APIを使用してファイルを読み取り
        const file = new File(uri);
        const arrayBuffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);

        const fileSizeKB = Math.round(arrayBuffer.byteLength / 1024);
        log.debug(`Final audio size: ${fileSizeKB}KB`);

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
      log.error('Stop error:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      this.recording = null;
      this.updateState({ isRecording: false });
      return null;
    }
  }

  /**
   * ストリーミングモードの録音を停止
   * 現在のセグメントの処理を待って終了
   */
  async stopStreaming(): Promise<void> {
    if (!this.isStreamingMode) {
      log.warn('Not in streaming mode');
      return;
    }

    log.debug('Stopping streaming...');
    this.stopRequested = true;
    this.stopStreamingTimer();

    // 現在録音中のセグメントがあれば最終チャンクとして処理
    if (this.recording && !this.isProcessingSegment) {
      try {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();

        if (uri) {
          const file = new File(uri);
          const arrayBuffer = await file.arrayBuffer();
          const base64 = arrayBufferToBase64(arrayBuffer);
          const segmentDurationMs = Math.round(
            (arrayBuffer.byteLength / (RECORDING_CONFIG.sampleRate * 2)) * 1000
          );

          this.totalDurationMs += segmentDurationMs;

          const fileSizeKB = Math.round(arrayBuffer.byteLength / 1024);
          log.debug(
            `Final segment ${this.segmentNumber}: ${fileSizeKB}KB, ` + `${segmentDurationMs}ms`
          );

          // 最終チャンクを送信
          this.callbacks.onAudioChunk?.(base64, this.segmentNumber, segmentDurationMs);

          try {
            await file.delete();
          } catch {
            // 無視
          }

          this.segmentNumber++;
        }

        this.recording = null;
      } catch (error) {
        log.error('Error stopping final segment:', error);
      }
    }

    // セグメント処理中の場合は終了を待つ
    if (this.isProcessingSegment) {
      log.debug('Waiting for segment processing to complete...');
      // 処理完了を待つ（最大3秒）
      let waitCount = 0;
      while (this.isProcessingSegment && waitCount < 30) {
        await new Promise((r) => setTimeout(r, 100));
        waitCount++;
      }
    }

    await this.finalizeStreaming();
  }

  /**
   * 録音をキャンセル
   */
  async cancel(): Promise<void> {
    this.stopRequested = true;
    this.stopMeteringTimer();
    this.stopStreamingTimer();

    if (!this.recording) {
      this.updateState({
        isRecording: false,
        isStreaming: false,
        durationMs: 0,
        metering: null,
      });
      return;
    }

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
    this.isStreamingMode = false;
    this.updateState({
      isRecording: false,
      isStreaming: false,
      durationMs: 0,
      metering: null,
    });
    log.debug('Recording cancelled');
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
   * ストリーミングモードかどうか
   */
  isStreaming(): boolean {
    return this.state.isStreaming;
  }

  /**
   * コールバックを更新
   */
  setCallbacks(callbacks: RecordingCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * メータリング用タイマーを開始（ストリーミングモード用）
   */
  private startMeteringTimer(): void {
    this.stopMeteringTimer();

    this.meteringTimer = setInterval(async () => {
      if (!this.recording || !this.state.isRecording) {
        return;
      }

      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          this.state = {
            ...this.state,
            metering: status.metering ?? null,
          };
          this.callbacks.onStateChange?.(this.state);
        }
      } catch {
        // エラーは無視（セグメント切り替え中など）
      }
    }, RECORDING_CONFIG.meteringIntervalMs);
  }

  /**
   * メータリング用タイマーを停止
   */
  private stopMeteringTimer(): void {
    if (this.meteringTimer) {
      clearInterval(this.meteringTimer);
      this.meteringTimer = null;
    }
  }

  /**
   * ストリーミング用タイマーを停止
   */
  private stopStreamingTimer(): void {
    if (this.streamingTimer) {
      clearTimeout(this.streamingTimer);
      this.streamingTimer = null;
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
