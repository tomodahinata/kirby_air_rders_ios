// Health types
export {
  heartRateRecordSchema,
  stressLevelRecordSchema,
  fatigueRecordSchema,
  sleepRecordSchema,
  stepCountRecordSchema,
  healthDataSchema,
  healthSummarySchema,
  type HeartRateRecord,
  type StressLevelRecord,
  type FatigueRecord,
  type SleepRecord,
  type StepCountRecord,
  type HealthData,
  type HealthSummary,
} from './health';

// Behavior types
export {
  searchCategorySchema,
  searchHistoryRecordSchema,
  purchaseCategorySchema,
  purchaseHistoryRecordSchema,
  calendarEventTypeSchema,
  calendarEventSchema,
  behaviorDataSchema,
  behaviorSummarySchema,
  type SearchCategory,
  type SearchHistoryRecord,
  type PurchaseCategory,
  type PurchaseHistoryRecord,
  type CalendarEventType,
  type CalendarEvent,
  type BehaviorData,
  type BehaviorSummary,
} from './behavior';

// Context types
export {
  timeContextSchema,
  locationContextSchema,
  weatherContextSchema,
  userProfileSchema,
  structuredContextSchema,
  extractionStatusSchema,
  extractionProgressSchema,
  type TimeContext,
  type LocationContext,
  type WeatherContext,
  type UserProfile,
  type StructuredContext,
  type ExtractionStatus,
  type ExtractionProgress,
} from './context';

// Real Data types (for native integration)
export {
  vitalRecordSchema,
  vitalsSchema,
  upcomingEventSchema,
  upcomingEventsSchema,
  urlIntentSchema,
  dataSourceStatusSchema,
  dataSourceSettingsSchema,
  type VitalRecord,
  type Vitals,
  type UpcomingEvent,
  type UpcomingEvents,
  type UrlIntent,
  type DataSourceStatus,
  type DataSourceSettings,
} from './realData';
