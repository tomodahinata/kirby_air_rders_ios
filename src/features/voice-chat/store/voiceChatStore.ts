import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type {
  ConnectionState,
  ConversationState,
  ConversationEntry,
  VoiceChatState,
  DestinationPayload,
} from '../types';

/**
 * UUID生成ユーティリティ
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * ストアアクション
 */
interface VoiceChatActions {
  // 接続状態
  setConnectionState: (state: ConnectionState) => void;
  setConversationState: (state: ConversationState) => void;

  // 会話履歴
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, audioUrl?: string) => void;
  clearHistory: () => void;

  // 転写
  setCurrentTranscript: (text: string, isPartial: boolean) => void;
  clearTranscript: () => void;

  // 目的地
  setDestination: (destination: DestinationPayload | null) => void;
  clearDestination: () => void;

  // エラー
  setError: (error: string | null) => void;
  clearError: () => void;

  // 統計
  updatePing: (latencyMs: number) => void;

  // リセット
  reset: () => void;
}

/**
 * 初期状態
 */
const initialState: VoiceChatState = {
  connectionState: 'disconnected',
  conversationState: 'idle',
  conversationHistory: [],
  currentTranscript: '',
  isPartialTranscript: false,
  destination: null,
  error: null,
  lastPingAt: null,
  latencyMs: null,
};

/**
 * 音声チャットストア
 */
export const useVoiceChatStore = create<VoiceChatState & VoiceChatActions>()(
  devtools(
    (set) => ({
      ...initialState,

      // 接続状態
      setConnectionState: (connectionState) => set({ connectionState }),
      setConversationState: (conversationState) => set({ conversationState }),

      // 会話履歴
      addUserMessage: (content) =>
        set((state) => {
          const entry: ConversationEntry = {
            id: generateUUID(),
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
          };
          return {
            conversationHistory: [...state.conversationHistory, entry],
          };
        }),

      addAssistantMessage: (content, audioUrl) =>
        set((state) => {
          const entry: ConversationEntry = {
            id: generateUUID(),
            role: 'assistant',
            content,
            timestamp: new Date().toISOString(),
            audioUrl,
          };
          return {
            conversationHistory: [...state.conversationHistory, entry],
          };
        }),

      clearHistory: () => set({ conversationHistory: [] }),

      // 転写
      setCurrentTranscript: (text, isPartial) =>
        set({
          currentTranscript: text,
          isPartialTranscript: isPartial,
        }),

      clearTranscript: () =>
        set({
          currentTranscript: '',
          isPartialTranscript: false,
        }),

      // 目的地
      setDestination: (destination) => set({ destination }),
      clearDestination: () => set({ destination: null }),

      // エラー
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // 統計
      updatePing: (latencyMs) =>
        set({
          lastPingAt: new Date().toISOString(),
          latencyMs,
        }),

      // リセット
      reset: () => set(initialState),
    }),
    { name: 'voice-chat-store' }
  )
);

/**
 * セレクター
 */
export const selectConnectionState = (state: VoiceChatState) => state.connectionState;
export const selectConversationState = (state: VoiceChatState) => state.conversationState;
export const selectIsConnected = (state: VoiceChatState) => state.connectionState === 'connected';
export const selectIsListening = (state: VoiceChatState) => state.conversationState === 'listening';
export const selectConversationHistory = (state: VoiceChatState) => state.conversationHistory;
export const selectCurrentTranscript = (state: VoiceChatState) => state.currentTranscript;
export const selectDestination = (state: VoiceChatState) => state.destination;
export const selectError = (state: VoiceChatState) => state.error;
