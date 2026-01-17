import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { StructuredContext } from '@/features/extraction/types';

import { performFullSync } from '../services/carSync';
import { useConnectionStore } from '../store/connectionStore';
import type { SyncResult } from '../types';

/**
 * 車載同期Mutation Hook
 */
export function useCarSync() {
  const {
    startConnecting,
    setConnected,
    startTransfer,
    updateTransferProgress,
    completeTransfer,
    setError,
    disconnect,
  } = useConnectionStore();

  return useMutation<SyncResult, Error, StructuredContext>({
    mutationFn: async (contextData: StructuredContext) => {
      return performFullSync(contextData, {
        onConnectionStatus: (status) => {
          if (status === 'connecting') {
            startConnecting();
          } else if (status === 'connected') {
            setConnected({
              id: 'mock-vehicle-id',
              name: 'My Car',
              manufacturer: 'Toyota',
              model: 'RAV4',
              year: 2024,
              displayType: 'premium',
            });
          }
        },
        onTransferProgress: (progress) => {
          if (progress.currentPhase === 'preparing') {
            startTransfer();
          }
          updateTransferProgress(progress);
        },
        onComplete: (result) => {
          completeTransfer(result);
        },
        onError: (error) => {
          setError(error.message);
        },
      });
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      // 3秒後に切断状態に戻す
      setTimeout(() => {
        disconnect();
      }, 3000);
    },
  });
}

/**
 * 接続状態を取得
 */
export function useConnectionStatus() {
  const status = useConnectionStore((state) => state.status);
  const vehicle = useConnectionStore((state) => state.vehicle);
  const transferProgress = useConnectionStore((state) => state.transferProgress);
  const lastSyncResult = useConnectionStore((state) => state.lastSyncResult);
  const error = useConnectionStore((state) => state.error);

  return {
    status,
    vehicle,
    transferProgress,
    lastSyncResult,
    error,
    isConnecting: status === 'connecting',
    isConnected: status === 'connected' || status === 'transferring' || status === 'done',
    isTransferring: status === 'transferring',
    isDone: status === 'done',
  };
}

/**
 * 手動切断
 */
export function useDisconnect() {
  const disconnect = useConnectionStore((state) => state.disconnect);
  return useCallback(() => disconnect(), [disconnect]);
}

/**
 * 状態リセット
 */
export function useResetConnection() {
  const reset = useConnectionStore((state) => state.reset);
  return useCallback(() => reset(), [reset]);
}
