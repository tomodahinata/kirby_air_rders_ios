import { memo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Coffee, GitBranch, Globe, Star } from 'lucide-react-native';

import type { ReactNode } from 'react';

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
  cafe: <Coffee size={28} color="#78716c" />,
  detour: <GitBranch size={28} color="#78716c" />,
  restaurant: <Coffee size={28} color="#78716c" />,
  scenic: <GitBranch size={28} color="#78716c" />,
  shopping: <Coffee size={28} color="#78716c" />,
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
      className={`flex-1 rounded-3xl p-4 min-h-[180px] ${
        isHighlighted ? 'bg-orange-50 border-2 border-orange-200' : 'bg-white/80'
      } active:scale-[0.98] active:opacity-90`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isHighlighted ? 0.1 : 0.06,
        shadowRadius: 16,
        elevation: isHighlighted ? 5 : 3,
      }}
    >
      {/* Icon */}
      <View className="mb-3">{iconMap[type]}</View>

      {/* Title */}
      <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
        {title}
      </Text>

      {/* Subtitle */}
      <Text className="text-sm text-gray-500 mb-3">{subtitle}</Text>

      {/* Footer with social/rating info */}
      <View className="flex-row items-center gap-3 mt-auto">
        {socialCount !== undefined && (
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-bold text-gray-700">𝕏</Text>
            <Text className="text-sm text-gray-600">{socialCount}</Text>
          </View>
        )}
        {rating !== undefined && (
          <View className="flex-row items-center gap-1">
            <Star size={14} color="#1a1a1a" fill="#1a1a1a" />
            <Text className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}★</Text>
          </View>
        )}
        {source === 'web' && (
          <View className="flex-row items-center gap-1">
            <Globe size={14} color="#6b7280" />
            <Text className="text-sm text-gray-500">Web</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export const AISuggestionCard = memo(AISuggestionCardComponent);
