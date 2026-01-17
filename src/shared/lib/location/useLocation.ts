import { useCallback, useRef } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import {
  type LocationData,
  type LocationState,
  type LocationPermissionStatus,
  type LocationOptions,
  type InitialMetadata,
  DEFAULT_LOCATION_OPTIONS,
} from './schema';
import {
  getCurrentLocation,
  getCurrentLocationSafe,
  checkLocationPermission,
  requestLocationPermission,
  LocationError,
} from './locationService';

/**
 * 位置情報ストアのアクション
 */
interface LocationActions {
  /** 位置情報を取得 */
  fetchLocation: (options?: LocationOptions) => Promise<LocationData | null>;
  /** 位置情報を安全に取得（エラー時null） */
  fetchLocationSafe: (options?: LocationOptions) => Promise<LocationData | null>;
  /** 権限をリクエスト */
  requestPermission: () => Promise<LocationPermissionStatus>;
  /** 権限状態を確認 */
  checkPermission: () => Promise<LocationPermissionStatus>;
  /** エラーをクリア */
  clearError: () => void;
  /** ストアをリセット */
  reset: () => void;
}

/**
 * 初期状態
 */
const initialState: LocationState = {
  location: null,
  isLoading: false,
  permissionStatus: 'undetermined',
  error: null,
  lastUpdatedAt: null,
};

/**
 * 位置情報Zustandストア
 */
export const useLocationStore = create<LocationState & LocationActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchLocation: async (options?: LocationOptions) => {
        set({ isLoading: true, error: null });

        try {
          const location = await getCurrentLocation(options);
          set({
            location,
            isLoading: false,
            permissionStatus: 'granted',
            lastUpdatedAt: new Date().toISOString(),
          });
          return location;
        } catch (error) {
          const errorMessage =
            error instanceof LocationError ? error.message : '位置情報の取得に失敗しました';

          const permissionStatus =
            error instanceof LocationError && error.code === 'PERMISSION_DENIED'
              ? 'denied'
              : get().permissionStatus;

          set({
            isLoading: false,
            error: errorMessage,
            permissionStatus,
          });

          throw error;
        }
      },

      fetchLocationSafe: async (options?: LocationOptions) => {
        set({ isLoading: true, error: null });

        try {
          const location = await getCurrentLocationSafe(options);
          set({
            location,
            isLoading: false,
            permissionStatus: location ? 'granted' : get().permissionStatus,
            lastUpdatedAt: location ? new Date().toISOString() : get().lastUpdatedAt,
          });
          return location;
        } catch {
          set({ isLoading: false });
          return null;
        }
      },

      requestPermission: async () => {
        const status = await requestLocationPermission();
        set({ permissionStatus: status });
        return status;
      },

      checkPermission: async () => {
        const status = await checkLocationPermission();
        set({ permissionStatus: status });
        return status;
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    { name: 'location-store' }
  )
);

/**
 * 位置情報カスタムフック
 * コンポーネントで使用するための便利なインターフェース
 */
export function useLocation(options?: LocationOptions) {
  const opts = { ...DEFAULT_LOCATION_OPTIONS, ...options };

  // ストアから状態とアクションを取得
  const location = useLocationStore((s) => s.location);
  const isLoading = useLocationStore((s) => s.isLoading);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const error = useLocationStore((s) => s.error);
  const lastUpdatedAt = useLocationStore((s) => s.lastUpdatedAt);
  const fetchLocation = useLocationStore((s) => s.fetchLocation);
  const fetchLocationSafe = useLocationStore((s) => s.fetchLocationSafe);
  const requestPermission = useLocationStore((s) => s.requestPermission);
  const checkPermission = useLocationStore((s) => s.checkPermission);
  const clearError = useLocationStore((s) => s.clearError);

  // 取得中フラグ（重複リクエスト防止）
  const isFetchingRef = useRef(false);

  /**
   * 位置情報を取得（オプション付き）
   */
  const getLocation = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log('[useLocation] Already fetching, skipping...');
      return location;
    }

    isFetchingRef.current = true;
    try {
      return await fetchLocation(opts);
    } finally {
      isFetchingRef.current = false;
    }
  }, [fetchLocation, opts, location]);

  /**
   * 位置情報を安全に取得（エラー時null）
   */
  const getLocationSafe = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log('[useLocation] Already fetching, returning current...');
      return location;
    }

    isFetchingRef.current = true;
    try {
      return await fetchLocationSafe(opts);
    } finally {
      isFetchingRef.current = false;
    }
  }, [fetchLocationSafe, opts, location]);

  /**
   * 位置情報をWebSocket送信用メタデータに変換
   */
  const toMetadata = useCallback(
    (sessionId?: string): InitialMetadata => {
      const now = new Date().toISOString();

      if (!location) {
        return {
          type: 'metadata',
          timestamp: now,
          payload: {
            location: null,
            sessionId,
          },
        };
      }

      return {
        type: 'metadata',
        timestamp: now,
        payload: {
          location: {
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
          },
          sessionId,
        },
      };
    },
    [location]
  );

  return {
    // 状態
    location,
    isLoading,
    permissionStatus,
    error,
    lastUpdatedAt,

    // 派生状態
    hasLocation: location !== null,
    isPermissionGranted: permissionStatus === 'granted',
    isPermissionDenied: permissionStatus === 'denied',

    // アクション
    getLocation,
    getLocationSafe,
    requestPermission,
    checkPermission,
    clearError,
    toMetadata,
  };
}

/**
 * セレクター
 */
export const selectLocation = (state: LocationState) => state.location;
export const selectIsLoading = (state: LocationState) => state.isLoading;
export const selectPermissionStatus = (state: LocationState) => state.permissionStatus;
export const selectError = (state: LocationState) => state.error;
