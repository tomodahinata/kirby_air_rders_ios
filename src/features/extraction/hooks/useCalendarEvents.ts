import { useState, useCallback, useEffect } from 'react';
import * as Calendar from 'expo-calendar';

import type { UpcomingEvents, UpcomingEvent } from '../types/realData';
import { getActivePersona } from '@/mocks/data/persona';

/**
 * カレンダー権限をリクエスト
 */
async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/**
 * カレンダー権限を確認
 */
async function checkCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === 'granted';
}

/**
 * モック カレンダーイベントを生成
 */
function generateMockCalendarEvents(): UpcomingEvents {
  const persona = getActivePersona();
  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const mockEvents: UpcomingEvent[] = [];
  const busyDays: string[] = [];
  const travelDestinations: string[] = [];

  // ペルソナに基づいてイベントを生成
  const baseEvents = [
    {
      title: 'チームミーティング',
      daysFromNow: 1,
      hour: 10,
      duration: 60,
      location: undefined,
      isAllDay: false,
    },
    {
      title: 'ランチミーティング',
      daysFromNow: 2,
      hour: 12,
      duration: 90,
      location: '渋谷駅周辺',
      isAllDay: false,
    },
    {
      title: '1on1',
      daysFromNow: 3,
      hour: 15,
      duration: 30,
      location: undefined,
      isAllDay: false,
    },
  ];

  // 週末にアウトドア関連イベントを追加（ペルソナの興味に基づく）
  const hasOutdoorInterest = persona.interests.some(
    (i) =>
      i.toLowerCase().includes('キャンプ') ||
      i.toLowerCase().includes('ドライブ') ||
      i.toLowerCase().includes('アウトドア')
  );

  if (hasOutdoorInterest) {
    const nextSaturday = new Date(now);
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);

    if (nextSaturday <= oneWeekLater) {
      baseEvents.push({
        title: 'キャンプ @ 河口湖',
        daysFromNow: daysUntilSaturday,
        hour: 8,
        duration: 480,
        location: '河口湖オートキャンプ場',
        isAllDay: false,
      });
      travelDestinations.push('河口湖');
    }
  }

  // カフェ好きならカフェ巡りイベント
  const hasCafeInterest = persona.interests.some((i) => i.toLowerCase().includes('カフェ'));

  if (hasCafeInterest) {
    const nextSunday = new Date(now);
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    nextSunday.setDate(now.getDate() + daysUntilSunday);

    if (nextSunday <= oneWeekLater) {
      baseEvents.push({
        title: 'カフェ巡り',
        daysFromNow: daysUntilSunday,
        hour: 14,
        duration: 180,
        location: '代官山・中目黒エリア',
        isAllDay: false,
      });
    }
  }

  // イベントを生成
  baseEvents.forEach((event, index) => {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + event.daysFromNow);
    startDate.setHours(event.hour, 0, 0, 0);

    const endDate = new Date(startDate.getTime() + event.duration * 60 * 1000);

    const dateStr = startDate.toISOString().split('T')[0];
    if (dateStr && !busyDays.includes(dateStr)) {
      busyDays.push(dateStr);
    }

    mockEvents.push({
      id: `mock-event-${index}`,
      title: event.title,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: event.location,
      isAllDay: event.isAllDay,
      calendarName: 'Mock Calendar',
    });
  });

  // 日付順にソート
  mockEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return {
    collectedAt: now.toISOString(),
    source: 'mock',
    events: mockEvents,
    summary: {
      totalEvents: mockEvents.length,
      busyDays,
      nextEvent: mockEvents[0],
      hasTravel: travelDestinations.length > 0,
      travelDestinations,
    },
  };
}

/**
 * 実際のカレンダーデータを取得
 */
async function fetchRealCalendarEvents(): Promise<UpcomingEvents> {
  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // デフォルトカレンダーを取得
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  if (calendars.length === 0) {
    throw new Error('カレンダーが見つかりません');
  }

  // すべてのカレンダーからイベントを取得
  const calendarIds = calendars.map((c) => c.id);
  const events = await Calendar.getEventsAsync(calendarIds, now, oneWeekLater);

  const upcomingEvents: UpcomingEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title || '無題のイベント',
    startDate:
      typeof event.startDate === 'string' ? event.startDate : event.startDate.toISOString(),
    endDate: typeof event.endDate === 'string' ? event.endDate : event.endDate.toISOString(),
    location: event.location ?? undefined,
    notes: event.notes ?? undefined,
    isAllDay: event.allDay ?? false,
    calendarName: calendars.find((c) => c.id === event.calendarId)?.title,
  }));

  // 日付順にソート
  upcomingEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // サマリー生成
  const busyDays = [
    ...new Set(upcomingEvents.map((e) => new Date(e.startDate).toISOString().split('T')[0])),
  ].filter((d): d is string => d !== undefined);

  // 旅行関連のイベントを検出
  const travelKeywords = ['旅行', 'トリップ', 'ドライブ', 'キャンプ', '温泉', '旅'];
  const travelEvents = upcomingEvents.filter((e) =>
    travelKeywords.some(
      (keyword) => e.title.includes(keyword) || (e.location?.includes(keyword) ?? false)
    )
  );

  const travelDestinations = travelEvents
    .map((e) => e.location)
    .filter((loc): loc is string => !!loc);

  return {
    collectedAt: now.toISOString(),
    source: 'calendar',
    events: upcomingEvents,
    summary: {
      totalEvents: upcomingEvents.length,
      busyDays,
      nextEvent: upcomingEvents[0],
      hasTravel: travelEvents.length > 0,
      travelDestinations: [...new Set(travelDestinations)],
    },
  };
}

/**
 * カレンダーイベント取得フック
 */
export function useCalendarEvents() {
  const [events, setEvents] = useState<UpcomingEvents | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAvailable, _setIsAvailable] = useState(true);

  // 権限チェック
  useEffect(() => {
    checkCalendarPermission().then(setIsAuthorized);
  }, []);

  const requestAuthorization = useCallback(async () => {
    try {
      const granted = await requestCalendarPermission();
      setIsAuthorized(granted);
      return granted;
    } catch (err) {
      console.error('[Calendar] Permission request failed:', err);
      return false;
    }
  }, []);

  const fetchData = useCallback(async (useMockFallback: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      // 権限チェック
      const hasPermission = await checkCalendarPermission();

      if (!hasPermission) {
        // 権限がない場合はリクエスト
        const granted = await requestCalendarPermission();
        if (!granted) {
          throw new Error('カレンダーへのアクセスが許可されていません');
        }
        setIsAuthorized(true);
      }

      const data = await fetchRealCalendarEvents();
      setEvents(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'カレンダーデータの取得に失敗しました';
      setError(errorMessage);

      if (useMockFallback) {
        console.log('[Calendar] Falling back to mock data');
        const mockData = generateMockCalendarEvents();
        setEvents(mockData);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    events,
    isLoading,
    error,
    isAvailable,
    isAuthorized,
    fetchData,
    requestAuthorization,
    isUsingMock: events?.source === 'mock',
  };
}
