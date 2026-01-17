import { z } from 'zod';

/**
 * HealthKit Vitals スキーマ
 * 実機から取得するヘルスケアデータ
 */
export const vitalRecordSchema = z.object({
  timestamp: z.string().datetime(),
  value: z.number(),
  unit: z.string(),
  sourceName: z.string().optional(),
});

export type VitalRecord = z.infer<typeof vitalRecordSchema>;

export const vitalsSchema = z.object({
  collectedAt: z.string().datetime(),
  source: z.enum(['healthkit', 'mock']),

  // 心拍数
  heartRate: z.object({
    records: z.array(vitalRecordSchema),
    average: z.number().min(0).max(250),
    min: z.number().min(0).max(250),
    max: z.number().min(0).max(250),
  }),

  // 歩数
  steps: z.object({
    total: z.number().int().min(0),
    records: z.array(vitalRecordSchema),
  }),

  // 消費カロリー
  activeEnergy: z.object({
    total: z.number().min(0),
    unit: z.literal('kcal'),
    records: z.array(vitalRecordSchema),
  }),

  // 睡眠
  sleep: z.object({
    totalMinutes: z.number().min(0),
    quality: z.enum(['poor', 'fair', 'good', 'excellent']),
    stages: z
      .object({
        awake: z.number().min(0),
        light: z.number().min(0),
        deep: z.number().min(0),
        rem: z.number().min(0),
      })
      .optional(),
  }),

  // サマリー（LLM向け）
  summary: z.object({
    overallCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
    activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    restedness: z.enum(['well_rested', 'normal', 'tired', 'exhausted']),
    recommendation: z.string(),
  }),
});

export type Vitals = z.infer<typeof vitalsSchema>;

/**
 * カレンダーイベントスキーマ
 * expo-calendarから取得
 */
export const upcomingEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().optional(),
  notes: z.string().optional(),
  isAllDay: z.boolean(),
  calendarName: z.string().optional(),
});

export type UpcomingEvent = z.infer<typeof upcomingEventSchema>;

export const upcomingEventsSchema = z.object({
  collectedAt: z.string().datetime(),
  source: z.enum(['calendar', 'mock']),
  events: z.array(upcomingEventSchema),
  summary: z.object({
    totalEvents: z.number().int().min(0),
    busyDays: z.array(z.string()),
    nextEvent: upcomingEventSchema.optional(),
    hasTravel: z.boolean(),
    travelDestinations: z.array(z.string()),
  }),
});

export type UpcomingEvents = z.infer<typeof upcomingEventsSchema>;

/**
 * URL Intent スキーマ
 * クリップボードから検出されたURL情報
 */
export const urlIntentSchema = z.object({
  url: z.string().url(),
  detectedAt: z.string().datetime(),
  domain: z.string(),
  type: z.enum(['maps', 'restaurant', 'hotel', 'shopping', 'event', 'other']),
  extractedData: z
    .object({
      placeName: z.string().optional(),
      address: z.string().optional(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
    })
    .optional(),
});

export type UrlIntent = z.infer<typeof urlIntentSchema>;

/**
 * データソース接続状態
 */
export const dataSourceStatusSchema = z.object({
  healthKit: z.object({
    available: z.boolean(),
    authorized: z.boolean(),
    lastSync: z.string().datetime().optional(),
    error: z.string().optional(),
  }),
  calendar: z.object({
    available: z.boolean(),
    authorized: z.boolean(),
    lastSync: z.string().datetime().optional(),
    error: z.string().optional(),
  }),
  clipboard: z.object({
    enabled: z.boolean(),
    lastDetectedUrl: z.string().url().optional(),
  }),
});

export type DataSourceStatus = z.infer<typeof dataSourceStatusSchema>;

/**
 * データソース設定
 */
export const dataSourceSettingsSchema = z.object({
  useHealthKit: z.boolean().default(true),
  useCalendar: z.boolean().default(true),
  useClipboard: z.boolean().default(true),
  useMockFallback: z.boolean().default(true), // 実データ取得失敗時にモックを使用
});

export type DataSourceSettings = z.infer<typeof dataSourceSettingsSchema>;
