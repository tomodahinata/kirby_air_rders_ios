import { memo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Coffee, GitBranch, Globe, Star } from 'lucide-react-native';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type SuggestionType = 'cafe' | 'detour' | 'restaurant' | 'scenic' | 'shopping';

interface AISuggestionCardProps {
  type: SuggestionType;
  title: string;
  subtitle: string;
  socialCount?: number;
  rating?: number;
  source?: 'web' | 'social';
  isHighlighted?: boolean;
  onPress?: () => void;
}

const iconMap: Record<SuggestionType, ReactNode> = {
  cafe: <Coffee size={28} color="#94a3b8" />,
  detour: <GitBranch size={28} color="#94a3b8" />,
  restaurant: <Coffee size={28} color="#94a3b8" />,
  scenic: <GitBranch size={28} color="#94a3b8" />,
  shopping: <Coffee size={28} color="#94a3b8" />,
};

function AISuggestionCardComponent({
  type,
  title,
  subtitle,
  socialCount,
  rating,
  source,
  isHighlighted = false,
  onPress,
}: AISuggestionCardProps) {
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${subtitle}`}
      style={({ pressed }): StyleProp<ViewStyle> => [
        {
          shadowColor: isHighlighted ? '#f59e0b' : '#3b82f6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isHighlighted ? 0.3 : 0.15,
          shadowRadius: 16,
          elevation: isHighlighted ? 8 : 4,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      className={`flex-1 rounded-3xl p-4 min-h-[180px] ${
        isHighlighted
          ? 'bg-amber-900/30 border-2 border-amber-500/50'
          : 'bg-surface-glass border border-slate-600/50'
      }`}
    >
      {/* Icon */}
      <View className="mb-3">{iconMap[type]}</View>

      {/* Title */}
      <Text className="text-car-lg font-bold text-text-primary mb-1" numberOfLines={2}>
        {title}
      </Text>

      {/* Subtitle */}
      <Text className="text-car-base text-text-secondary mb-3">{subtitle}</Text>

      {/* Footer with social/rating info */}
      <View className="flex-row items-center gap-3 mt-auto">
        {socialCount !== undefined && (
          <View className="flex-row items-center gap-1">
            <Text className="text-car-sm font-bold text-text-secondary">𝕏</Text>
            <Text className="text-car-sm text-text-muted">{socialCount}</Text>
          </View>
        )}
        {rating !== undefined && (
          <View className="flex-row items-center gap-1">
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-car-sm font-semibold text-warning">{rating.toFixed(1)}★</Text>
          </View>
        )}
        {source === 'web' && (
          <View className="flex-row items-center gap-1">
            <Globe size={14} color="#94a3b8" />
            <Text className="text-car-sm text-text-muted">Web</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export const AISuggestionCard = memo(AISuggestionCardComponent);
