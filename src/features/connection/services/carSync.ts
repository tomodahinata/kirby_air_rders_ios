import { loggers } from '@/shared/lib/logger';
import type {
  ConnectionStatus,
  TransferProgress,
  SyncResult,
  VehicleInfo,
  ConnectionEvent,
  SyncableData,
} from '../types';

const log = loggers.connection;

/**
 * シミュレートされた車両情報
 */
export const MOCK_VEHICLE: VehicleInfo = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'My Car',
  manufacturer: 'Toyota',
  model: 'RAV4',
  year: 2024,
  displayType: 'premium',
};

/**
 * イベントリスナー型
 */
type ConnectionEventListener = (event: ConnectionEvent) => void;

/**
 * グローバルイベントリスナー
 */
const eventListeners: Set<ConnectionEventListener> = new Set();

/**
 * イベントリスナーを追加
 */
export function addConnectionEventListener(listener: ConnectionEventListener): () => void {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

/**
 * イベントを発火
 */
function emitEvent(type: ConnectionEvent['type'], details?: Record<string, unknown>): void {
  const event: ConnectionEvent = {
    type,
    timestamp: new Date().toISOString(),
    details,
  };

  eventListeners.forEach((listener) => listener(event));

  // デバッグログ
  log.debug(`[CarSync] Event: ${type}`, details ?? '');
}

/**
 * 遅延ユーティリティ
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 接続をシミュレート
 */
export async function simulateConnection(
  onProgress?: (status: ConnectionStatus) => void
): Promise<VehicleInfo> {
  emitEvent('connection_started');
  onProgress?.('connecting');

  // 接続確立をシミュレート（1-2秒）
  await delay(1000 + Math.random() * 1000);

  emitEvent('connection_established', { vehicle: MOCK_VEHICLE });
  onProgress?.('connected');

  log.debug('[CarSync] Connected to vehicle:', MOCK_VEHICLE.name);

  return MOCK_VEHICLE;
}

/**
 * データ転送をシミュレート
 */
export async function syncToCar(
  data: SyncableData,
  onProgress?: (progress: TransferProgress) => void
): Promise<SyncResult> {
  const startTime = Date.now();
  const dataString = JSON.stringify(data);
  const totalBytes = new TextEncoder().encode(dataString).length;

  log.debug('[CarSync] Starting data transfer...');
  log.debug('[CarSync] Data size:', totalBytes, 'bytes');
  log.debug('[CarSync] Context data:', data);

  emitEvent('transfer_started', { totalBytes });

  // フェーズ1: 準備中
  onProgress?.({
    status: 'transferring',
    progress: 0,
    bytesTransferred: 0,
    totalBytes,
    currentPhase: 'preparing',
  });
  await delay(300);

  // フェーズ2: 圧縮中
  onProgress?.({
    status: 'transferring',
    progress: 10,
    bytesTransferred: Math.round(totalBytes * 0.1),
    totalBytes,
    currentPhase: 'compressing',
  });
  await delay(500);

  // フェーズ3: 暗号化中
  onProgress?.({
    status: 'transferring',
    progress: 25,
    bytesTransferred: Math.round(totalBytes * 0.25),
    totalBytes,
    currentPhase: 'encrypting',
  });
  await delay(400);

  // フェーズ4: 送信中（段階的に進行）
  const sendingSteps = [40, 55, 70, 85, 95];
  for (const progress of sendingSteps) {
    emitEvent('transfer_progress', { progress });
    onProgress?.({
      status: 'transferring',
      progress,
      bytesTransferred: Math.round(totalBytes * (progress / 100)),
      totalBytes,
      currentPhase: 'sending',
      estimatedTimeRemainingMs: Math.round((100 - progress) * 20),
    });
    await delay(200 + Math.random() * 300);
  }

  // フェーズ5: 検証中
  onProgress?.({
    status: 'transferring',
    progress: 98,
    bytesTransferred: totalBytes,
    totalBytes,
    currentPhase: 'verifying',
  });
  await delay(300);

  // フェーズ6: 完了
  onProgress?.({
    status: 'done',
    progress: 100,
    bytesTransferred: totalBytes,
    totalBytes,
    currentPhase: 'complete',
  });

  const duration = Date.now() - startTime;

  const result: SyncResult = {
    success: true,
    syncedAt: new Date().toISOString(),
    duration,
    bytesTransferred: totalBytes,
    retryCount: 0,
  };

  emitEvent('transfer_complete', result);

  log.debug('[CarSync] Transfer complete!');
  log.debug('[CarSync] Duration:', duration, 'ms');
  log.debug('[CarSync] Result:', result);

  // トースト通知用のメッセージ（UIで使用）
  log.debug(
    '%c✓ 車載ディスプレイにデータを送信しました',
    'color: #22c55e; font-weight: bold; font-size: 14px;'
  );

  return result;
}

/**
 * 接続を切断
 */
export async function disconnect(): Promise<void> {
  await delay(200);
  emitEvent('connection_lost');
  log.debug('[CarSync] Disconnected');
}

/**
 * 接続状態をチェック（モック）
 */
export function checkConnectionStatus(): ConnectionStatus {
  // 実際の実装では、USBやBluetoothの状態を確認
  return 'disconnected';
}

/**
 * 利用可能な接続タイプを取得（モック）
 */
export function getAvailableConnectionTypes(): Array<'usb_c' | 'bluetooth'> {
  // iPhone 15のUSB-Cを想定
  return ['usb_c', 'bluetooth'];
}

/**
 * フルシンクフロー（接続→転送→切断）
 */
export async function performFullSync(
  data: SyncableData,
  callbacks?: {
    onConnectionStatus?: (status: ConnectionStatus) => void;
    onTransferProgress?: (progress: TransferProgress) => void;
    onComplete?: (result: SyncResult) => void;
    onError?: (error: Error) => void;
  }
): Promise<SyncResult> {
  try {
    // 接続
    await simulateConnection(callbacks?.onConnectionStatus);

    // 転送
    const result = await syncToCar(data, callbacks?.onTransferProgress);

    // 完了コールバック
    callbacks?.onComplete?.(result);

    // 少し待ってから切断
    await delay(1000);
    await disconnect();

    return result;
  } catch (error) {
    emitEvent('error', { error: String(error) });
    callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
