import { useState, useCallback, useMemo } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { DataSourceSettings, DataSourceStatus } from '../types/realData';
import { useHealthData } from './useHealthData';
import { useCalendarEvents } from './useCalendarEvents';

/**
 * 実行環境を判定
 */
export function getExecutionEnvironment(): 'expo-go' | 'dev-client' | 'standalone' {
  if (Constants.appOwnership === 'expo') {
    return 'expo-go';
  }
  if (__DEV__) {
    return 'dev-client';
  }
  return 'standalone';
}

/**
 * ネイティブモジュールが利用可能かどうかを判定
 */
export function isNativeModuleAvailable(): boolean {
  const env = getExecutionEnvironment();
  return env !== 'expo-go' && Platform.OS === 'ios';
}

/**
 * デフォルト設定
 */
const DEFAULT_SETTINGS: DataSourceSettings = {
  useHealthKit: true,
  useCalendar: true,
  useClipboard: true,
  useMockFallback: true,
};

/**
 * 統合データプロバイダーフック
 * すべてのデータソースを一元管理し、DI パターンを実現
 */
export function useDataProvider(initialSettings?: Partial<DataSourceSettings>) {
  const [settings, setSettings] = useState<DataSourceSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  // 各データソースフック
  const healthData = useHealthData();
  const calendarData = useCalendarEvents();

  // データソース状態を計算
  const dataSourceStatus: DataSourceStatus = useMemo(
    () => ({
      healthKit: {
        available: healthData.isAvailable,
        authorized: healthData.isAuthorized,
        lastSync: healthData.vitals?.collectedAt,
        error: healthData.error ?? undefined,
      },
      calendar: {
        available: calendarData.isAvailable,
        authorized: calendarData.isAuthorized,
        lastSync: calendarData.events?.collectedAt,
        error: calendarData.error ?? undefined,
      },
      clipboard: {
        enabled: settings.useClipboard,
        lastDetectedUrl: undefined, // クリップボード検知は別途実装
      },
    }),
    [
      healthData.isAvailable,
      healthData.isAuthorized,
      healthData.vitals?.collectedAt,
      healthData.error,
      calendarData.isAvailable,
      calendarData.isAuthorized,
      calendarData.events?.collectedAt,
      calendarData.error,
      settings.useClipboard,
    ]
  );

  // 設定更新
  const updateSettings = useCallback((newSettings: Partial<DataSourceSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // 全データを取得
  const fetchAllData = useCallback(async () => {
    const promises: Promise<void>[] = [];

    if (settings.useHealthKit) {
      promises.push(healthData.fetchData(settings.useMockFallback));
    }

    if (settings.useCalendar) {
      promises.push(calendarData.fetchData(settings.useMockFallback));
    }

    await Promise.allSettled(promises);
  }, [settings, healthData, calendarData]);

  // すべての権限をリクエスト
  const requestAllPermissions = useCallback(async () => {
    const results: Record<string, boolean> = {};

    if (settings.useHealthKit && healthData.isAvailable) {
      results.healthKit = await healthData.requestAuthorization();
    }

    if (settings.useCalendar) {
      results.calendar = await calendarData.requestAuthorization();
    }

    return results;
  }, [settings, healthData, calendarData]);

  // 実行環境情報
  const environment = useMemo(
    () => ({
      type: getExecutionEnvironment(),
      isNativeAvailable: isNativeModuleAvailable(),
      platform: Platform.OS,
    }),
    []
  );

  // 統合データ
  const aggregatedData = useMemo(
    () => ({
      vitals: healthData.vitals,
      upcomingEvents: calendarData.events,
      isAnyLoading: healthData.isLoading || calendarData.isLoading,
      hasAnyError: !!(healthData.error || calendarData.error),
      isUsingMockData: healthData.isUsingMock || calendarData.isUsingMock,
    }),
    [
      healthData.vitals,
      healthData.isLoading,
      healthData.error,
      healthData.isUsingMock,
      calendarData.events,
      calendarData.isLoading,
      calendarData.error,
      calendarData.isUsingMock,
    ]
  );

  return {
    // 設定
    settings,
    updateSettings,

    // データソース状態
    dataSourceStatus,

    // 個別データソース
    healthData: {
      vitals: healthData.vitals,
      isLoading: healthData.isLoading,
      error: healthData.error,
      isAvailable: healthData.isAvailable,
      isAuthorized: healthData.isAuthorized,
      isUsingMock: healthData.isUsingMock,
      fetch: () => healthData.fetchData(settings.useMockFallback),
      requestPermission: healthData.requestAuthorization,
    },
    calendarData: {
      events: calendarData.events,
      isLoading: calendarData.isLoading,
      error: calendarData.error,
      isAvailable: calendarData.isAvailable,
      isAuthorized: calendarData.isAuthorized,
      isUsingMock: calendarData.isUsingMock,
      fetch: () => calendarData.fetchData(settings.useMockFallback),
      requestPermission: calendarData.requestAuthorization,
    },

    // 統合操作
    aggregatedData,
    fetchAllData,
    requestAllPermissions,

    // 環境情報
    environment,
  };
}

/**
 * データプロバイダーの戻り値の型
 */
export type DataProviderResult = ReturnType<typeof useDataProvider>;
