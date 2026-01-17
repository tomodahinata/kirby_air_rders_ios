import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getActivePersona } from '@/mocks/data/persona';
import { useJournalStore } from '@/features/journal/store/journalStore';

import { aggregateContext } from '../services/contextAggregator';
import { useExtractionStore } from '../store/extractionStore';
import type { StructuredContext } from '../types';

/**
 * Query Keys
 */
export const extractionKeys = {
  all: ['extraction'] as const,
  context: () => [...extractionKeys.all, 'context'] as const,
};

/**
 * 遅延ユーティリティ
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * データ抽出処理（段階的進捗更新付き）
 */
async function performExtraction(
  onProgress: (step: string, percent: number) => void,
  getJournalEntries: () => ReturnType<typeof useJournalStore.getState>['entries']
): Promise<StructuredContext> {
  const persona = getActivePersona();

  // ステップ1: ヘルスケアデータ収集
  onProgress('ヘルスケアデータを収集中...', 10);
  await delay(800);
  onProgress('心拍数データを分析中...', 20);
  await delay(500);
  onProgress('ストレスレベルを計算中...', 25);
  await delay(400);

  // ステップ2: 行動履歴収集
  onProgress('検索履歴を収集中...', 35);
  await delay(600);
  onProgress('購買履歴を分析中...', 45);
  await delay(500);
  onProgress('カレンダーイベントを確認中...', 55);
  await delay(400);

  // ステップ3: ジャーナルエントリー収集
  onProgress('ジャーナルエントリーを収集中...', 60);
  const journalEntries = getJournalEntries();
  await delay(300);

  // ステップ4: データ統合
  onProgress('データを統合中...', 70);
  await delay(600);
  onProgress('LLMコンテキストを生成中...', 85);

  // 実際のコンテキスト生成（ジャーナルエントリーを含む）
  const context = await aggregateContext(persona, journalEntries);

  onProgress('最終検証中...', 95);
  await delay(300);

  return context;
}

/**
 * データ抽出Mutation Hook
 */
export function useExtractData() {
  const queryClient = useQueryClient();
  const { startExtraction, updateProgress, completeExtraction, setError } = useExtractionStore();

  return useMutation({
    mutationFn: async () => {
      startExtraction();

      // ジャーナルエントリーを取得する関数（Zustand storeから直接取得）
      const getJournalEntries = () => useJournalStore.getState().entries;

      const context = await performExtraction((step, percent) => {
        updateProgress(step, percent);
      }, getJournalEntries);

      return context;
    },
    onSuccess: (data) => {
      completeExtraction(data);
      // キャッシュに保存
      queryClient.setQueryData(extractionKeys.context(), data);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'データ抽出に失敗しました');
    },
  });
}

/**
 * 抽出データをリフレッシュ
 */
export function useRefreshExtraction() {
  const extractMutation = useExtractData();
  const reset = useExtractionStore((state) => state.reset);

  return useCallback(async () => {
    reset();
    return extractMutation.mutateAsync();
  }, [extractMutation, reset]);
}

/**
 * 現在のコンテキストデータを取得
 */
export function useContextData(): StructuredContext | null {
  return useExtractionStore((state) => state.contextData);
}

/**
 * 抽出状態を取得
 */
export function useExtractionStatus() {
  const status = useExtractionStore((state) => state.status);
  const progress = useExtractionStore((state) => state.progress);
  const error = useExtractionStore((state) => state.error);

  return { status, progress, error };
}
