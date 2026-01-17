import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getVoiceWebSocketService,
  resetVoiceWebSocketService,
  type VoiceWebSocketService,
} from '../services/websocketService';
import {
  getAudioRecorderService,
  resetAudioRecorderService,
  type AudioRecorderService,
  type RecordingState,
} from '../services/audioRecorderService';
import {
  getAudioPlayerService,
  resetAudioPlayerService,
  type AudioPlayerService,
  type PlayerState,
} from '../services/audioPlayerService';
import { useVoiceChatStore } from '../store/voiceChatStore';
import type { ServerMessage, WebSocketConfig } from '../types';
import { useLocationStore, type LocationData } from '@/shared/lib/location';

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
    onError,
  } = options;

  const wsServiceRef = useRef<VoiceWebSocketService | null>(null);
  const recorderRef = useRef<AudioRecorderService | null>(null);
  const playerRef = useRef<AudioPlayerService | null>(null);
  const pendingLocationRef = useRef<LocationData | null>(null);

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
  const sessionId = useVoiceChatStore((state) => state.sessionId);
  const conversationHistory = useVoiceChatStore((state) => state.conversationHistory);
  const currentTranscript = useVoiceChatStore((state) => state.currentTranscript);
  const isPartialTranscript = useVoiceChatStore((state) => state.isPartialTranscript);
  const error = useVoiceChatStore((state) => state.error);

  const setConnectionState = useVoiceChatStore((state) => state.setConnectionState);
  const setConversationState = useVoiceChatStore((state) => state.setConversationState);
  const setSessionId = useVoiceChatStore((state) => state.setSessionId);
  const setCurrentTranscript = useVoiceChatStore((state) => state.setCurrentTranscript);
  const clearTranscript = useVoiceChatStore((state) => state.clearTranscript);
  const addUserMessage = useVoiceChatStore((state) => state.addUserMessage);
  const addAssistantMessage = useVoiceChatStore((state) => state.addAssistantMessage);
  const setError = useVoiceChatStore((state) => state.setError);
  const clearError = useVoiceChatStore((state) => state.clearError);
  const reset = useVoiceChatStore((state) => state.reset);

  /**
   * サーバーメッセージを処理
   */
  const handleServerMessage = useCallback(
    (message: ServerMessage) => {
      console.log('[useVoiceChat] Handling server message:', message.type);

      switch (message.type) {
        case 'response_start':
          setConversationState('speaking');
          break;

        case 'response_end':
          setConversationState('idle');
          // アシスタントの応答をテキストとして追加
          if (message.payload.text) {
            addAssistantMessage(message.payload.text);
          }
          break;

        case 'error':
          setError(message.payload.error ?? 'Server error');
          setConversationState('idle');
          break;
      }
    },
    [setConversationState, addAssistantMessage, setError]
  );

  /**
   * 受信した音声データを再生キューに追加
   */
  const handleAudioReceived = useCallback(
    async (audioData: string) => {
      console.log('[useVoiceChat] Audio data received, enqueueing for playback');

      if (!playerRef.current) {
        console.warn('[useVoiceChat] Player not initialized');
        return;
      }

      try {
        await playerRef.current.enqueue(audioData);
      } catch (err) {
        console.error('[useVoiceChat] Failed to enqueue audio:', err);
        setError(err instanceof Error ? err.message : 'Audio playback failed');
      }

      // 外部コールバックも呼び出す
      onAudioReceived?.(audioData);
    },
    [onAudioReceived, setError]
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
        console.log('[useVoiceChat] Audio queue playback complete');
        // 再生完了後、会話状態がまだspeakingならidleに
        if (useVoiceChatStore.getState().conversationState === 'speaking') {
          setConversationState('idle');
        }
      },
      onError: (err) => {
        console.error('[useVoiceChat] Player error:', err);
        setError(err.message);
      },
    });

    // 音声録音サービスを初期化
    recorderRef.current = getAudioRecorderService({
      onStateChange: setRecordingState,
      onError: (err) => {
        console.error('[useVoiceChat] Recorder error:', err);
        setError(err.message);
        setConversationState('idle');
      },
    });

    // 位置情報取得を並行して開始（sendLocationOnConnectがtrueの場合）
    let locationPromise: Promise<LocationData | null> = Promise.resolve(null);
    if (sendLocationOnConnect) {
      console.log('[useVoiceChat] Starting location fetch in parallel...');
      locationPromise = fetchLocationSafe({ highAccuracy: true, timeout: 10000 });
    }

    // WebSocketサービスを初期化
    const wsService = getVoiceWebSocketService(config, {
      onOpen: async () => {
        setConnectionState('connected');
        const newSessionId = wsService.getSessionId();
        if (newSessionId) {
          setSessionId(newSessionId);
        }
        console.log('[useVoiceChat] Connected, sessionId:', newSessionId);

        // 位置情報の取得を待って、メタデータを送信
        if (sendLocationOnConnect) {
          try {
            // 位置情報の取得完了を待つ（既に並行で取得開始済み）
            const location = pendingLocationRef.current ?? (await locationPromise);
            console.log('[useVoiceChat] Location fetch completed, sending metadata');

            // 位置情報メタデータを送信（音声データ送信前に）
            wsService.sendMetadata(
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
            console.warn('[useVoiceChat] Location fetch failed, sending null metadata:', err);
            wsService.sendMetadata(null);
          }
        }
      },
      onClose: (code, reason) => {
        console.log('[useVoiceChat] Connection closed:', code, reason);
        setConnectionState('disconnected');
        setConversationState('idle');
      },
      onError: (err) => {
        console.error('[useVoiceChat] WebSocket error:', err);
        setError(err.message);
        setConnectionState('error');
        onError?.(err);
      },
      onMessage: (message) => {
        handleServerMessage(message);
        onMessage?.(message);
      },
      onAudioReceived: handleAudioReceived,
      onTranscript: (text, isPartial) => {
        console.log(`[useVoiceChat] Transcript: "${text}" (partial: ${isPartial})`);
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
      console.log('[useVoiceChat] Parallel init complete:', {
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
    setSessionId,
    setConversationState,
    setError,
    setCurrentTranscript,
    addUserMessage,
    clearTranscript,
    handleServerMessage,
    handleAudioReceived,
    onMessage,
    onError,
    sendLocationOnConnect,
    fetchLocationSafe,
  ]);

  /**
   * WebSocket接続を切断
   */
  const disconnect = useCallback(async () => {
    console.log('[useVoiceChat] Disconnecting...');

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
      console.warn('[useVoiceChat] Cannot start listening: not connected');
      return;
    }

    if (recorderRef.current?.isRecording()) {
      console.warn('[useVoiceChat] Already recording');
      return;
    }

    console.log('[useVoiceChat] Starting to listen...');

    try {
      // 再生中なら停止
      if (playerRef.current?.isPlaying()) {
        await playerRef.current.stop();
      }

      // WebSocketに録音開始を通知
      wsServiceRef.current.sendAudioStart();

      // 録音を開始
      if (!recorderRef.current) {
        recorderRef.current = getAudioRecorderService({
          onStateChange: setRecordingState,
          onError: (err) => {
            console.error('[useVoiceChat] Recorder error:', err);
            setError(err.message);
            setConversationState('idle');
          },
        });
      }

      await recorderRef.current.start();
      setConversationState('listening');
      clearTranscript();

      console.log('[useVoiceChat] Recording started');
    } catch (err) {
      console.error('[useVoiceChat] Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Recording failed');
      setConversationState('idle');
    }
  }, [setConversationState, clearTranscript, setError]);

  /**
   * 音声録音停止
   */
  const stopListening = useCallback(async () => {
    if (!recorderRef.current?.isRecording()) {
      console.warn('[useVoiceChat] Not recording');
      return;
    }

    console.log('[useVoiceChat] Stopping recording...');
    setConversationState('processing');

    try {
      // 録音を停止し、音声データを取得
      const audioData = await recorderRef.current.stop();

      if (audioData && wsServiceRef.current?.isConnected()) {
        // 音声データをWebSocketで送信
        console.log('[useVoiceChat] Sending recorded audio data');
        wsServiceRef.current.sendAudioData(audioData, 'wav');
      }

      // WebSocketに録音終了を通知
      wsServiceRef.current?.sendAudioEnd();

      console.log('[useVoiceChat] Recording stopped and audio sent');
    } catch (err) {
      console.error('[useVoiceChat] Failed to stop recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to process audio');
      setConversationState('idle');
    }
  }, [setConversationState, setError]);

  /**
   * 音声データを送信（外部から直接データを送信する場合用）
   */
  const sendAudioData = useCallback((audioData: string) => {
    if (!wsServiceRef.current?.isConnected()) {
      console.warn('[useVoiceChat] Cannot send audio: not connected');
      return;
    }

    wsServiceRef.current.sendAudioData(audioData);
  }, []);

  /**
   * テキストメッセージを送信
   */
  const sendTextMessage = useCallback(
    (text: string) => {
      if (!wsServiceRef.current?.isConnected()) {
        console.warn('[useVoiceChat] Cannot send text: not connected');
        return;
      }

      console.log('[useVoiceChat] Sending text message:', text);
      wsServiceRef.current.sendText(text);
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

  // 自動接続
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, [autoConnect, connect]);

  // クリーンアップ
  useEffect(() => {
    return () => {
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
    sessionId,
    conversationHistory,
    currentTranscript,
    isPartialTranscript,
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
    isPlayingAudio: playerState.isPlaying,

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
