import type { PersonaProfile } from '@/shared/types/persona';

/**
 * 田中太郎 - メインペルソナ
 *
 * 35歳男性、IT企業勤務
 * - 週末にドライブを楽しむ
 * - 最近キャンプ用品を検索中
 * - 平日は都内勤務、ストレスやや高め
 * - カフェ巡りが趣味
 */
export const tanakaTaroPersona: PersonaProfile = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: '田中太郎',
  age: 35,
  gender: 'male',
  occupation: 'ITエンジニア',
  location: {
    home: {
      address: '東京都世田谷区三軒茶屋1-1-1',
      lat: 35.6436,
      lng: 139.6708,
    },
    work: {
      address: '東京都渋谷区道玄坂1-2-3',
      lat: 35.658,
      lng: 139.7016,
    },
  },
  lifestyle: {
    workStyle: 'hybrid',
    sleepPattern: 'night_owl',
    activityLevel: 'moderate',
    stressLevel: 'high',
  },
  interests: ['アウトドア', 'キャンプ', 'ドライブ', 'カフェ巡り', 'テクノロジー', '写真撮影'],
  hobbies: ['週末ドライブ', 'キャンプ', 'カフェ巡り', 'ガジェット収集'],
  recentActivities: [
    'キャンプ用品の検索',
    'テント購入検討',
    '河口湖周辺の検索',
    '新しいカフェ探し',
    'カメラレンズの比較',
  ],
  preferences: {
    favoriteCategories: ['outdoor', 'cafe', 'nature', 'technology', 'photography'],
    avoidCategories: ['crowded_places', 'formal_dining'],
    budgetRange: 'medium',
    travelStyle: 'adventurous',
    preferredTimeSlots: ['morning', 'afternoon'],
  },
  healthProfile: {
    averageHeartRate: 72,
    averageSleepHours: 6.5,
    sleepQuality: 65,
    stressTendency: 70,
    fatigueTendency: 60,
  },
  behaviorProfile: {
    searchFrequency: 'high',
    purchaseFrequency: 'medium',
    planningStyle: 'casual',
    socialActivity: 'ambivert',
  },
};

/**
 * 現在のアクティブペルソナを取得
 */
export function getActivePersona(): PersonaProfile {
  return tanakaTaroPersona;
}

/**
 * ペルソナに基づく現在の状態を生成
 */
export function getPersonaCurrentState(persona: PersonaProfile): {
  mood: 'relaxed' | 'normal' | 'stressed' | 'exhausted';
  energy: 'high' | 'medium' | 'low';
  socialNeed: 'alone' | 'small_group' | 'social';
} {
  const { stressTendency, fatigueTendency } = persona.healthProfile;

  let mood: 'relaxed' | 'normal' | 'stressed' | 'exhausted' = 'normal';
  if (stressTendency > 80) {
    mood = 'exhausted';
  } else if (stressTendency > 60) {
    mood = 'stressed';
  } else if (stressTendency < 30) {
    mood = 'relaxed';
  }

  let energy: 'high' | 'medium' | 'low' = 'medium';
  if (fatigueTendency > 70) {
    energy = 'low';
  } else if (fatigueTendency < 30) {
    energy = 'high';
  }

  let socialNeed: 'alone' | 'small_group' | 'social' = 'small_group';
  if (persona.behaviorProfile.socialActivity === 'introvert') {
    socialNeed = 'alone';
  } else if (persona.behaviorProfile.socialActivity === 'extrovert') {
    socialNeed = 'social';
  }

  return { mood, energy, socialNeed };
}
