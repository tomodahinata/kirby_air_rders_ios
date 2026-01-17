import { memo, useCallback } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Star } from 'lucide-react-native';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { iconSize: 20, gap: 'gap-1', touchSize: 32 },
  md: { iconSize: 28, gap: 'gap-2', touchSize: 44 },
  lg: { iconSize: 36, gap: 'gap-3', touchSize: 52 },
} as const;

const ratingLabels: Record<number, string> = {
  1: 'もう行かない',
  2: 'いまいち',
  3: 'ふつう',
  4: '良かった',
  5: '最高！',
};

function StarRatingComponent({
  value,
  onChange,
  maxStars = 5,
  size = 'md',
  readonly = false,
  showLabel = false,
  className = '',
}: StarRatingProps) {
  const config = sizeConfig[size];

  const handleStarPress = useCallback(
    (rating: number) => {
      if (!readonly && onChange) {
        onChange(rating);
      }
    },
    [readonly, onChange]
  );

  const renderStar = useCallback(
    (index: number) => {
      const starNumber = index + 1;
      const isFilled = starNumber <= value;

      return (
        <Pressable
          key={starNumber}
          onPress={() => handleStarPress(starNumber)}
          disabled={readonly}
          className={`items-center justify-center ${readonly ? '' : 'active:scale-110'}`}
          style={{
            width: config.touchSize,
            height: config.touchSize,
          }}
          accessibilityRole="button"
          accessibilityLabel={`${starNumber}つ星`}
          accessibilityState={{ selected: isFilled }}
        >
          <Star
            size={config.iconSize}
            color={isFilled ? '#f59e0b' : '#d1d5db'}
            fill={isFilled ? '#f59e0b' : 'transparent'}
            strokeWidth={2}
          />
        </Pressable>
      );
    },
    [value, config, handleStarPress, readonly]
  );

  return (
    <View className={className}>
      <View className={`flex-row items-center ${config.gap}`}>
        {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
      </View>
      {showLabel && value > 0 && (
        <Text className="text-sm text-gray-600 mt-1 text-center">{ratingLabels[value]}</Text>
      )}
    </View>
  );
}

export const StarRating = memo(StarRatingComponent);
