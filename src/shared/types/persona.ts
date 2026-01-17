import { z } from 'zod';

/**
 * ペルソナスキーマ
 * モックデータ生成のための基本情報
 */
export const personaSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  age: z.number().int().min(18).max(100),
  gender: z.enum(['male', 'female', 'other']),
  occupation: z.string(),
  location: z.object({
    home: z.object({
      address: z.string(),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    work: z.object({
      address: z.string(),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  }),
  lifestyle: z.object({
    workStyle: z.enum(['office', 'remote', 'hybrid', 'freelance']),
    sleepPattern: z.enum(['early_bird', 'normal', 'night_owl']),
    activityLevel: z.enum(['sedentary', 'moderate', 'active', 'very_active']),
    stressLevel: z.enum(['low', 'moderate', 'high']),
  }),
  interests: z.array(z.string()),
  hobbies: z.array(z.string()),
  recentActivities: z.array(z.string()),
  preferences: z.object({
    favoriteCategories: z.array(z.string()),
    avoidCategories: z.array(z.string()),
    budgetRange: z.enum(['low', 'medium', 'high', 'luxury']),
    travelStyle: z.enum(['relaxed', 'active', 'adventurous', 'cultural']),
    preferredTimeSlots: z.array(z.enum(['morning', 'afternoon', 'evening', 'night'])),
  }),
});

export type Persona = z.infer<typeof personaSchema>;

/**
 * ペルソナ詳細情報（データ生成用拡張）
 */
export const personaProfileSchema = personaSchema.extend({
  healthProfile: z.object({
    averageHeartRate: z.number().min(50).max(100),
    averageSleepHours: z.number().min(4).max(12),
    sleepQuality: z.number().min(0).max(100),
    stressTendency: z.number().min(0).max(100),
    fatigueTendency: z.number().min(0).max(100),
  }),
  behaviorProfile: z.object({
    searchFrequency: z.enum(['low', 'medium', 'high']),
    purchaseFrequency: z.enum(['low', 'medium', 'high']),
    planningStyle: z.enum(['spontaneous', 'casual', 'organized', 'meticulous']),
    socialActivity: z.enum(['introvert', 'ambivert', 'extrovert']),
  }),
});

export type PersonaProfile = z.infer<typeof personaProfileSchema>;
