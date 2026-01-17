import type { PersonaProfile } from '@/shared/types/persona';
import type { ManualJournalEntry } from '@/shared/types/schema';
import type {
  StructuredContext,
  TimeContext,
  LocationContext,
  WeatherContext,
  UserProfile,
  HealthSummary,
  BehaviorSummary,
} from '../types';
import {
  generateHealthData,
  generateSearchHistory,
  analyzeSearchTrend,
  generatePurchaseHistory,
  analyzePurchaseTrend,
  generateCalendarEvents,
  analyzeUpcomingEvents,
} from '../generators';

/**
 * 現在の時間コンテキストを生成
 */
function generateTimeContext(): TimeContext {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  const dayNames: TimeContext['dayOfWeek'][] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  let timeOfDay: TimeContext['timeOfDay'];
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }

  return {
    currentTime: now.toISOString(),
    dayOfWeek: dayNames[dayOfWeek] ?? 'monday',
    timeOfDay,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    isHoliday: false, // 簡易実装: 祝日判定は省略
  };
}

/**
 * 位置コンテキストを生成
 */
function generateLocationContext(persona: PersonaProfile): LocationContext {
  // 現在位置は自宅付近からの微小な偏差でシミュレート
  const currentLat = persona.location.home.lat + (Math.random() - 0.5) * 0.01;
  const currentLng = persona.location.home.lng + (Math.random() - 0.5) * 0.01;

  // 距離計算（ハーバーシン公式の簡易版）
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // 地球の半径（メートル）
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return {
    currentLocation: {
      lat: currentLat,
      lng: currentLng,
      address: persona.location.home.address,
    },
    homeLocation: {
      lat: persona.location.home.lat,
      lng: persona.location.home.lng,
      address: persona.location.home.address,
    },
    workLocation: {
      lat: persona.location.work.lat,
      lng: persona.location.work.lng,
      address: persona.location.work.address,
    },
    distanceFromHome: calculateDistance(
      currentLat,
      currentLng,
      persona.location.home.lat,
      persona.location.home.lng
    ),
    distanceFromWork: calculateDistance(
      currentLat,
      currentLng,
      persona.location.work.lat,
      persona.location.work.lng
    ),
  };
}

/**
 * 天気コンテキストを生成（モック）
 */
function generateWeatherContext(): WeatherContext {
  const conditions: WeatherContext['condition'][] = ['sunny', 'cloudy', 'sunny', 'sunny', 'cloudy'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)] ?? 'sunny';

  const temperatureBase = new Date().getMonth() >= 4 && new Date().getMonth() <= 9 ? 25 : 10;
  const temperature = temperatureBase + Math.floor(Math.random() * 10) - 5;

  const recommendations: Record<WeatherContext['condition'], string> = {
    sunny: 'ドライブ日和です。オープンカフェや公園がおすすめ',
    cloudy: '過ごしやすい気候です。屋外活動に最適',
    rainy: '室内施設やカフェをおすすめします',
    snowy: '安全運転を心がけ、温かい場所へ',
    stormy: '不要不急の外出は控えめに',
    foggy: '視界不良に注意。近場での活動を推奨',
  };

  return {
    condition,
    temperature,
    humidity: Math.floor(Math.random() * 40) + 40,
    recommendation: recommendations[condition],
  };
}

/**
 * ユーザープロファイルを生成
 */
function generateUserProfile(persona: PersonaProfile): UserProfile {
  return {
    userId: persona.id,
    name: persona.name,
    age: persona.age,
    gender: persona.gender,
    occupation: persona.occupation,
    hobbies: persona.hobbies,
    preferences: {
      favoriteCategories: persona.preferences.favoriteCategories,
      avoidCategories: persona.preferences.avoidCategories,
      budgetRange: persona.preferences.budgetRange,
      travelStyle: persona.preferences.travelStyle,
    },
  };
}

/**
 * ヘルスサマリーを生成
 */
function extractHealthSummary(persona: PersonaProfile): HealthSummary {
  const healthData = generateHealthData(persona, 7);

  const avgStress = healthData.summary.averageStressLevel;
  const avgFatigue = healthData.summary.averageFatigueLevel;
  const avgSleep = healthData.summary.averageSleepQuality;

  // 総合状態を判定
  const overallScore = (100 - avgStress + 100 - avgFatigue + avgSleep) / 3;

  let currentCondition: HealthSummary['currentCondition'];
  if (overallScore >= 75) {
    currentCondition = 'excellent';
  } else if (overallScore >= 55) {
    currentCondition = 'good';
  } else if (overallScore >= 35) {
    currentCondition = 'fair';
  } else {
    currentCondition = 'poor';
  }

  let stressLevel: HealthSummary['stressLevel'];
  if (avgStress < 30) {
    stressLevel = 'low';
  } else if (avgStress < 55) {
    stressLevel = 'moderate';
  } else if (avgStress < 80) {
    stressLevel = 'high';
  } else {
    stressLevel = 'critical';
  }

  let fatigueLevel: HealthSummary['fatigueLevel'];
  if (avgFatigue < 25) {
    fatigueLevel = 'rested';
  } else if (avgFatigue < 50) {
    fatigueLevel = 'normal';
  } else if (avgFatigue < 75) {
    fatigueLevel = 'tired';
  } else {
    fatigueLevel = 'exhausted';
  }

  let sleepQuality: HealthSummary['sleepQuality'];
  if (avgSleep >= 80) {
    sleepQuality = 'excellent';
  } else if (avgSleep >= 60) {
    sleepQuality = 'good';
  } else if (avgSleep >= 40) {
    sleepQuality = 'fair';
  } else {
    sleepQuality = 'poor';
  }

  // レコメンデーション生成
  const recommendations: string[] = [];
  if (stressLevel === 'high' || stressLevel === 'critical') {
    recommendations.push('リラックスできる場所への訪問をおすすめ');
  }
  if (fatigueLevel === 'tired' || fatigueLevel === 'exhausted') {
    recommendations.push('休憩できるカフェや公園を検討');
  }
  if (sleepQuality === 'fair' || sleepQuality === 'poor') {
    recommendations.push('早めの帰宅を推奨');
  }

  return {
    currentCondition,
    stressLevel,
    fatigueLevel,
    sleepQuality,
    recommendation:
      recommendations.length > 0
        ? recommendations.join('。')
        : '良好な状態です。お好みの場所へどうぞ',
  };
}

/**
 * 行動サマリーを生成
 */
function extractBehaviorSummary(persona: PersonaProfile): BehaviorSummary {
  const searchHistory = generateSearchHistory(persona, 14, 5);
  const purchaseHistory = generatePurchaseHistory(persona, 30, 3);
  const calendarEvents = generateCalendarEvents(persona, 7, 14);

  const searchTrend = analyzeSearchTrend(searchHistory);
  const purchaseTrend = analyzePurchaseTrend(purchaseHistory);
  const upcomingEvents = analyzeUpcomingEvents(calendarEvents);

  return {
    primaryInterests: [
      ...searchTrend.topCategories.slice(0, 2),
      ...purchaseTrend.recentInterests.slice(0, 3),
    ].slice(0, 5),
    recentSearchTheme: searchTrend.recentTheme,
    purchaseTrend: purchaseTrend.purchaseTrend,
    upcomingPlans: upcomingEvents.nextMajorEvent
      ? [upcomingEvents.nextMajorEvent, ...upcomingEvents.freeTimeSlots.slice(0, 2)]
      : upcomingEvents.freeTimeSlots.slice(0, 3),
    lifestyleHint: `${persona.lifestyle.workStyle}勤務、${
      persona.lifestyle.activityLevel === 'active' ? '活動的' : '普通'
    }な生活スタイル`,
  };
}

/**
 * LLMヒントを生成
 */
function generateLLMHints(
  persona: PersonaProfile,
  healthSummary: HealthSummary,
  _behaviorSummary: BehaviorSummary
): StructuredContext['llmHints'] {
  const suggestedCategories: string[] = [];
  const avoidSuggestions: string[] = [];
  const priorityFactors: string[] = [];
  const specialConsiderations: string[] = [];

  // 健康状態に基づく提案
  if (healthSummary.stressLevel === 'high' || healthSummary.stressLevel === 'critical') {
    suggestedCategories.push('nature', 'cafe');
    priorityFactors.push('リラクゼーション');
    specialConsiderations.push('ストレス軽減を優先');
  }

  if (healthSummary.fatigueLevel === 'tired' || healthSummary.fatigueLevel === 'exhausted') {
    suggestedCategories.push('cafe', 'rest');
    avoidSuggestions.push('長距離ドライブ');
    specialConsiderations.push('休憩を含む提案を優先');
  }

  // 興味に基づく提案
  persona.interests.forEach((interest) => {
    if (interest.includes('キャンプ') || interest.includes('アウトドア')) {
      suggestedCategories.push('outdoor', 'nature');
    }
    if (interest.includes('カフェ')) {
      suggestedCategories.push('cafe');
    }
    if (interest.includes('ドライブ')) {
      suggestedCategories.push('scenic_route');
    }
  });

  // 時間帯に基づく調整
  const hour = new Date().getHours();
  if (hour >= 11 && hour <= 14) {
    suggestedCategories.push('restaurant');
    priorityFactors.push('ランチタイム');
  }

  // 週末判定
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
  if (isWeekend) {
    priorityFactors.push('週末のレジャー');
    specialConsiderations.push('混雑を避けた穴場スポットを優先');
  }

  return {
    suggestedCategories: [...new Set(suggestedCategories)].slice(0, 5),
    avoidSuggestions: [...avoidSuggestions, ...persona.preferences.avoidCategories].slice(0, 3),
    priorityFactors: priorityFactors.slice(0, 3),
    specialConsiderations,
  };
}

/**
 * 構造化コンテキストを生成（メイン関数）
 * @param persona - ペルソナプロファイル
 * @param journalEntries - ユーザーのジャーナルエントリー（お気に入りスポット）
 */
export async function aggregateContext(
  persona: PersonaProfile,
  journalEntries?: ManualJournalEntry[]
): Promise<StructuredContext> {
  const startTime = performance.now();

  // 各コンテキストを並列で生成
  const [timeContext, locationContext, weatherContext] = await Promise.all([
    Promise.resolve(generateTimeContext()),
    Promise.resolve(generateLocationContext(persona)),
    Promise.resolve(generateWeatherContext()),
  ]);

  // ユーザープロファイル
  const userProfile = generateUserProfile(persona);

  // 抽出データ
  const healthSummary = extractHealthSummary(persona);
  const behaviorSummary = extractBehaviorSummary(persona);

  // LLMヒント
  const llmHints = generateLLMHints(persona, healthSummary, behaviorSummary);

  const processingTimeMs = performance.now() - startTime;

  // 有効期限（30分後）
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  // データソースの決定
  const dataSources = [
    'health_mock',
    'search_history_mock',
    'purchase_history_mock',
    'calendar_mock',
  ];

  if (journalEntries && journalEntries.length > 0) {
    dataSources.push('journal_entries');
  }

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    user: userProfile,
    context: {
      time: timeContext,
      location: locationContext,
      weather: weatherContext,
    },
    extraction: {
      health: healthSummary,
      behavior: behaviorSummary,
    },
    journalEntries: journalEntries && journalEntries.length > 0 ? journalEntries : undefined,
    llmHints,
    metadata: {
      dataQuality: 'high',
      dataSources,
      processingTimeMs: Math.round(processingTimeMs),
    },
  };
}

/**
 * コンテキストをJSON文字列に変換（送信用）
 */
export function serializeContext(context: StructuredContext): string {
  return JSON.stringify(context, null, 2);
}

/**
 * コンテキストのサイズを計算（バイト）
 */
export function calculateContextSize(context: StructuredContext): number {
  return new TextEncoder().encode(JSON.stringify(context)).length;
}
