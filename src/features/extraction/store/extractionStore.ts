import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { ExtractionStatus, ExtractionProgress, StructuredContext } from '../types';

/**
 * 抽出ステート型定義
 */
interface ExtractionState {
  // 抽出状態
  status: ExtractionStatus;
  progress: ExtractionProgress;
  contextData: StructuredContext | null;

  // エラー
  error: string | null;

  // 最終更新
  lastUpdatedAt: string | null;

  // アクション
  startExtraction: () => void;
  updateProgress: (step: string, progressPercent: number) => void;
  completeExtraction: (data: StructuredContext) => void;
  setError: (message: string) => void;
  reset: () => void;
}

/**
 * 初期進捗状態
 */
const initialProgress: ExtractionProgress = {
  status: 'idle',
  progress: 0,
  currentStep: '',
  completedSteps: [],
  errorMessage: undefined,
};

/**
 * 抽出ストア
 */
export const useExtractionStore = create<ExtractionState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      status: 'idle',
      progress: initialProgress,
      contextData: null,
      error: null,
      lastUpdatedAt: null,

      // 抽出開始
      startExtraction: () => {
        set({
          status: 'collecting_health',
          progress: {
            status: 'collecting_health',
            progress: 0,
            currentStep: 'ヘルスケアデータを収集中...',
            completedSteps: [],
          },
          error: null,
        });
      },

      // 進捗更新
      updateProgress: (step: string, progressPercent: number) => {
        const currentProgress = get().progress;
        let newStatus: ExtractionStatus = currentProgress.status;

        // 進捗に応じてステータスを更新
        if (progressPercent < 30) {
          newStatus = 'collecting_health';
        } else if (progressPercent < 60) {
          newStatus = 'collecting_behavior';
        } else if (progressPercent < 90) {
          newStatus = 'aggregating';
        } else {
          newStatus = 'complete';
        }

        const completedSteps = [...currentProgress.completedSteps];
        if (currentProgress.currentStep && !completedSteps.includes(currentProgress.currentStep)) {
          completedSteps.push(currentProgress.currentStep);
        }

        set({
          status: newStatus,
          progress: {
            status: newStatus,
            progress: progressPercent,
            currentStep: step,
            completedSteps,
          },
        });
      },

      // 抽出完了
      completeExtraction: (data: StructuredContext) => {
        const completedSteps = [
          'ヘルスケアデータ収集',
          '行動履歴収集',
          'データ統合',
          'LLMコンテキスト生成',
        ];

        set({
          status: 'complete',
          progress: {
            status: 'complete',
            progress: 100,
            currentStep: '完了',
            completedSteps,
          },
          contextData: data,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      // エラー設定
      setError: (message: string) => {
        set({
          status: 'error',
          progress: {
            ...get().progress,
            status: 'error',
            errorMessage: message,
          },
          error: message,
        });
      },

      // リセット
      reset: () => {
        set({
          status: 'idle',
          progress: initialProgress,
          contextData: null,
          error: null,
          lastUpdatedAt: null,
        });
      },
    }),
    { name: 'extraction-store' }
  )
);

/**
 * セレクター
 */
export const selectExtractionStatus = (state: ExtractionState) => state.status;
export const selectExtractionProgress = (state: ExtractionState) => state.progress;
export const selectContextData = (state: ExtractionState) => state.contextData;
export const selectExtractionError = (state: ExtractionState) => state.error;
export const selectIsExtracting = (state: ExtractionState) =>
  state.status !== 'idle' && state.status !== 'complete' && state.status !== 'error';
