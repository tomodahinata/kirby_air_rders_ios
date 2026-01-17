import type { PersonaProfile } from '@/shared/types/persona';
import type { PurchaseHistoryRecord, PurchaseCategory } from '../types/behavior';

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
 * カテゴリ別商品テンプレート
 */
interface ProductTemplate {
  name: string;
  priceRange: [number, number];
  tags: string[];
}

const PRODUCT_TEMPLATES: Record<PurchaseCategory, ProductTemplate[]> = {
  electronics: [
    {
      name: 'ワイヤレスイヤホン',
      priceRange: [8000, 35000],
      tags: ['ガジェット', 'オーディオ'],
    },
    {
      name: 'モバイルバッテリー',
      priceRange: [3000, 8000],
      tags: ['充電器', 'アウトドア'],
    },
    {
      name: 'SDカード 128GB',
      priceRange: [2000, 5000],
      tags: ['ストレージ', 'カメラ'],
    },
    {
      name: 'スマートウォッチバンド',
      priceRange: [2000, 6000],
      tags: ['アクセサリ'],
    },
  ],
  fashion: [
    {
      name: 'アウトドアジャケット',
      priceRange: [8000, 25000],
      tags: ['アウトドア', '防寒'],
    },
    {
      name: 'トレッキングシューズ',
      priceRange: [10000, 30000],
      tags: ['アウトドア', 'シューズ'],
    },
    {
      name: 'Tシャツ',
      priceRange: [2000, 5000],
      tags: ['カジュアル'],
    },
  ],
  food: [
    {
      name: 'コーヒー豆 200g',
      priceRange: [1500, 3500],
      tags: ['コーヒー', 'ドリンク'],
    },
    {
      name: 'キャンプ用インスタント食品セット',
      priceRange: [2000, 5000],
      tags: ['キャンプ', '食品'],
    },
    {
      name: 'プロテインバー',
      priceRange: [200, 500],
      tags: ['健康', 'スナック'],
    },
  ],
  outdoor: [
    {
      name: 'ソロテント 2人用',
      priceRange: [15000, 45000],
      tags: ['キャンプ', 'テント'],
    },
    {
      name: '寝袋 3シーズン',
      priceRange: [8000, 20000],
      tags: ['キャンプ', '寝具'],
    },
    {
      name: 'LEDランタン',
      priceRange: [3000, 8000],
      tags: ['キャンプ', '照明'],
    },
    {
      name: 'キャンプチェア',
      priceRange: [5000, 15000],
      tags: ['キャンプ', '家具'],
    },
    {
      name: '焚き火台',
      priceRange: [5000, 20000],
      tags: ['キャンプ', 'BBQ'],
    },
    {
      name: 'クーラーボックス',
      priceRange: [8000, 30000],
      tags: ['キャンプ', '保冷'],
    },
    {
      name: 'トレッキングポール',
      priceRange: [5000, 15000],
      tags: ['ハイキング', 'アウトドア'],
    },
  ],
  sports: [
    {
      name: 'ランニングシューズ',
      priceRange: [8000, 20000],
      tags: ['ランニング', 'シューズ'],
    },
    {
      name: 'ヨガマット',
      priceRange: [2000, 8000],
      tags: ['ヨガ', 'フィットネス'],
    },
  ],
  home: [
    {
      name: '収納ボックス',
      priceRange: [1500, 4000],
      tags: ['収納', 'インテリア'],
    },
    {
      name: 'デスクライト',
      priceRange: [3000, 10000],
      tags: ['照明', 'オフィス'],
    },
  ],
  books: [
    {
      name: 'キャンプ入門ガイド',
      priceRange: [1500, 2500],
      tags: ['書籍', 'キャンプ'],
    },
    {
      name: '写真撮影テクニック本',
      priceRange: [2000, 4000],
      tags: ['書籍', '写真'],
    },
  ],
  entertainment: [
    {
      name: 'Bluetoothスピーカー',
      priceRange: [5000, 20000],
      tags: ['オーディオ', 'アウトドア'],
    },
    {
      name: '映画チケット',
      priceRange: [1800, 2500],
      tags: ['映画', 'エンタメ'],
    },
  ],
  travel: [
    {
      name: '旅行用ポーチセット',
      priceRange: [2000, 5000],
      tags: ['旅行', '収納'],
    },
    {
      name: '車載スマホホルダー',
      priceRange: [2000, 5000],
      tags: ['カー用品', 'ドライブ'],
    },
  ],
  health: [
    {
      name: 'マッサージガン',
      priceRange: [8000, 25000],
      tags: ['健康', 'リラックス'],
    },
    {
      name: 'サプリメント',
      priceRange: [2000, 5000],
      tags: ['健康', '栄養'],
    },
  ],
  automotive: [
    {
      name: 'カーチャージャー',
      priceRange: [2000, 5000],
      tags: ['カー用品', '充電'],
    },
    {
      name: '洗車用品セット',
      priceRange: [3000, 8000],
      tags: ['カー用品', 'メンテナンス'],
    },
    {
      name: 'ドライブレコーダー',
      priceRange: [10000, 30000],
      tags: ['カー用品', '安全'],
    },
  ],
  other: [
    { name: 'ギフトカード', priceRange: [3000, 10000], tags: ['ギフト'] },
    {
      name: 'サブスクリプション 1ヶ月',
      priceRange: [500, 2000],
      tags: ['サービス'],
    },
  ],
};

/**
 * ペルソナの興味に基づいてカテゴリの重みを計算
 */
function getCategoryWeights(persona: PersonaProfile): Map<PurchaseCategory, number> {
  const weights = new Map<PurchaseCategory, number>();

  const categories: PurchaseCategory[] = [
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
  ];

  categories.forEach((cat) => weights.set(cat, 1));

  // ペルソナの興味に基づいて重みを調整
  persona.interests.forEach((interest) => {
    const lowerInterest = interest.toLowerCase();
    if (lowerInterest.includes('キャンプ') || lowerInterest.includes('アウトドア')) {
      weights.set('outdoor', (weights.get('outdoor') ?? 1) + 6);
      weights.set('fashion', (weights.get('fashion') ?? 1) + 2);
    }
    if (lowerInterest.includes('ドライブ')) {
      weights.set('automotive', (weights.get('automotive') ?? 1) + 3);
      weights.set('travel', (weights.get('travel') ?? 1) + 2);
    }
    if (lowerInterest.includes('カフェ') || lowerInterest.includes('コーヒー')) {
      weights.set('food', (weights.get('food') ?? 1) + 3);
    }
    if (lowerInterest.includes('テクノロジー') || lowerInterest.includes('ガジェット')) {
      weights.set('electronics', (weights.get('electronics') ?? 1) + 4);
    }
    if (lowerInterest.includes('写真')) {
      weights.set('electronics', (weights.get('electronics') ?? 1) + 2);
      weights.set('books', (weights.get('books') ?? 1) + 1);
    }
  });

  return weights;
}

/**
 * 重み付きランダムでカテゴリを選択
 */
function selectWeightedCategory(weights: Map<PurchaseCategory, number>): PurchaseCategory {
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
 * 予算範囲に基づいて価格を調整
 */
function adjustPriceForBudget(
  basePrice: number,
  budgetRange: 'low' | 'medium' | 'high' | 'luxury'
): number {
  const multipliers = {
    low: 0.6,
    medium: 1.0,
    high: 1.4,
    luxury: 2.0,
  };
  return Math.round(basePrice * multipliers[budgetRange]);
}

/**
 * 購買履歴を生成
 */
export function generatePurchaseHistory(
  persona: PersonaProfile,
  days: number = 30,
  averagePurchasesPerWeek: number = 3
): PurchaseHistoryRecord[] {
  const records: PurchaseHistoryRecord[] = [];
  const categoryWeights = getCategoryWeights(persona);
  const now = new Date();

  const platforms: Array<'amazon' | 'rakuten' | 'yahoo' | 'physical' | 'other'> = [
    'amazon',
    'rakuten',
    'amazon',
    'physical',
    'amazon',
  ]; // Amazonの重み付け

  // 購買頻度の調整
  const frequencyMultiplier =
    persona.behaviorProfile.purchaseFrequency === 'high'
      ? 1.5
      : persona.behaviorProfile.purchaseFrequency === 'low'
        ? 0.5
        : 1.0;

  const totalPurchases = Math.round((days / 7) * averagePurchasesPerWeek * frequencyMultiplier);

  for (let i = 0; i < totalPurchases; i++) {
    const daysAgo = randomIntInRange(0, days);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(randomIntInRange(9, 22), randomIntInRange(0, 59), randomIntInRange(0, 59));

    const category = selectWeightedCategory(categoryWeights);
    const templates = PRODUCT_TEMPLATES[category];
    const template = pickRandom(templates);

    const basePrice = randomIntInRange(template.priceRange[0], template.priceRange[1]);
    const adjustedPrice = adjustPriceForBudget(basePrice, persona.preferences.budgetRange);

    records.push({
      id: generateUUID(),
      itemName: template.name,
      category,
      price: adjustedPrice,
      currency: 'JPY',
      timestamp: date.toISOString(),
      store:
        category === 'outdoor'
          ? pickRandom(['モンベル', 'スノーピーク', 'コールマン', 'Amazon'])
          : category === 'electronics'
            ? pickRandom(['ヨドバシカメラ', 'ビックカメラ', 'Amazon'])
            : 'Amazon',
      platform: pickRandom(platforms),
      tags: template.tags,
    });
  }

  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * 購買傾向を分析
 */
export function analyzePurchaseTrend(records: PurchaseHistoryRecord[]): {
  topCategories: PurchaseCategory[];
  totalSpent: number;
  averagePrice: number;
  purchaseTrend: string;
  recentInterests: string[];
} {
  // カテゴリ別カウント
  const categoryCounts = new Map<PurchaseCategory, number>();
  records.forEach((r) => {
    categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
  });

  // トップ3カテゴリ
  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  // 総支出
  const totalSpent = records.reduce((sum, r) => sum + r.price, 0);
  const averagePrice = records.length > 0 ? totalSpent / records.length : 0;

  // 購買傾向を文章化
  const trendDescriptions: Record<PurchaseCategory, string> = {
    outdoor: 'アウトドア・キャンプ用品への投資が多い',
    electronics: 'ガジェット・電子機器に関心が高い',
    fashion: 'ファッション・衣類への支出が目立つ',
    food: '食品・飲料への支出がある',
    sports: 'スポーツ・フィットネス用品を購入中',
    home: 'インテリア・生活用品を整えている',
    books: '読書・学習に投資している',
    entertainment: 'エンターテイメントを楽しんでいる',
    travel: '旅行関連グッズを揃えている',
    health: '健康・ウェルネスに投資中',
    automotive: '車関連用品に関心が高い',
    other: '多様な商品を購入している',
  };

  const topCategory = topCategories[0] ?? 'other';
  const purchaseTrend = trendDescriptions[topCategory];

  // 直近の興味（タグから抽出）
  const recentTags = new Set<string>();
  records.slice(0, 10).forEach((r) => {
    r.tags?.forEach((tag) => recentTags.add(tag));
  });

  return {
    topCategories,
    totalSpent,
    averagePrice: Math.round(averagePrice),
    purchaseTrend,
    recentInterests: Array.from(recentTags).slice(0, 5),
  };
}
