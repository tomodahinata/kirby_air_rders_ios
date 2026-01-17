import { memo, useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import type { DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  className?: string;
}

function SkeletonComponent({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className = '',
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#334155', // slate-700 for dark mode
        },
        { opacity },
      ]}
      className={className}
    />
  );
}

export const Skeleton = memo(SkeletonComponent);

// Pre-built skeleton layouts for common patterns
interface SkeletonCardProps {
  className?: string;
}

function SuggestionSkeletonComponent({ className = '' }: SkeletonCardProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading suggestion"
      className={`bg-surface-elevated rounded-2xl p-4 border border-slate-700 ${className}`}
    >
      {/* Score badge */}
      <View className="flex-row justify-between items-start mb-3">
        <Skeleton width={60} height={28} borderRadius={14} />
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>

      {/* Destination name */}
      <Skeleton width="70%" height={28} className="mb-2" />

      {/* Address */}
      <Skeleton width="90%" height={20} className="mb-4" />

      {/* Reason */}
      <Skeleton width="100%" height={48} className="mb-3" />

      {/* Distance and duration */}
      <View className="flex-row gap-4">
        <Skeleton width={100} height={20} />
        <Skeleton width={80} height={20} />
      </View>
    </View>
  );
}

export const SuggestionSkeleton = memo(SuggestionSkeletonComponent);

// AI Thinking indicator skeleton
function AIThinkingSkeletonComponent({ className = '' }: SkeletonCardProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="AI is thinking"
      className={`flex-row items-center gap-2 p-4 ${className}`}
    >
      <View className="flex-row gap-1">
        <Skeleton width={8} height={8} borderRadius={4} />
        <Skeleton width={8} height={8} borderRadius={4} />
        <Skeleton width={8} height={8} borderRadius={4} />
      </View>
      <Skeleton width={120} height={16} borderRadius={8} />
    </View>
  );
}

export const AIThinkingSkeleton = memo(AIThinkingSkeletonComponent);
