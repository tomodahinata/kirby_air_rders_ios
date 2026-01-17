/**
 * react-native-health 型宣言
 * 実機ビルド時のみ利用可能なネイティブモジュール
 */
declare module 'react-native-health' {
  interface HealthPermissions {
    permissions: {
      read: string[];
      write: string[];
    };
  }

  interface HealthKitStatic {
    Constants: {
      Permissions: Record<string, string>;
    };
    initHealthKit: (permissions: HealthPermissions, callback: (error: string) => void) => void;
    getHeartRateSamples: (
      options: { startDate: string; endDate: string },
      callback: (
        error: string,
        results: Array<{ value: number; startDate: string; sourceName: string }>
      ) => void
    ) => void;
    getStepCount: (
      options: { startDate: string; endDate: string },
      callback: (error: string, results: { value: number }) => void
    ) => void;
    getActiveEnergyBurned: (
      options: { startDate: string; endDate: string },
      callback: (
        error: string,
        results: Array<{ value: number; startDate: string; sourceName: string }>
      ) => void
    ) => void;
    getSleepSamples: (
      options: { startDate: string; endDate: string },
      callback: (
        error: string,
        results: Array<{ value: string; startDate: string; endDate: string }>
      ) => void
    ) => void;
  }

  const AppleHealthKit: HealthKitStatic;
  export default AppleHealthKit;
}
