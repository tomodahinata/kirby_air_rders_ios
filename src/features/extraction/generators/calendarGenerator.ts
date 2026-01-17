import type { PersonaProfile } from '@/shared/types/persona';
import type { CalendarEvent, CalendarEventType } from '../types/behavior';

/**
 * ランダム値生成ユーティリティ
 */
function randomIntInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function pickRandom<T>(arr: T[]): T {
  const idx = randomIntInRange(0, arr.length - 1);
  return arr[idx] as T;
}

/**
 * イベントテンプレート
 */
interface EventTemplate {
  title: string;
  type: CalendarEventType;
  durationMinutes: number;
  location?: string;
  notes?: string;
}

const WORK_EVENTS: EventTemplate[] = [
  {
    title: 'チームミーティング',
    type: 'meeting',
    durationMinutes: 60,
    notes: '週次進捗確認',
  },
  {
    title: '1on1',
    type: 'meeting',
    durationMinutes: 30,
    notes: 'マネージャーとの定期面談',
  },
  {
    title: 'プロジェクトレビュー',
    type: 'meeting',
    durationMinutes: 90,
  },
  {
    title: 'ランチミーティング',
    type: 'meeting',
    durationMinutes: 60,
    location: '渋谷駅周辺',
  },
  {
    title: '開発作業',
    type: 'work',
    durationMinutes: 180,
    notes: '集中作業時間',
  },
  {
    title: 'コードレビュー',
    type: 'work',
    durationMinutes: 60,
  },
];

const PERSONAL_EVENTS: EventTemplate[] = [
  {
    title: '歯医者',
    type: 'appointment',
    durationMinutes: 60,
    location: '三軒茶屋駅前デンタルクリニック',
  },
  {
    title: '美容室',
    type: 'appointment',
    durationMinutes: 90,
    location: '渋谷',
  },
  {
    title: '整体',
    type: 'appointment',
    durationMinutes: 60,
    location: '世田谷区',
  },
  {
    title: 'ジム',
    type: 'personal',
    durationMinutes: 90,
    location: 'エニタイムフィットネス',
  },
  { title: '読書タイム', type: 'personal', durationMinutes: 60 },
];

const TRAVEL_EVENTS: EventTemplate[] = [
  {
    title: 'キャンプ @ 河口湖',
    type: 'travel',
    durationMinutes: 1440, // 24時間
    location: '河口湖オートキャンプ場',
    notes: '天気予報を確認する',
  },
  {
    title: '箱根日帰り旅行',
    type: 'travel',
    durationMinutes: 480,
    location: '箱根',
    notes: '温泉と美術館',
  },
  {
    title: '軽井沢ドライブ',
    type: 'travel',
    durationMinutes: 480,
    location: '軽井沢',
  },
  {
    title: 'カフェ巡り',
    type: 'personal',
    durationMinutes: 180,
    location: '代官山・中目黒エリア',
  },
];

const REMINDER_EVENTS: EventTemplate[] = [
  {
    title: '車の定期点検',
    type: 'reminder',
    durationMinutes: 120,
    notes: 'ディーラーに予約済み',
  },
  { title: '税金支払い期限', type: 'reminder', durationMinutes: 0 },
  { title: '誕生日: 田中花子', type: 'reminder', durationMinutes: 0 },
  { title: 'キャンプ用品受け取り', type: 'reminder', durationMinutes: 0 },
];

/**
 * 曜日に応じたイベントを生成
 */
function generateDayEvents(date: Date, persona: PersonaProfile): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isWorkday = !isWeekend && persona.lifestyle.workStyle !== 'freelance';

  // 平日の仕事イベント
  if (isWorkday) {
    // ランダムに1-3個の仕事イベント
    const workEventCount = randomIntInRange(1, 3);
    const usedHours = new Set<number>();

    for (let i = 0; i < workEventCount; i++) {
      const template = pickRandom(WORK_EVENTS);
      let hour = randomIntInRange(9, 17);

      // 時間の重複を避ける
      while (usedHours.has(hour)) {
        hour = randomIntInRange(9, 17);
      }
      usedHours.add(hour);

      const startTime = new Date(date);
      startTime.setHours(hour, randomIntInRange(0, 30), 0, 0);

      const endTime = new Date(startTime.getTime() + template.durationMinutes * 60 * 1000);

      events.push({
        id: generateUUID(),
        title: template.title,
        type: template.type,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: template.location,
        isAllDay: false,
        notes: template.notes,
      });
    }
  }

  // 週末のレジャーイベント（確率ベース）
  if (isWeekend && Math.random() > 0.4) {
    // ペルソナの興味に基づいてイベントを選択
    const hasOutdoorInterest = persona.interests.some(
      (i) =>
        i.toLowerCase().includes('キャンプ') ||
        i.toLowerCase().includes('ドライブ') ||
        i.toLowerCase().includes('アウトドア')
    );

    if (hasOutdoorInterest && Math.random() > 0.5) {
      const template = pickRandom(TRAVEL_EVENTS);
      const startTime = new Date(date);
      startTime.setHours(randomIntInRange(7, 10), 0, 0, 0);

      const endTime = new Date(startTime.getTime() + template.durationMinutes * 60 * 1000);

      events.push({
        id: generateUUID(),
        title: template.title,
        type: template.type,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: template.location,
        isAllDay: template.durationMinutes >= 1440,
        notes: template.notes,
      });
    }
  }

  // 個人的な予定（週に1-2回）
  if (Math.random() > 0.7) {
    const template = pickRandom(PERSONAL_EVENTS);
    const hour = isWeekend ? randomIntInRange(10, 18) : randomIntInRange(18, 21);

    const startTime = new Date(date);
    startTime.setHours(hour, randomIntInRange(0, 30), 0, 0);

    const endTime = new Date(startTime.getTime() + template.durationMinutes * 60 * 1000);

    events.push({
      id: generateUUID(),
      title: template.title,
      type: template.type,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: template.location,
      isAllDay: false,
      notes: template.notes,
    });
  }

  // リマインダー（低確率）
  if (Math.random() > 0.9) {
    const template = pickRandom(REMINDER_EVENTS);
    const startTime = new Date(date);
    startTime.setHours(9, 0, 0, 0);

    events.push({
      id: generateUUID(),
      title: template.title,
      type: template.type,
      startTime: startTime.toISOString(),
      endTime: startTime.toISOString(),
      isAllDay: true,
      notes: template.notes,
    });
  }

  return events;
}

/**
 * カレンダーイベントを生成
 */
export function generateCalendarEvents(
  persona: PersonaProfile,
  daysBack: number = 7,
  daysForward: number = 14
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();

  // 過去のイベント
  for (let d = 1; d <= daysBack; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    events.push(...generateDayEvents(date, persona));
  }

  // 今日と未来のイベント
  for (let d = 0; d <= daysForward; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    events.push(...generateDayEvents(date, persona));
  }

  return events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * 今後の予定を分析
 */
export function analyzeUpcomingEvents(events: CalendarEvent[]): {
  upcomingEventTypes: CalendarEventType[];
  nextMajorEvent: string | null;
  busyDays: string[];
  freeTimeSlots: string[];
} {
  const now = new Date();
  const futureEvents = events.filter((e) => new Date(e.startTime).getTime() > now.getTime());

  // イベントタイプを集計
  const typeCounts = new Map<CalendarEventType, number>();
  futureEvents.forEach((e) => {
    typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1);
  });

  const upcomingEventTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);

  // 次の主要イベント（旅行・アポイント）
  const majorEvents = futureEvents.filter((e) => e.type === 'travel' || e.type === 'appointment');
  const nextMajorEvent = majorEvents.length > 0 ? (majorEvents[0]?.title ?? null) : null;

  // 忙しい日を特定
  const eventsByDate = new Map<string, number>();
  futureEvents.forEach((e) => {
    const dateStr = new Date(e.startTime).toISOString().split('T')[0];
    if (dateStr) {
      eventsByDate.set(dateStr, (eventsByDate.get(dateStr) ?? 0) + 1);
    }
  });

  const busyDays = Array.from(eventsByDate.entries())
    .filter(([, count]) => count >= 3)
    .map(([date]) => date)
    .slice(0, 3);

  // 空き時間を推定
  const freeTimeSlots: string[] = [];
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  for (let d = 0; d < 7; d++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + d);
    const dateStr = checkDate.toISOString().split('T')[0];

    const dayEventCount = eventsByDate.get(dateStr ?? '') ?? 0;
    const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;

    if (dayEventCount === 0 && isWeekend) {
      freeTimeSlots.push(`${dateStr} (終日フリー)`);
    } else if (dayEventCount <= 1) {
      freeTimeSlots.push(`${dateStr} 午後`);
    }
  }

  return {
    upcomingEventTypes,
    nextMajorEvent,
    busyDays,
    freeTimeSlots: freeTimeSlots.slice(0, 3),
  };
}
