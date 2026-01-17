import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import type { Vitals, VitalRecord } from '../types/realData';
import { getActivePersona } from '@/mocks/data/persona';

// react-native-health の型は src/types/react-native-health.d.ts で宣言

/**
 * 睡眠ステージ型
 */
interface SleepStages {
  awake: number;
  light: number;
  deep: number;
  rem: number;
}

/**
 * HealthKit 権限タイプ
 */
export const HEALTHKIT_PERMISSIONS = {
  read: ['ActiveEnergyBurned', 'HeartRate', 'SleepAnalysis', 'Steps'] as const,
  write: [] as const,
};

/**
 * Expo Go で実行中かどうかを判定
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * HealthKit が利用可能かどうかを判定
 */
function isHealthKitAvailable(): boolean {
  return Platform.OS === 'ios' && !isExpoGo();
}

/**
 * モック Vitals データを生成
 */
function generateMockVitals(): Vitals {
  const persona = getActivePersona();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 心拍数レコード生成
  const heartRateRecords: VitalRecord[] = [];
  for (let i = 0; i < 12; i++) {
    const timestamp = new Date(yesterday.getTime() + i * 2 * 60 * 60 * 1000);
    heartRateRecords.push({
      timestamp: timestamp.toISOString(),
      value: persona.healthProfile.averageHeartRate + Math.floor(Math.random() * 20 - 10),
      unit: 'bpm',
      sourceName: 'Mock Apple Watch',
    });
  }

  const avgHR = heartRateRecords.reduce((sum, r) => sum + r.value, 0) / heartRateRecords.length;

  // 歩数レコード生成
  const stepsRecords: VitalRecord[] = [];
  let totalSteps = 0;
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(yesterday.getTime() + i * 60 * 60 * 1000);
    const hourlySteps = Math.floor(Math.random() * 800 + 100);
    totalSteps += hourlySteps;
    stepsRecords.push({
      timestamp: timestamp.toISOString(),
      value: hourlySteps,
      unit: 'count',
      sourceName: 'Mock iPhone',
    });
  }

  // 消費カロリー
  const activeEnergyRecords: VitalRecord[] = [];
  let totalCalories = 0;
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(yesterday.getTime() + i * 60 * 60 * 1000);
    const hourlyCal = Math.floor(Math.random() * 50 + 20);
    totalCalories += hourlyCal;
    activeEnergyRecords.push({
      timestamp: timestamp.toISOString(),
      value: hourlyCal,
      unit: 'kcal',
      sourceName: 'Mock Apple Watch',
    });
  }

  // 睡眠データ
  const sleepHours = persona.healthProfile.averageSleepHours;
  const sleepMinutes = Math.round(sleepHours * 60);
  const sleepQuality =
    persona.healthProfile.sleepQuality >= 80
      ? 'excellent'
      : persona.healthProfile.sleepQuality >= 60
        ? 'good'
        : persona.healthProfile.sleepQuality >= 40
          ? 'fair'
          : 'poor';

  // サマリー生成
  const overallCondition =
    avgHR < 70 && totalSteps > 8000
      ? 'excellent'
      : avgHR < 80 && totalSteps > 5000
        ? 'good'
        : avgHR < 90 && totalSteps > 3000
          ? 'fair'
          : 'poor';

  const activityLevel =
    totalSteps >= 12000
      ? 'very_active'
      : totalSteps >= 10000
        ? 'active'
        : totalSteps >= 7000
          ? 'moderate'
          : totalSteps >= 4000
            ? 'light'
            : 'sedentary';

  const restedness =
    sleepMinutes >= 480
      ? 'well_rested'
      : sleepMinutes >= 360
        ? 'normal'
        : sleepMinutes >= 240
          ? 'tired'
          : 'exhausted';

  // レコメンデーション生成
  let recommendation = '';
  if (restedness === 'tired' || restedness === 'exhausted') {
    recommendation = 'お疲れのようです。休憩できるカフェや静かな公園がおすすめです。';
  } else if (activityLevel === 'sedentary' || activityLevel === 'light') {
    recommendation =
      '少し体を動かしてみませんか？散歩できる公園や景色の良いドライブコースがあります。';
  } else {
    recommendation = '良いコンディションです。アクティブな目的地も楽しめそうです。';
  }

  return {
    collectedAt: now.toISOString(),
    source: 'mock',
    heartRate: {
      records: heartRateRecords,
      average: Math.round(avgHR),
      min: Math.min(...heartRateRecords.map((r) => r.value)),
      max: Math.max(...heartRateRecords.map((r) => r.value)),
    },
    steps: {
      total: totalSteps,
      records: stepsRecords,
    },
    activeEnergy: {
      total: totalCalories,
      unit: 'kcal',
      records: activeEnergyRecords,
    },
    sleep: {
      totalMinutes: sleepMinutes,
      quality: sleepQuality,
      stages: {
        awake: Math.round(sleepMinutes * 0.05),
        light: Math.round(sleepMinutes * 0.5),
        deep: Math.round(sleepMinutes * 0.25),
        rem: Math.round(sleepMinutes * 0.2),
      },
    },
    summary: {
      overallCondition,
      activityLevel,
      restedness,
      recommendation,
    },
  };
}

/**
 * HealthKit からリアルデータを取得
 * 注意: このコードは実機ビルド時のみ動作します
 */
async function fetchRealHealthData(): Promise<Vitals> {
  // react-native-health は動的インポートで読み込み
  // Expo Go では存在しないため try-catch で囲む
  try {
    const AppleHealthKit = await import('react-native-health');
    const Health = AppleHealthKit.default;

    return new Promise((resolve, reject) => {
      // 権限リクエスト
      const permissionKeys = ['ActiveEnergyBurned', 'HeartRate', 'SleepAnalysis', 'Steps'] as const;

      const readPermissions = permissionKeys
        .map((key) => Health.Constants.Permissions[key])
        .filter((p): p is string => typeof p === 'string');

      const permissions = {
        permissions: {
          read: readPermissions,
          write: [] as string[],
        },
      };

      Health.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.warn('[HealthKit] Authorization failed:', error);
          reject(new Error(error));
          return;
        }

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const options = {
          startDate: yesterday.toISOString(),
          endDate: now.toISOString(),
        };

        // 並列でデータ取得
        Promise.all([
          // 心拍数
          new Promise<VitalRecord[]>((res) => {
            Health.getHeartRateSamples(
              options,
              (
                err: string,
                results: Array<{ value: number; startDate: string; sourceName: string }>
              ) => {
                if (err) {
                  console.warn('[HealthKit] HeartRate error:', err);
                  res([]);
                  return;
                }
                res(
                  results.map((r) => ({
                    timestamp: r.startDate,
                    value: r.value,
                    unit: 'bpm',
                    sourceName: r.sourceName,
                  }))
                );
              }
            );
          }),
          // 歩数
          new Promise<number>((res) => {
            Health.getStepCount(options, (err: string, results: { value: number }) => {
              if (err) {
                console.warn('[HealthKit] Steps error:', err);
                res(0);
                return;
              }
              res(results?.value ?? 0);
            });
          }),
          // 消費カロリー
          new Promise<VitalRecord[]>((res) => {
            Health.getActiveEnergyBurned(
              options,
              (
                err: string,
                results: Array<{ value: number; startDate: string; sourceName: string }>
              ) => {
                if (err) {
                  console.warn('[HealthKit] ActiveEnergy error:', err);
                  res([]);
                  return;
                }
                res(
                  results.map((r) => ({
                    timestamp: r.startDate,
                    value: r.value,
                    unit: 'kcal',
                    sourceName: r.sourceName,
                  }))
                );
              }
            );
          }),
          // 睡眠
          new Promise<{ totalMinutes: number; stages: SleepStages }>((res) => {
            Health.getSleepSamples(
              options,
              (
                err: string,
                results: Array<{ value: string; startDate: string; endDate: string }>
              ) => {
                if (err || !results) {
                  console.warn('[HealthKit] Sleep error:', err);
                  res({ totalMinutes: 0, stages: { awake: 0, light: 0, deep: 0, rem: 0 } });
                  return;
                }
                let totalMinutes = 0;
                const stages: SleepStages = { awake: 0, light: 0, deep: 0, rem: 0 };
                results.forEach((r) => {
                  const start = new Date(r.startDate);
                  const end = new Date(r.endDate);
                  const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
                  totalMinutes += minutes;
                  // 睡眠ステージの簡易マッピング
                  if (r.value === 'ASLEEP') {
                    stages.light += minutes * 0.5;
                    stages.deep += minutes * 0.3;
                    stages.rem += minutes * 0.2;
                  } else if (r.value === 'AWAKE') {
                    stages.awake += minutes;
                  }
                });
                res({ totalMinutes: Math.round(totalMinutes), stages });
              }
            );
          }),
        ]).then(([heartRateRecords, totalSteps, activeEnergyRecords, sleepData]) => {
          const avgHR =
            heartRateRecords.length > 0
              ? heartRateRecords.reduce((sum, r) => sum + r.value, 0) / heartRateRecords.length
              : 70;

          const totalCalories = activeEnergyRecords.reduce((sum, r) => sum + r.value, 0);

          // サマリー計算
          const overallCondition =
            avgHR < 70 && totalSteps > 8000
              ? 'excellent'
              : avgHR < 80 && totalSteps > 5000
                ? 'good'
                : avgHR < 90 && totalSteps > 3000
                  ? 'fair'
                  : 'poor';

          const activityLevel =
            totalSteps >= 12000
              ? 'very_active'
              : totalSteps >= 10000
                ? 'active'
                : totalSteps >= 7000
                  ? 'moderate'
                  : totalSteps >= 4000
                    ? 'light'
                    : 'sedentary';

          const sleepQuality: 'excellent' | 'good' | 'fair' | 'poor' =
            sleepData.totalMinutes >= 480
              ? 'excellent'
              : sleepData.totalMinutes >= 360
                ? 'good'
                : sleepData.totalMinutes >= 240
                  ? 'fair'
                  : 'poor';

          const restedness =
            sleepData.totalMinutes >= 480
              ? 'well_rested'
              : sleepData.totalMinutes >= 360
                ? 'normal'
                : sleepData.totalMinutes >= 240
                  ? 'tired'
                  : 'exhausted';

          let recommendation = '';
          if (restedness === 'tired' || restedness === 'exhausted') {
            recommendation = 'お疲れのようです。休憩できるカフェや静かな公園がおすすめです。';
          } else if (activityLevel === 'sedentary' || activityLevel === 'light') {
            recommendation = '少し体を動かしてみませんか？散歩できる公園がおすすめです。';
          } else {
            recommendation = '良いコンディションです。アクティブな目的地も楽しめそうです。';
          }

          resolve({
            collectedAt: now.toISOString(),
            source: 'healthkit',
            heartRate: {
              records: heartRateRecords,
              average: Math.round(avgHR),
              min:
                heartRateRecords.length > 0 ? Math.min(...heartRateRecords.map((r) => r.value)) : 0,
              max:
                heartRateRecords.length > 0 ? Math.max(...heartRateRecords.map((r) => r.value)) : 0,
            },
            steps: {
              total: totalSteps,
              records: [],
            },
            activeEnergy: {
              total: Math.round(totalCalories),
              unit: 'kcal',
              records: activeEnergyRecords,
            },
            sleep: {
              totalMinutes: sleepData.totalMinutes,
              quality: sleepQuality,
              stages: {
                awake: Math.round(sleepData.stages.awake),
                light: Math.round(sleepData.stages.light),
                deep: Math.round(sleepData.stages.deep),
                rem: Math.round(sleepData.stages.rem),
              },
            },
            summary: {
              overallCondition,
              activityLevel,
              restedness,
              recommendation,
            },
          });
        });
      });
    });
  } catch (error) {
    console.warn('[HealthKit] Module not available, using mock data');
    throw error;
  }
}

/**
 * HealthKit データ取得フック
 */
export function useHealthData() {
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    setIsAvailable(isHealthKitAvailable());
  }, []);

  const fetchData = useCallback(async (useMockFallback: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isHealthKitAvailable()) {
        const data = await fetchRealHealthData();
        setVitals(data);
        setIsAuthorized(true);
      } else {
        // Expo Go または Android の場合はモックデータを使用
        console.log('[HealthData] Using mock data (HealthKit not available)');
        const mockData = generateMockVitals();
        setVitals(mockData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'HealthKit データの取得に失敗しました';
      setError(errorMessage);

      if (useMockFallback) {
        console.log('[HealthData] Falling back to mock data');
        const mockData = generateMockVitals();
        setVitals(mockData);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestAuthorization = useCallback(async () => {
    if (!isHealthKitAvailable()) {
      setError('HealthKit is not available on this device');
      return false;
    }

    try {
      await fetchRealHealthData();
      setIsAuthorized(true);
      return true;
    } catch {
      setIsAuthorized(false);
      return false;
    }
  }, []);

  return {
    vitals,
    isLoading,
    error,
    isAvailable,
    isAuthorized,
    fetchData,
    requestAuthorization,
    isUsingMock: !isHealthKitAvailable(),
  };
}
