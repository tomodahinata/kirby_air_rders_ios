import { API_CONFIG } from '@/shared/constants';
import type { ManualJournalEntry } from '@/shared/types/schema';

import {
  syncJournalRequestSchema,
  syncJournalResponseSchema,
  type SyncJournalRequest,
  type SyncJournalResponse,
} from './schema';

/**
 * API エラークラス
 */
export class JournalSyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'JournalSyncError';
  }
}

/**
 * ネットワークエラークラス
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * バリデーションエラークラス
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * AbortController のタイムアウトユーティリティ
 */
function createTimeoutController(timeoutMs: number): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

/**
 * ジャーナルエントリーを車載器に送信
 *
 * @param entries - 送信するジャーナルエントリー配列
 * @param options - オプション設定
 * @returns 同期結果
 * @throws {JournalSyncError} API エラー時
 * @throws {NetworkError} ネットワークエラー時
 * @throws {ValidationError} レスポンスバリデーションエラー時
 */
export async function syncJournalToDevice(
  entries: ManualJournalEntry[],
  options?: {
    deviceId?: string;
    timeout?: number;
    baseUrl?: string;
  }
): Promise<SyncJournalResponse> {
  const { deviceId, timeout = API_CONFIG.TIMEOUT, baseUrl = API_CONFIG.BASE_URL } = options ?? {};

  // リクエストデータ構築
  const requestData: SyncJournalRequest = {
    entries,
    deviceId,
    timestamp: new Date().toISOString(),
  };

  // リクエストバリデーション
  const requestValidation = syncJournalRequestSchema.safeParse(requestData);
  if (!requestValidation.success) {
    throw new ValidationError('リクエストデータが不正です', requestValidation.error.format());
  }

  const { controller, timeoutId } = createTimeoutController(timeout);

  try {
    const response = await fetch(`${baseUrl}/api/v1/journal/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestValidation.data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // HTTPエラーハンドリング
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new JournalSyncError(
        errorBody.error?.message ?? `HTTP Error: ${response.status}`,
        errorBody.error?.code ?? 'HTTP_ERROR',
        response.status,
        errorBody.error?.details
      );
    }

    // レスポンスパース
    const responseData: unknown = await response.json();

    // レスポンスバリデーション
    const responseValidation = syncJournalResponseSchema.safeParse(responseData);
    if (!responseValidation.success) {
      throw new ValidationError('サーバーからの応答が不正です', responseValidation.error.format());
    }

    return responseValidation.data;
  } catch (error) {
    clearTimeout(timeoutId);

    // AbortError（タイムアウト）
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('リクエストがタイムアウトしました');
    }

    // 既知のエラーは再スロー
    if (
      error instanceof JournalSyncError ||
      error instanceof NetworkError ||
      error instanceof ValidationError
    ) {
      throw error;
    }

    // ネットワークエラー
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('ネットワーク接続に失敗しました', error);
    }

    // その他のエラー
    throw new NetworkError(
      error instanceof Error ? error.message : '不明なエラーが発生しました',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * エラーメッセージを取得するユーティリティ
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof JournalSyncError) {
    return error.message;
  }
  if (error instanceof NetworkError) {
    return error.message;
  }
  if (error instanceof ValidationError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '不明なエラーが発生しました';
}
