import { z } from 'zod';

import { healthSummarySchema } from './health';
import { behaviorSummarySchema } from './behavior';
import { manualJournalEntrySchema } from '@/shared/types/schema';

/**
 * 時間帯コンテキストスキーマ
 */
export const timeContextSchema = z.object({
  currentTime: z.string().datetime(),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']),
  isWeekend: z.boolean(),
  isHoliday: z.boolean(),
});

export type TimeContext = z.infer<typeof timeContextSchema>;

/**
 * 位置コンテキストスキーマ
 */
export const locationContextSchema = z.object({
  currentLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  homeLocation: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      address: z.string().optional(),
    })
    .optional(),
  workLocation: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      address: z.string().optional(),
    })
    .optional(),
  distanceFromHome: z.number().min(0).optional(),
  distanceFromWork: z.number().min(0).optional(),
});

export type LocationContext = z.infer<typeof locationContextSchema>;

/**
 * 天気コンテキストスキーマ
 */
export const weatherContextSchema = z.object({
  condition: z.enum(['sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'foggy']),
  temperature: z.number().min(-50).max(60),
  humidity: z.number().min(0).max(100),
  recommendation: z.string().optional(),
});

export type WeatherContext = z.infer<typeof weatherContextSchema>;

/**
 * ユーザープロファイルスキーマ（LLM向け）
 */
export const userProfileSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  age: z.number().int().min(0).max(150),
  gender: z.enum(['male', 'female', 'other', 'unspecified']),
  occupation: z.string().optional(),
  hobbies: z.array(z.string()),
  preferences: z.object({
    favoriteCategories: z.array(z.string()),
    avoidCategories: z.array(z.string()),
    budgetRange: z.enum(['low', 'medium', 'high', 'luxury']),
    travelStyle: z.enum(['relaxed', 'active', 'adventurous', 'cultural']),
  }),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/**
 * LLM向け構造化コンテキストデータスキーマ
 * これがcarに送信される最終形態
 */
export const structuredContextSchema = z.object({
  version: z.string().default('1.0.0'),
  generatedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),

  // ユーザー情報
  user: userProfileSchema,

  // コンテキスト情報
  context: z.object({
    time: timeContextSchema,
    location: locationContextSchema,
    weather: weatherContextSchema.optional(),
  }),

  // 抽出データサマリー
  extraction: z.object({
    health: healthSummarySchema,
    behavior: behaviorSummarySchema,
  }),

  // ユーザーのジャーナルエントリー（お気に入りスポット）
  journalEntries: z.array(manualJournalEntrySchema).optional(),

  // LLMへのヒント
  llmHints: z.object({
    suggestedCategories: z.array(z.string()).max(5),
    avoidSuggestions: z.array(z.string()).max(3),
    priorityFactors: z.array(z.string()).max(3),
    specialConsiderations: z.array(z.string()),
  }),

  // メタデータ
  metadata: z.object({
    dataQuality: z.enum(['high', 'medium', 'low']),
    dataSources: z.array(z.string()),
    processingTimeMs: z.number().min(0),
  }),
});

export type StructuredContext = z.infer<typeof structuredContextSchema>;

/**
 * 抽出状態スキーマ
 */
export const extractionStatusSchema = z.enum([
  'idle',
  'collecting_health',
  'collecting_behavior',
  'aggregating',
  'complete',
  'error',
]);

export type ExtractionStatus = z.infer<typeof extractionStatusSchema>;

/**
 * 抽出進捗スキーマ
 */
export const extractionProgressSchema = z.object({
  status: extractionStatusSchema,
  progress: z.number().min(0).max(100),
  currentStep: z.string(),
  completedSteps: z.array(z.string()),
  errorMessage: z.string().optional(),
});

export type ExtractionProgress = z.infer<typeof extractionProgressSchema>;
