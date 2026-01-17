import { z } from 'zod';

/**
 * 心拍数データスキーマ
 * BPM (Beats Per Minute) での心拍数記録
 */
export const heartRateRecordSchema = z.object({
  timestamp: z.string().datetime(),
  bpm: z.number().int().min(30).max(220),
  source: z.enum(['watch', 'phone', 'manual']),
});

export type HeartRateRecord = z.infer<typeof heartRateRecordSchema>;

/**
 * ストレスレベルスキーマ
 * 0-100のスケールでストレス度を表現
 */
export const stressLevelRecordSchema = z.object({
  timestamp: z.string().datetime(),
  level: z.number().min(0).max(100),
  factors: z.array(z.string()).optional(),
});

export type StressLevelRecord = z.infer<typeof stressLevelRecordSchema>;

/**
 * 疲労度スキーマ
 * 睡眠品質と活動量から算出
 */
export const fatigueRecordSchema = z.object({
  timestamp: z.string().datetime(),
  level: z.number().min(0).max(100),
  sleepQuality: z.number().min(0).max(100).optional(),
  activityLevel: z.enum(['low', 'moderate', 'high']).optional(),
});

export type FatigueRecord = z.infer<typeof fatigueRecordSchema>;

/**
 * 睡眠データスキーマ
 */
export const sleepRecordSchema = z.object({
  date: z.string().date(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMinutes: z.number().int().min(0).max(1440),
  quality: z.number().min(0).max(100),
  stages: z
    .object({
      deep: z.number().min(0).max(100),
      light: z.number().min(0).max(100),
      rem: z.number().min(0).max(100),
      awake: z.number().min(0).max(100),
    })
    .optional(),
});

export type SleepRecord = z.infer<typeof sleepRecordSchema>;

/**
 * 歩数データスキーマ
 */
export const stepCountRecordSchema = z.object({
  date: z.string().date(),
  steps: z.number().int().min(0),
  distanceMeters: z.number().min(0).optional(),
  caloriesBurned: z.number().min(0).optional(),
});

export type StepCountRecord = z.infer<typeof stepCountRecordSchema>;

/**
 * 統合ヘルスデータスキーマ
 * 複数日分のヘルスケアデータを集約
 */
export const healthDataSchema = z.object({
  userId: z.string().uuid(),
  collectedAt: z.string().datetime(),
  heartRateRecords: z.array(heartRateRecordSchema),
  stressLevelRecords: z.array(stressLevelRecordSchema),
  fatigueRecords: z.array(fatigueRecordSchema),
  sleepRecords: z.array(sleepRecordSchema),
  stepCountRecords: z.array(stepCountRecordSchema),
  summary: z.object({
    averageHeartRate: z.number().min(0).max(220),
    averageStressLevel: z.number().min(0).max(100),
    averageFatigueLevel: z.number().min(0).max(100),
    averageSleepQuality: z.number().min(0).max(100),
    totalStepsLast7Days: z.number().int().min(0),
  }),
});

export type HealthData = z.infer<typeof healthDataSchema>;

/**
 * ヘルス状態サマリー（LLM向け簡略版）
 */
export const healthSummarySchema = z.object({
  currentCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  stressLevel: z.enum(['low', 'moderate', 'high', 'critical']),
  fatigueLevel: z.enum(['rested', 'normal', 'tired', 'exhausted']),
  sleepQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
  recommendation: z.string(),
});

export type HealthSummary = z.infer<typeof healthSummarySchema>;
