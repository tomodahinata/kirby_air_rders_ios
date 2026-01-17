import { z } from 'zod';

/**
 * 検索カテゴリスキーマ
 */
export const searchCategorySchema = z.enum([
  'restaurant',
  'cafe',
  'shopping',
  'travel',
  'entertainment',
  'outdoor',
  'sports',
  'culture',
  'technology',
  'health',
  'other',
]);

export type SearchCategory = z.infer<typeof searchCategorySchema>;

/**
 * 検索履歴レコードスキーマ
 */
export const searchHistoryRecordSchema = z.object({
  id: z.string().uuid(),
  query: z.string().min(1),
  category: searchCategorySchema,
  timestamp: z.string().datetime(),
  source: z.enum(['google', 'safari', 'maps', 'app', 'other']),
  clickedResults: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url().optional(),
      })
    )
    .optional(),
});

export type SearchHistoryRecord = z.infer<typeof searchHistoryRecordSchema>;

/**
 * 購買カテゴリスキーマ
 */
export const purchaseCategorySchema = z.enum([
  'electronics',
  'fashion',
  'food',
  'outdoor',
  'sports',
  'home',
  'books',
  'entertainment',
  'travel',
  'health',
  'automotive',
  'other',
]);

export type PurchaseCategory = z.infer<typeof purchaseCategorySchema>;

/**
 * 購買履歴レコードスキーマ
 */
export const purchaseHistoryRecordSchema = z.object({
  id: z.string().uuid(),
  itemName: z.string().min(1),
  category: purchaseCategorySchema,
  price: z.number().min(0),
  currency: z.string().length(3).default('JPY'),
  timestamp: z.string().datetime(),
  store: z.string(),
  platform: z.enum(['amazon', 'rakuten', 'yahoo', 'physical', 'other']),
  tags: z.array(z.string()).optional(),
});

export type PurchaseHistoryRecord = z.infer<typeof purchaseHistoryRecordSchema>;

/**
 * カレンダーイベントタイプスキーマ
 */
export const calendarEventTypeSchema = z.enum([
  'meeting',
  'appointment',
  'travel',
  'personal',
  'work',
  'reminder',
  'holiday',
  'other',
]);

export type CalendarEventType = z.infer<typeof calendarEventTypeSchema>;

/**
 * カレンダーイベントスキーマ
 */
export const calendarEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  type: calendarEventTypeSchema,
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  isAllDay: z.boolean().default(false),
  attendees: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

/**
 * 統合行動データスキーマ
 */
export const behaviorDataSchema = z.object({
  userId: z.string().uuid(),
  collectedAt: z.string().datetime(),
  searchHistory: z.array(searchHistoryRecordSchema),
  purchaseHistory: z.array(purchaseHistoryRecordSchema),
  calendarEvents: z.array(calendarEventSchema),
  insights: z.object({
    topSearchCategories: z.array(searchCategorySchema).max(5),
    topPurchaseCategories: z.array(purchaseCategorySchema).max(5),
    recentInterests: z.array(z.string()),
    upcomingEventTypes: z.array(calendarEventTypeSchema),
  }),
});

export type BehaviorData = z.infer<typeof behaviorDataSchema>;

/**
 * 行動サマリー（LLM向け簡略版）
 */
export const behaviorSummarySchema = z.object({
  primaryInterests: z.array(z.string()).max(5),
  recentSearchTheme: z.string(),
  purchaseTrend: z.string(),
  upcomingPlans: z.array(z.string()).max(3),
  lifestyleHint: z.string(),
});

export type BehaviorSummary = z.infer<typeof behaviorSummarySchema>;
