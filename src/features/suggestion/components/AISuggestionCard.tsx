import { memo, useCallback, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Coffee, GitBranch, Globe, Star, MapPin, Utensils, ShoppingBag } from 'lucide-react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

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
  index?: number;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const iconMap: Record<SuggestionType, ReactNode> = {
  cafe: <Coffee size={28} color="#3B82F6" />,
  detour: <GitBranch size={28} color="#8B5CF6" />,
  restaurant: <Utensils size={28} color="#EF4444" />,
  scenic: <MapPin size={28} color="#10B981" />,
  shopping: <ShoppingBag size={28} color="#F59E0B" />,
};

const typeColorMap: Record<SuggestionType, string> = {
  cafe: '#3B82F6',
  detour: '#8B5CF6',
  restaurant: '#EF4444',
  scenic: '#10B981',
  shopping: '#F59E0B',
};

function AISuggestionCardComponent({
  type,
  title,
  subtitle,
  socialCount,
  rating,
  source,
  isHighlighted = false,
  index = 0,
  onPress,
}: AISuggestionCardProps) {
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  // Scale animation for press
  const scale = useSharedValue(1);

  // Shimmer animation for highlighted cards
  const shimmer = useSharedValue(0);

  // Pulse animation for highlighted cards
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isHighlighted) {
      // Shimmer effect
      shimmer.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      // Subtle pulse
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    }
  }, [isHighlighted, shimmer, pulse]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  const accentColor = typeColorMap[type];

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(index * 100)
        .duration(400)
        .springify()}
      style={cardStyle}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${subtitle}`}
      className="flex-1 overflow-hidden"
    >
      <View
        className={`flex-1 rounded-3xl p-4 min-h-[180px] ${
          isHighlighted
            ? 'bg-amber-50 border-2 border-amber-400'
            : 'bg-white border border-slate-200'
        }`}
        style={{
          shadowColor: isHighlighted ? '#F59E0B' : '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isHighlighted ? 0.2 : 0.08,
          shadowRadius: isHighlighted ? 16 : 12,
          elevation: isHighlighted ? 8 : 4,
        }}
      >
        {/* Shimmer overlay for highlighted cards */}
        {isHighlighted && (
          <Animated.View
            style={shimmerStyle}
            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"
          />
        )}

        {/* Icon with colored background */}
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          {iconMap[type]}
        </View>

        {/* Title */}
        <Text className="text-lg font-bold text-slate-900 mb-1" numberOfLines={2}>
          {title}
        </Text>

        {/* Subtitle */}
        <Text className="text-sm text-slate-500 mb-3" numberOfLines={2}>
          {subtitle}
        </Text>

        {/* Footer with social/rating info */}
        <View className="flex-row items-center gap-3 mt-auto">
          {socialCount !== undefined && (
            <View className="flex-row items-center gap-1 bg-slate-100 rounded-full px-2 py-1">
              <Text className="text-xs font-bold text-slate-600">𝕏</Text>
              <Text className="text-xs text-slate-500">{socialCount}</Text>
            </View>
          )}
          {rating !== undefined && (
            <View className="flex-row items-center gap-1 bg-amber-50 rounded-full px-2 py-1">
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-xs font-semibold text-amber-600">{rating.toFixed(1)}</Text>
            </View>
          )}
          {source === 'web' && (
            <View className="flex-row items-center gap-1 bg-blue-50 rounded-full px-2 py-1">
              <Globe size={12} color="#3B82F6" />
              <Text className="text-xs text-blue-600">ウェブ</Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const AISuggestionCard = memo(AISuggestionCardComponent);
