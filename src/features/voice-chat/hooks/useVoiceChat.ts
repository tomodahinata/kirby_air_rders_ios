import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocationStore, type LocationData } from '@/shared/lib/location';
import { loggers } from '@/shared/lib/logger';
import {
  getAudioPlayerService,
  resetAudioPlayerService,
  type AudioPlayerService,
  type PlayerState,
} from '../services/audioPlayerService';
import {
  getAudioRecorderService,
  resetAudioRecorderService,
  type AudioRecorderService,
  type RecordingState,
} from '../services/audioRecorderService';
import {
  getVoiceWebSocketService,
  resetVoiceWebSocketService,
  type VoiceWebSocketService,
} from '../services/websocketService';
import { useVoiceChatStore } from '../store/voiceChatStore';
import type { DestinationPayload, ServerMessage, WebSocketConfig } from '../types';

const log = loggers.voiceChat;

/**
 * 音声チャットフックのオプション
 */
interface UseVoiceChatOptions {
  /** WebSocket設定 */
  config?: Partial<WebSocketConfig>;
  /** 自動接続するか（デフォルト: false） */
  autoConnect?: boolean;
  /** 接続時に位置情報を取得・送信するか（デフォルト: true） */
  sendLocationOnConnect?: boolean;
  /** 音声受信時のコールバック */
  onAudioReceived?: (audioData: string) => void;
  /** メッセージ受信時のコールバック */
  onMessage?: (message: ServerMessage) => void;
  /** 目的地受信時のコールバック */
  onDestinationReceived?: (destination: DestinationPayload) => void;
  /** エラー時のコールバック */
  onError?: (error: Error) => void;
}

/**
 * 音声チャットカスタムフック
 * WebSocket通信、音声録音、音声再生を統合
 */
export function useVoiceChat(options: UseVoiceChatOptions = {}) {
  const {
    config,
    autoConnect = false,
    sendLocationOnConnect = true,
    onAudioReceived,
    onMessage,
    onDestinationReceived,
    onError,
  } = options;

  const wsServiceRef = useRef<VoiceWebSocketService | null>(null);
  const recorderRef = useRef<AudioRecorderService | null>(null);
  const playerRef = useRef<AudioPlayerService | null>(null);
  const pendingLocationRef = useRef<LocationData | null>(null);
  /** startListening重複呼び出し防止用 */
  const isStartingListeningRef = useRef(false);

  // 位置情報ストアからアクション取得
  const fetchLocationSafe = useLocationStore((s) => s.fetchLocationSafe);
  const locationIsLoading = useLocationStore((s) => s.isLoading);
  const currentLocation = useLocationStore((s) => s.location);

  // 録音・再生の状態
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    durationMs: 0,
    metering: null,
    isStreaming: false,
    segmentsSent: 0,
  });
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isPaused: false,
    queueLength: 0,
    currentItemId: null,
  });

  // ストアから状態とアクションを取得
  const connectionState = useVoiceChatStore((state) => state.connectionState);
  const conversationState = useVoiceChatStore((state) => state.conversationState);
  const conversationHistory = useVoiceChatStore((state) => state.conversationHistory);
  const currentTranscript = useVoiceChatStore((state) => state.currentTranscript);
  const isPartialTranscript = useVoiceChatStore((state) => state.isPartialTranscript);
  const error = useVoiceChatStore((state) => state.error);

  const setConnectionState = useVoiceChatStore((state) => state.setConnectionState);
  const setConversationState = useVoiceChatStore((state) => state.setConversationState);
  const setCurrentTranscript = useVoiceChatStore((state) => state.setCurrentTranscript);
  const clearTranscript = useVoiceChatStore((state) => state.clearTranscript);
  const addUserMessage = useVoiceChatStore((state) => state.addUserMessage);
  const addAssistantMessage = useVoiceChatStore((state) => state.addAssistantMessage);
  const setDestination = useVoiceChatStore((state) => state.setDestination);
  const destination = useVoiceChatStore((state) => state.destination);
  const setError = useVoiceChatStore((state) => state.setError);
  const clearError = useVoiceChatStore((state) => state.clearError);
  const reset = useVoiceChatStore((state) => state.reset);

  /**
   * サーバーメッセージを処理
   */
  const handleServerMessage = useCallback(
    (message: ServerMessage) => {
      log.debug('Handling server message:', message.type);

      switch (message.type) {
        case 'response_start':
          setConversationState('speaking');
          break;

        case 'response_end': {
          setConversationState('idle');
          // アシスタントの応答をテキストとして追加（新形式: text, 旧形式: payload.text）
          const responseText = message.text ?? message.payload?.text;
          if (responseText) {
            addAssistantMessage(responseText);
          }
          break;
        }

        case 'error': {
          // 新形式: message, 旧形式: payload.error
          const errorMsg = message.message ?? message.payload?.error ?? 'Server error';
          setError(errorMsg);
          setConversationState('idle');
          break;
        }
      }
    },
    [setConversationState, addAssistantMessage, setError]
  );

  /**
   * 受信した音声データを再生キューに追加
   */
  const handleAudioReceived = useCallback(
    async (audioData: string) => {
      log.debug('Audio data received, enqueueing for playback');

      if (!playerRef.current) {
        log.warn('Player not initialized');
        return;
      }

      try {
        await playerRef.current.enqueue(audioData);
      } catch (err) {
        log.error('Failed to enqueue audio:', err);
        setError(err instanceof Error ? err.message : 'Audio playback failed');
      }

      // 外部コールバックも呼び出す
      onAudioReceived?.(audioData);
    },
    [onAudioReceived, setError]
  );

  /**
   * 目的地受信時の処理
   */
  const handleDestinationReceived = useCallback(
    (receivedDestination: DestinationPayload) => {
      log.debug(
        'Destination received:',
        receivedDestination.latitude,
        receivedDestination.longitude
      );

      // ストアに目的地を保存（アプリ内マップで使用）
      setDestination(receivedDestination);

      // アシスタントメッセージとして目的地を追加
      const destinationLabel =
        receivedDestination.name ??
        `${receivedDestination.latitude.toFixed(4)}, ${receivedDestination.longitude.toFixed(4)}`;
      const destinationMessage = receivedDestination.address
        ? `目的地: ${destinationLabel}\n住所: ${receivedDestination.address}`
        : `目的地: ${destinationLabel}`;
      addAssistantMessage(destinationMessage);

      // 外部コールバックを呼び出す
      onDestinationReceived?.(receivedDestination);

      // 会話状態をidleに戻す
      setConversationState('idle');
    },
    [setDestination, addAssistantMessage, setConversationState, onDestinationReceived]
  );

  /**
   * WebSocket接続を開始（位置情報取得と並行処理）
   */
  const connect = useCallback(async () => {
    clearError();
    setConnectionState('connecting');

    // 音声再生サービスを初期化
    playerRef.current = getAudioPlayerService({
      onStateChange: setPlayerState,
      onQueueComplete: () => {
        log.debug('Audio queue playback complete');
        // 再生完了後、会話状態がまだspeakingならidleに
        if (useVoiceChatStore.getState().conversationState === 'speaking') {
          setConversationState('idle');
        }
      },
      onError: (err) => {
        log.error('Player error:', err);
        setError(err.message);
      },
    });

    // 音声録音サービスを初期化
    recorderRef.current = getAudioRecorderService({
      onStateChange: setRecordingState,
      onError: (err) => {
        log.error('Recorder error:', err);
        setError(err.message);
        setConversationState('idle');
      },
    });

    // 位置情報取得を並行して開始（sendLocationOnConnectがtrueの場合）
    let locationPromise: Promise<LocationData | null> = Promise.resolve(null);
    if (sendLocationOnConnect) {
      log.debug('Starting location fetch in parallel...');
      locationPromise = fetchLocationSafe({ highAccuracy: true, timeout: 10000 });
    }

    // WebSocketサービスを初期化
    const wsService = getVoiceWebSocketService(config, {
      onOpen: async () => {
        setConnectionState('connected');
        log.debug('Connected');

        // 位置情報の取得を待って、メタデータを送信
        if (sendLocationOnConnect) {
          try {
            // 位置情報の取得完了を待つ（既に並行で取得開始済み）
            const location = pendingLocationRef.current ?? (await locationPromise);
            log.debug('Location fetch completed, sending metadata');

            // 位置情報メタデータを送信（音声データ送信前に）
            await wsService.sendMetadata(
              location
                ? {
                    latitude: location.coordinates.latitude,
                    longitude: location.coordinates.longitude,
                    accuracy: location.coordinates.accuracy,
                    altitude: location.coordinates.altitude,
                    address: location.address
                      ? {
                          city: location.address.city,
                          region: location.address.region,
                          country: location.address.country,
                        }
                      : null,
                  }
                : null
            );
          } catch (err) {
            // 位置情報取得失敗時もnullを送信して継続
            log.warn('Location fetch failed, sending null metadata:', err);
            await wsService.sendMetadata(null);
          }
        }
      },
      onClose: (code, reason) => {
        log.debug('Connection closed:', code, reason);
        setConnectionState('disconnected');
        setConversationState('idle');
      },
      onError: (err) => {
        log.error('WebSocket error:', err);
        setError(err.message);
        setConnectionState('error');
        onError?.(err);
      },
      onMessage: (message) => {
        handleServerMessage(message);
        onMessage?.(message);
      },
      onAudioReceived: handleAudioReceived,
      onDestinationReceived: handleDestinationReceived,
      onTranscript: (text, isPartial) => {
        log.debug(`Transcript: "${text}" (partial: ${isPartial})`);
        setCurrentTranscript(text, isPartial);

        // 確定した転写テキストをユーザーメッセージとして追加
        if (!isPartial && text.trim()) {
          addUserMessage(text);
          clearTranscript();
        }
      },
    });

    wsServiceRef.current = wsService;

    // 位置情報取得とWebSocket接続を並行実行
    try {
      const [wsResult, locationResult] = await Promise.all([
        wsService.connect().then(() => 'connected' as const),
        locationPromise,
      ]);

      // 位置情報の結果を保存（onOpenで使用）
      pendingLocationRef.current = locationResult;
      log.debug('Parallel init complete:', {
        ws: wsResult,
        location: locationResult ? 'obtained' : 'null',
      });
    } catch (err) {
      setConnectionState('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, [
    config,
    clearError,
    setConnectionState,
    setConversationState,
    setError,
    setCurrentTranscript,
    addUserMessage,
    clearTranscript,
    handleServerMessage,
    handleAudioReceived,
    handleDestinationReceived,
    onMessage,
    onError,
    sendLocationOnConnect,
    fetchLocationSafe,
  ]);

  /**
   * WebSocket接続を切断
   */
  const disconnect = useCallback(async () => {
    log.debug('Disconnecting...');

    // 録音中なら停止
    if (recorderRef.current?.isRecording()) {
      await recorderRef.current.cancel();
    }

    // 再生中なら停止
    if (playerRef.current?.isPlaying()) {
      await playerRef.current.stop();
    }

    // WebSocket切断
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
    }

    setConnectionState('disconnected');
    setConversationState('idle');
  }, [setConnectionState, setConversationState]);

  /**
   * 音声録音開始
   */
  const startListening = useCallback(async () => {
    if (!wsServiceRef.current?.isConnected()) {
      log.warn('Cannot start listening: not connected');
      return;
    }

    if (recorderRef.current?.isRecording()) {
      log.warn('Already recording');
      return;
    }

    // 重複呼び出し防止
    if (isStartingListeningRef.current) {
      log.warn('startListening already in progress, skipping');
      return;
    }
    isStartingListeningRef.current = true;

    log.debug('Starting to listen...');

    try {
      // 再生中なら停止
      if (playerRef.current?.isPlaying()) {
        await playerRef.current.stop();
      }

      // WebSocketに録音開始を通知
      await wsServiceRef.current.sendAudioStart();

      // 録音を開始（ストリーミングモード）
      if (!recorderRef.current) {
        recorderRef.current = getAudioRecorderService({
          onStateChange: setRecordingState,
          onError: (err) => {
            log.error('Recorder error:', err);
            setError(err.message);
            setConversationState('idle');
          },
          // ストリーミングモード: 音声チャンクが準備できたらWebSocketで送信
          onAudioChunk: async (base64Data, segmentNumber, durationMs) => {
            if (wsServiceRef.current?.isConnected()) {
              log.debug(`Sending audio chunk #${segmentNumber} (${durationMs}ms)`);
              await wsServiceRef.current.sendAudioData(base64Data, 'wav');
            }
          },
        });
      } else {
        // 既存のrecorderにコールバックを設定
        recorderRef.current.setCallbacks({
          onStateChange: setRecordingState,
          onError: (err) => {
            log.error('Recorder error:', err);
            setError(err.message);
            setConversationState('idle');
          },
          onAudioChunk: async (base64Data, segmentNumber, durationMs) => {
            if (wsServiceRef.current?.isConnected()) {
              log.debug(`Sending audio chunk #${segmentNumber} (${durationMs}ms)`);
              await wsServiceRef.current.sendAudioData(base64Data, 'wav');
            }
          },
        });
      }

      // ストリーミングモードで録音開始
      await recorderRef.current.startStreaming();
      setConversationState('listening');
      clearTranscript();

      log.debug('Streaming recording started');
    } catch (err) {
      log.error('Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Recording failed');
      setConversationState('idle');
    } finally {
      isStartingListeningRef.current = false;
    }
  }, [setConversationState, clearTranscript, setError]);

  /**
   * 音声録音停止
   */
  const stopListening = useCallback(async () => {
    if (!recorderRef.current?.isRecording()) {
      log.warn('Not recording');
      return;
    }

    log.debug('Stopping streaming recording...');
    setConversationState('processing');

    try {
      // ストリーミング録音を停止（最終チャンクはonAudioChunkで送信される）
      if (recorderRef.current.isStreaming()) {
        await recorderRef.current.stopStreaming();
      } else {
        // 従来モードの場合（互換性のため）
        const audioData = await recorderRef.current.stop();
        if (audioData && wsServiceRef.current?.isConnected()) {
          log.debug('Sending recorded audio data');
          await wsServiceRef.current.sendAudioData(audioData, 'wav');
        }
      }

      // WebSocketに録音終了を通知
      if (wsServiceRef.current) {
        await wsServiceRef.current.sendAudioEnd();
      }

      log.debug('Streaming recording stopped');
    } catch (err) {
      log.error('Failed to stop recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to process audio');
      setConversationState('idle');
    }
  }, [setConversationState, setError]);

  /**
   * 音声データを送信（外部から直接データを送信する場合用）
   */
  const sendAudioData = useCallback(async (audioData: string) => {
    if (!wsServiceRef.current?.isConnected()) {
      log.warn('Cannot send audio: not connected');
      return;
    }

    await wsServiceRef.current.sendAudioData(audioData);
  }, []);

  /**
   * テキストメッセージを送信
   */
  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!wsServiceRef.current?.isConnected()) {
        log.warn('Cannot send text: not connected');
        return;
      }

      log.debug('Sending text message:', text);
      await wsServiceRef.current.sendText(text);
      addUserMessage(text);
      setConversationState('processing');
    },
    [addUserMessage, setConversationState]
  );

  /**
   * 再生を停止
   */
  const stopPlayback = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.stop();
      setConversationState('idle');
    }
  }, [setConversationState]);

  /**
   * 会話をリセット
   */
  const resetConversation = useCallback(async () => {
    // 再生停止
    if (playerRef.current) {
      await playerRef.current.stop();
    }

    // 録音停止
    if (recorderRef.current?.isRecording()) {
      await recorderRef.current.cancel();
    }

    reset();
  }, [reset]);

  // 自動接続（初回マウント時のみ）
  const hasAutoConnectedRef = useRef(false);

  useEffect(() => {
    if (autoConnect && !hasAutoConnectedRef.current) {
      hasAutoConnectedRef.current = true;
      connect();
    }
    // connectを依存配列に含めると再レンダリング時に切断されるため除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  // アンマウント時のクリーンアップ（コンポーネント破棄時のみ）
  useEffect(() => {
    return () => {
      log.debug('Component unmounting, cleaning up...');
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
      // 非同期クリーンアップ
      (async () => {
        await resetAudioRecorderService();
        await resetAudioPlayerService();
        resetVoiceWebSocketService();
      })();
    };
  }, []);

  return {
    // 状態
    connectionState,
    conversationState,
    conversationHistory,
    currentTranscript,
    isPartialTranscript,
    destination,
    error,

    // 録音・再生状態
    recordingState,
    playerState,

    // 位置情報状態
    location: currentLocation,
    isLocationLoading: locationIsLoading,

    // 派生状態
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isListening: conversationState === 'listening',
    isProcessing: conversationState === 'processing',
    isSpeaking: conversationState === 'speaking',
    isRecording: recordingState.isRecording,
    isStreamingAudio: recordingState.isStreaming,
    segmentsSent: recordingState.segmentsSent,
    isPlayingAudio: playerState.isPlaying,
    hasDestination: destination !== null,

    // アクション
    connect,
    disconnect,
    startListening,
    stopListening,
    sendAudioData,
    sendTextMessage,
    stopPlayback,
    resetConversation,
    clearError,
  };
}
