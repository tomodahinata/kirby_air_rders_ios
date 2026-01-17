import type { PersonaProfile } from '@/shared/types/persona';
import type {
  HealthData,
  HeartRateRecord,
  StressLevelRecord,
  FatigueRecord,
  SleepRecord,
  StepCountRecord,
  HealthSummary,
} from '../types/health';

/**
 * ランダム値生成ユーティリティ
 */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

function _generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 心拍数データを生成
 */
function generateHeartRateRecords(persona: PersonaProfile, days: number): HeartRateRecord[] {
  const records: HeartRateRecord[] = [];
  const baseRate = persona.healthProfile.averageHeartRate;
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);

    // 1日あたり8-12回の測定
    const measurementsPerDay = randomIntInRange(8, 12);

    for (let m = 0; m < measurementsPerDay; m++) {
      const hour = randomIntInRange(6, 23);
      const minute = randomIntInRange(0, 59);
      date.setHours(hour, minute, 0, 0);

      // 時間帯による変動（朝: 低め、日中: 高め、夜: 低め）
      let variation = 0;
      if (hour >= 6 && hour < 9) {
        variation = randomInRange(-5, 5);
      } else if (hour >= 9 && hour < 18) {
        variation = randomInRange(0, 15);
      } else {
        variation = randomInRange(-10, 5);
      }

      // ストレスレベルによる影響
      const stressImpact = (persona.healthProfile.stressTendency / 100) * randomInRange(0, 10);

      records.push({
        timestamp: date.toISOString(),
        bpm: Math.round(baseRate + variation + stressImpact),
        source: 'watch',
      });
    }
  }

  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * ストレスレベルデータを生成
 */
function generateStressLevelRecords(persona: PersonaProfile, days: number): StressLevelRecord[] {
  const records: StressLevelRecord[] = [];
  const baseTendency = persona.healthProfile.stressTendency;
  const now = new Date();

  const stressFactors = ['仕事の締め切り', '通勤ラッシュ', '会議', '運動不足', '睡眠不足'];

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);

    // 1日3-5回の測定
    const measurementsPerDay = randomIntInRange(3, 5);

    for (let m = 0; m < measurementsPerDay; m++) {
      const hour = randomIntInRange(8, 22);
      date.setHours(hour, randomIntInRange(0, 59), 0, 0);

      // 平日は高め、週末は低め
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const weekendAdjust = isWeekend ? -20 : 0;

      // 時間帯による変動
      let timeAdjust = 0;
      if (hour >= 9 && hour < 12) {
        timeAdjust = randomInRange(0, 15);
      } else if (hour >= 14 && hour < 18) {
        timeAdjust = randomInRange(5, 20);
      }

      const level = Math.max(
        0,
        Math.min(100, baseTendency + weekendAdjust + timeAdjust + randomInRange(-10, 10))
      );

      const factors: string[] = [];
      if (level > 60) {
        factors.push(stressFactors[randomIntInRange(0, stressFactors.length - 1)] ?? '不明');
      }

      records.push({
        timestamp: date.toISOString(),
        level: Math.round(level),
        factors: factors.length > 0 ? factors : undefined,
      });
    }
  }

  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * 疲労度データを生成
 */
function generateFatigueRecords(persona: PersonaProfile, days: number): FatigueRecord[] {
  const records: FatigueRecord[] = [];
  const baseTendency = persona.healthProfile.fatigueTendency;
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);

    // 朝と夜に測定
    const measurements = [
      { hour: 7, sleepImpact: true },
      { hour: 22, sleepImpact: false },
    ];

    for (const { hour, sleepImpact } of measurements) {
      date.setHours(hour, randomIntInRange(0, 30), 0, 0);

      // 睡眠品質の影響
      const sleepQuality = persona.healthProfile.sleepQuality;
      const sleepAdjust = sleepImpact ? (100 - sleepQuality) * 0.3 : 0;

      // 週の後半は疲労蓄積
      const dayOfWeek = date.getDay();
      const weekProgress = dayOfWeek === 0 ? 0 : dayOfWeek === 6 ? 5 : dayOfWeek * 3;

      const level = Math.max(
        0,
        Math.min(100, baseTendency + sleepAdjust + weekProgress + randomInRange(-10, 10))
      );

      records.push({
        timestamp: date.toISOString(),
        level: Math.round(level),
        sleepQuality: sleepImpact ? sleepQuality : undefined,
        activityLevel:
          persona.lifestyle.activityLevel === 'very_active'
            ? 'high'
            : persona.lifestyle.activityLevel === 'sedentary'
              ? 'low'
              : 'moderate',
      });
    }
  }

  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * 睡眠データを生成
 */
function generateSleepRecords(persona: PersonaProfile, days: number): SleepRecord[] {
  const records: SleepRecord[] = [];
  const avgHours = persona.healthProfile.averageSleepHours;
  const avgQuality = persona.healthProfile.sleepQuality;
  const now = new Date();

  // 睡眠パターンによる就寝時間の調整
  const bedtimeBase =
    persona.lifestyle.sleepPattern === 'early_bird'
      ? 22
      : persona.lifestyle.sleepPattern === 'night_owl'
        ? 1
        : 23;

  for (let d = 1; d <= days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);

    const dateStr = date.toISOString().split('T')[0];
    if (!dateStr) continue;

    // 就寝時間
    const bedtime = new Date(date);
    if (bedtimeBase >= 22) {
      bedtime.setHours(bedtimeBase + randomIntInRange(-1, 1), randomIntInRange(0, 59));
    } else {
      bedtime.setDate(bedtime.getDate() + 1);
      bedtime.setHours(bedtimeBase + randomIntInRange(-1, 1), randomIntInRange(0, 59));
    }

    // 睡眠時間（分）
    const durationHours = avgHours + randomInRange(-1.5, 1.5);
    const durationMinutes = Math.round(durationHours * 60);

    // 起床時間
    const wakeTime = new Date(bedtime.getTime() + durationMinutes * 60 * 1000);

    // 睡眠品質
    const quality = Math.max(0, Math.min(100, avgQuality + randomInRange(-15, 15)));

    records.push({
      date: dateStr,
      startTime: bedtime.toISOString(),
      endTime: wakeTime.toISOString(),
      durationMinutes,
      quality: Math.round(quality),
      stages: {
        deep: randomIntInRange(15, 25),
        light: randomIntInRange(45, 55),
        rem: randomIntInRange(15, 25),
        awake: randomIntInRange(2, 8),
      },
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * 歩数データを生成
 */
function generateStepCountRecords(persona: PersonaProfile, days: number): StepCountRecord[] {
  const records: StepCountRecord[] = [];
  const now = new Date();

  // 活動レベルによる基準歩数
  const baseSteps =
    persona.lifestyle.activityLevel === 'very_active'
      ? 12000
      : persona.lifestyle.activityLevel === 'active'
        ? 10000
        : persona.lifestyle.activityLevel === 'moderate'
          ? 7000
          : 4000;

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);

    const dateStr = date.toISOString().split('T')[0];
    if (!dateStr) continue;

    // 週末は変動大
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const variation = isWeekend ? randomInRange(-0.4, 0.6) : randomInRange(-0.2, 0.3);

    const steps = Math.round(baseSteps * (1 + variation));
    const distanceMeters = Math.round(steps * 0.75); // 1歩≒0.75m
    const caloriesBurned = Math.round(steps * 0.04); // 1歩≒0.04kcal

    records.push({
      date: dateStr,
      steps,
      distanceMeters,
      caloriesBurned,
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * ヘルスサマリーを計算
 */
function calculateHealthSummary(data: HealthData): HealthSummary {
  const _avgHR = data.summary.averageHeartRate;
  const avgStress = data.summary.averageStressLevel;
  const avgFatigue = data.summary.averageFatigueLevel;
  const avgSleep = data.summary.averageSleepQuality;

  // 総合状態を判定
  const overallScore = (100 - avgStress + 100 - avgFatigue + avgSleep) / 3;

  let currentCondition: 'excellent' | 'good' | 'fair' | 'poor';
  if (overallScore >= 75) {
    currentCondition = 'excellent';
  } else if (overallScore >= 55) {
    currentCondition = 'good';
  } else if (overallScore >= 35) {
    currentCondition = 'fair';
  } else {
    currentCondition = 'poor';
  }

  let stressLevel: 'low' | 'moderate' | 'high' | 'critical';
  if (avgStress < 30) {
    stressLevel = 'low';
  } else if (avgStress < 55) {
    stressLevel = 'moderate';
  } else if (avgStress < 80) {
    stressLevel = 'high';
  } else {
    stressLevel = 'critical';
  }

  let fatigueLevel: 'rested' | 'normal' | 'tired' | 'exhausted';
  if (avgFatigue < 25) {
    fatigueLevel = 'rested';
  } else if (avgFatigue < 50) {
    fatigueLevel = 'normal';
  } else if (avgFatigue < 75) {
    fatigueLevel = 'tired';
  } else {
    fatigueLevel = 'exhausted';
  }

  let sleepQuality: 'excellent' | 'good' | 'fair' | 'poor';
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
    recommendations.push('リラックスできる場所への訪問をおすすめします');
  }
  if (fatigueLevel === 'tired' || fatigueLevel === 'exhausted') {
    recommendations.push('休憩できるカフェや公園を検討してください');
  }
  if (sleepQuality === 'fair' || sleepQuality === 'poor') {
    recommendations.push('早めの帰宅を推奨します');
  }

  const recommendation =
    recommendations.length > 0
      ? recommendations.join('。')
      : '良好な状態です。お好みの場所へどうぞ';

  return {
    currentCondition,
    stressLevel,
    fatigueLevel,
    sleepQuality,
    recommendation,
  };
}

/**
 * 統合ヘルスデータを生成
 */
export function generateHealthData(persona: PersonaProfile, days: number = 7): HealthData {
  const heartRateRecords = generateHeartRateRecords(persona, days);
  const stressLevelRecords = generateStressLevelRecords(persona, days);
  const fatigueRecords = generateFatigueRecords(persona, days);
  const sleepRecords = generateSleepRecords(persona, days);
  const stepCountRecords = generateStepCountRecords(persona, days);

  // サマリー計算
  const avgHeartRate =
    heartRateRecords.length > 0
      ? heartRateRecords.reduce((sum, r) => sum + r.bpm, 0) / heartRateRecords.length
      : persona.healthProfile.averageHeartRate;

  const avgStressLevel =
    stressLevelRecords.length > 0
      ? stressLevelRecords.reduce((sum, r) => sum + r.level, 0) / stressLevelRecords.length
      : persona.healthProfile.stressTendency;

  const avgFatigueLevel =
    fatigueRecords.length > 0
      ? fatigueRecords.reduce((sum, r) => sum + r.level, 0) / fatigueRecords.length
      : persona.healthProfile.fatigueTendency;

  const avgSleepQuality =
    sleepRecords.length > 0
      ? sleepRecords.reduce((sum, r) => sum + r.quality, 0) / sleepRecords.length
      : persona.healthProfile.sleepQuality;

  const totalSteps = stepCountRecords.reduce((sum, r) => sum + r.steps, 0);

  return {
    userId: persona.id,
    collectedAt: new Date().toISOString(),
    heartRateRecords,
    stressLevelRecords,
    fatigueRecords,
    sleepRecords,
    stepCountRecords,
    summary: {
      averageHeartRate: Math.round(avgHeartRate),
      averageStressLevel: Math.round(avgStressLevel),
      averageFatigueLevel: Math.round(avgFatigueLevel),
      averageSleepQuality: Math.round(avgSleepQuality),
      totalStepsLast7Days: totalSteps,
    },
  };
}

/**
 * ヘルスサマリーを生成（LLM向け）
 */
export function generateHealthSummary(persona: PersonaProfile): HealthSummary {
  const healthData = generateHealthData(persona, 7);
  return calculateHealthSummary(healthData);
}
