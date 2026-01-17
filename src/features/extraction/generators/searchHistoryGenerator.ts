import type { PersonaProfile } from '@/shared/types/persona';
import type { SearchHistoryRecord, SearchCategory } from '../types/behavior';

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
 * カテゴリ別検索クエリテンプレート
 */
const SEARCH_TEMPLATES: Record<SearchCategory, string[]> = {
  restaurant: [
    '近くのラーメン屋',
    '渋谷 焼肉 おすすめ',
    'ランチ 1000円以下',
    '世田谷 イタリアン',
    '深夜営業 居酒屋',
    '個室 ディナー',
  ],
  cafe: [
    'おしゃれ カフェ 東京',
    'コーヒー専門店 世田谷',
    'テラス席 カフェ',
    '読書 静か カフェ',
    'スペシャルティコーヒー',
    'モーニング カフェ',
  ],
  shopping: [
    '渋谷 ショッピングモール',
    'アウトレット 関東',
    '家電量販店 営業時間',
    'ユニクロ 新作',
    '無印良品 収納',
  ],
  travel: [
    '河口湖 観光',
    '箱根 日帰り温泉',
    '軽井沢 ドライブコース',
    '伊豆 週末旅行',
    '山梨 絶景スポット',
  ],
  entertainment: [
    '映画館 上映スケジュール',
    'ライブハウス 渋谷',
    'ゲームセンター 新宿',
    'ボウリング 予約',
  ],
  outdoor: [
    'キャンプ場 予約',
    'テント おすすめ 2024',
    'キャンプ 初心者 道具',
    'BBQ 場所 東京近郊',
    'ハイキング コース 初心者',
    'オートキャンプ場 関東',
    '焚き火台 コンパクト',
    'キャンプ飯 レシピ',
  ],
  sports: ['ゴルフ練習場 近く', 'ジム 24時間', 'テニスコート 予約', 'ランニングコース'],
  culture: ['美術館 展覧会', '博物館 東京', '写真展 2024', 'ギャラリー 表参道'],
  technology: [
    'iPhone 15 レビュー',
    'MacBook Air M3',
    'ワイヤレスイヤホン おすすめ',
    'スマートウォッチ 比較',
    'カメラ ミラーレス 入門',
    'レンズ 広角 おすすめ',
  ],
  health: ['整体 予約', 'マッサージ 肩こり', 'ヨガスタジオ 体験', 'サウナ おすすめ'],
  other: ['天気予報 週末', '渋滞情報 中央道', '高速道路 料金'],
};

/**
 * ペルソナの興味に基づいてカテゴリの重みを計算
 */
function getCategoryWeights(persona: PersonaProfile): Map<SearchCategory, number> {
  const weights = new Map<SearchCategory, number>();

  // デフォルト重み
  const categories: SearchCategory[] = [
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
  ];

  categories.forEach((cat) => weights.set(cat, 1));

  // ペルソナの興味に基づいて重みを調整
  persona.interests.forEach((interest) => {
    const lowerInterest = interest.toLowerCase();
    if (lowerInterest.includes('キャンプ') || lowerInterest.includes('アウトドア')) {
      weights.set('outdoor', (weights.get('outdoor') ?? 1) + 5);
      weights.set('travel', (weights.get('travel') ?? 1) + 2);
    }
    if (lowerInterest.includes('カフェ') || lowerInterest.includes('コーヒー')) {
      weights.set('cafe', (weights.get('cafe') ?? 1) + 4);
    }
    if (lowerInterest.includes('ドライブ') || lowerInterest.includes('旅行')) {
      weights.set('travel', (weights.get('travel') ?? 1) + 3);
    }
    if (lowerInterest.includes('テクノロジー') || lowerInterest.includes('ガジェット')) {
      weights.set('technology', (weights.get('technology') ?? 1) + 3);
    }
    if (lowerInterest.includes('写真')) {
      weights.set('technology', (weights.get('technology') ?? 1) + 2);
      weights.set('culture', (weights.get('culture') ?? 1) + 2);
    }
  });

  return weights;
}

/**
 * 重み付きランダムでカテゴリを選択
 */
function selectWeightedCategory(weights: Map<SearchCategory, number>): SearchCategory {
  const entries = Array.from(weights.entries());
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [category, weight] of entries) {
    random -= weight;
    if (random <= 0) {
      return category;
    }
  }

  return 'other';
}

/**
 * 検索履歴を生成
 */
export function generateSearchHistory(
  persona: PersonaProfile,
  days: number = 14,
  recordsPerDay: number = 5
): SearchHistoryRecord[] {
  const records: SearchHistoryRecord[] = [];
  const categoryWeights = getCategoryWeights(persona);
  const now = new Date();

  const sources: Array<'google' | 'safari' | 'maps' | 'app' | 'other'> = [
    'google',
    'safari',
    'maps',
    'app',
  ];

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);

    // 週末は検索頻度が高い
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dailyRecords = isWeekend
      ? randomIntInRange(recordsPerDay, recordsPerDay + 5)
      : randomIntInRange(Math.max(1, recordsPerDay - 2), recordsPerDay);

    for (let r = 0; r < dailyRecords; r++) {
      const hour = randomIntInRange(7, 23);
      date.setHours(hour, randomIntInRange(0, 59), randomIntInRange(0, 59));

      const category = selectWeightedCategory(categoryWeights);
      const templates = SEARCH_TEMPLATES[category];
      const query = pickRandom(templates);

      records.push({
        id: generateUUID(),
        query,
        category,
        timestamp: date.toISOString(),
        source: pickRandom(sources),
        clickedResults:
          Math.random() > 0.4
            ? [
                {
                  title: `${query}に関する結果`,
                  url: `https://example.com/search?q=${encodeURIComponent(query)}`,
                },
              ]
            : undefined,
      });
    }
  }

  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * 直近の検索トレンドを分析
 */
export function analyzeSearchTrend(records: SearchHistoryRecord[]): {
  topCategories: SearchCategory[];
  recentTheme: string;
  searchIntensity: 'low' | 'medium' | 'high';
} {
  // カテゴリ別カウント
  const categoryCounts = new Map<SearchCategory, number>();
  records.forEach((r) => {
    categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
  });

  // トップ3カテゴリ
  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  // 直近の検索テーマを推定
  const recentRecords = records.slice(0, 10);
  const recentCategories = recentRecords.map((r) => r.category);
  const mostRecentCategory = recentCategories[0] ?? 'other';

  const themeMap: Record<SearchCategory, string> = {
    outdoor: 'キャンプ・アウトドア活動に興味あり',
    cafe: 'カフェ巡りを楽しんでいる',
    travel: '旅行・ドライブを計画中',
    technology: 'テクノロジー・ガジェットに関心',
    restaurant: 'グルメ探索中',
    shopping: 'ショッピングを検討中',
    entertainment: 'エンターテイメントを探索中',
    sports: 'スポーツ・運動に興味あり',
    culture: '文化・アート活動に関心',
    health: '健康・ウェルネスを意識',
    other: '多様な検索をしている',
  };

  const searchIntensity: 'low' | 'medium' | 'high' =
    records.length > 50 ? 'high' : records.length > 20 ? 'medium' : 'low';

  return {
    topCategories,
    recentTheme: themeMap[mostRecentCategory],
    searchIntensity,
  };
}
