import { memo } from 'react';
import { View, Text } from 'react-native';
import {
  Utensils,
  Coffee,
  ShoppingBag,
  Film,
  Trees,
  Landmark,
  Dumbbell,
  Briefcase,
  Home,
  MapPin,
} from 'lucide-react-native';

import type { DestinationCategory } from '../types/suggestion';
import type { LucideIcon } from 'lucide-react-native';

interface CategoryBadgeProps {
  category: DestinationCategory;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

interface CategoryConfig {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
}

const categoryConfig: Record<DestinationCategory, CategoryConfig> = {
  restaurant: {
    icon: Utensils,
    label: 'レストラン',
    color: '#ef4444',
    bgColor: 'bg-red-900/50',
  },
  cafe: {
    icon: Coffee,
    label: 'カフェ',
    color: '#f59e0b',
    bgColor: 'bg-amber-900/50',
  },
  shopping: {
    icon: ShoppingBag,
    label: 'ショッピング',
    color: '#ec4899',
    bgColor: 'bg-pink-900/50',
  },
  entertainment: {
    icon: Film,
    label: 'エンタメ',
    color: '#8b5cf6',
    bgColor: 'bg-violet-900/50',
  },
  nature: {
    icon: Trees,
    label: '自然',
    color: '#22c55e',
    bgColor: 'bg-green-900/50',
  },
  culture: {
    icon: Landmark,
    label: '文化',
    color: '#6366f1',
    bgColor: 'bg-indigo-900/50',
  },
  sports: {
    icon: Dumbbell,
    label: 'スポーツ',
    color: '#06b6d4',
    bgColor: 'bg-cyan-900/50',
  },
  work: {
    icon: Briefcase,
    label: '仕事',
    color: '#64748b',
    bgColor: 'bg-slate-800/50',
  },
  home: {
    icon: Home,
    label: '自宅',
    color: '#3b82f6',
    bgColor: 'bg-blue-900/50',
  },
  other: {
    icon: MapPin,
    label: 'その他',
    color: '#9ca3af',
    bgColor: 'bg-gray-800/50',
  },
};

const sizeStyles = {
  sm: { iconSize: 14, text: 'text-xs', padding: 'px-2 py-1' },
  md: { iconSize: 18, text: 'text-sm', padding: 'px-3 py-1.5' },
};

function CategoryBadgeComponent({ category, showLabel = true, size = 'md' }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  const styles = sizeStyles[size];
  const Icon = config.icon;

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full ${config.bgColor} ${styles.padding}`}
    >
      <Icon size={styles.iconSize} color={config.color} />
      {showLabel && <Text className={`text-gray-300 ${styles.text}`}>{config.label}</Text>}
    </View>
  );
}

export const CategoryBadge = memo(CategoryBadgeComponent);
