import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { ConnectionStatus, TransferProgress, SyncResult, VehicleInfo } from '../types';

/**
 * 接続ステート型定義
 */
interface ConnectionState {
  // 接続状態
  status: ConnectionStatus;
  vehicle: VehicleInfo | null;

  // 転送状態
  transferProgress: TransferProgress | null;
  lastSyncResult: SyncResult | null;

  // エラー
  error: string | null;

  // アクション
  startConnecting: () => void;
  setConnected: (vehicle: VehicleInfo) => void;
  startTransfer: () => void;
  updateTransferProgress: (progress: TransferProgress) => void;
  completeTransfer: (result: SyncResult) => void;
  setError: (message: string) => void;
  disconnect: () => void;
  reset: () => void;
}

/**
 * 接続ストア
 */
export const useConnectionStore = create<ConnectionState>()(
  devtools(
    (set) => ({
      // 初期状態
      status: 'disconnected',
      vehicle: null,
      transferProgress: null,
      lastSyncResult: null,
      error: null,

      // 接続開始
      startConnecting: () => {
        set({
          status: 'connecting',
          error: null,
        });
      },

      // 接続完了
      setConnected: (vehicle: VehicleInfo) => {
        set({
          status: 'connected',
          vehicle,
        });
      },

      // 転送開始
      startTransfer: () => {
        set({
          status: 'transferring',
          transferProgress: {
            status: 'transferring',
            progress: 0,
            bytesTransferred: 0,
            totalBytes: 0,
            currentPhase: 'preparing',
          },
        });
      },

      // 転送進捗更新
      updateTransferProgress: (progress: TransferProgress) => {
        set({
          status: progress.status,
          transferProgress: progress,
        });
      },

      // 転送完了
      completeTransfer: (result: SyncResult) => {
        set({
          status: 'done',
          lastSyncResult: result,
          transferProgress: null,
        });
      },

      // エラー設定
      setError: (message: string) => {
        set({
          status: 'error',
          error: message,
        });
      },

      // 切断
      disconnect: () => {
        set({
          status: 'disconnected',
          vehicle: null,
          transferProgress: null,
        });
      },

      // リセット
      reset: () => {
        set({
          status: 'disconnected',
          vehicle: null,
          transferProgress: null,
          lastSyncResult: null,
          error: null,
        });
      },
    }),
    { name: 'connection-store' }
  )
);

/**
 * セレクター
 */
export const selectConnectionStatus = (state: ConnectionState) => state.status;
export const selectVehicle = (state: ConnectionState) => state.vehicle;
export const selectTransferProgress = (state: ConnectionState) => state.transferProgress;
export const selectLastSyncResult = (state: ConnectionState) => state.lastSyncResult;
export const selectConnectionError = (state: ConnectionState) => state.error;
export const selectIsTransferring = (state: ConnectionState) => state.status === 'transferring';
export const selectIsConnected = (state: ConnectionState) =>
  state.status === 'connected' || state.status === 'transferring' || state.status === 'done';
