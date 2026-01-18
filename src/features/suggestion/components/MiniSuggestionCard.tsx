import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface MiniSuggestionCardProps {
  label: string;
  message: string;
  onAdd: () => void;
  onDetails: () => void;
  labelColor?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MiniSuggestionCardComponent({
  label,
  message,
  onAdd,
  onDetails,
  labelColor = '#3b82f6',
}: MiniSuggestionCardProps) {
  const cardScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(200).duration(300)} style={cardStyle}>
      <Pressable
        onPressIn={() => {
          cardScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          cardScale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
      >
        <View
          className="bg-white rounded-2xl px-4 py-3 min-w-[180px]"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {/* Label */}
          <Text className="text-xs font-semibold mb-1" style={{ color: labelColor }}>
            {label}
          </Text>

          {/* Message */}
          <Text className="text-sm text-slate-700 mb-2" numberOfLines={2}>
            {message}
          </Text>

          {/* Action Links */}
          <View className="flex-row items-center">
            <AnimatedPressable
              onPress={onAdd}
              accessibilityRole="button"
              accessibilityLabel="追加"
              className="mr-3"
            >
              <Text className="text-sm font-semibold text-primary-500">追加</Text>
            </AnimatedPressable>

            <View className="w-px h-3 bg-slate-300 mr-3" />

            <AnimatedPressable
              onPress={onDetails}
              accessibilityRole="button"
              accessibilityLabel="詳細"
            >
              <Text className="text-sm font-medium text-slate-500">詳細</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const MiniSuggestionCard = memo(MiniSuggestionCardComponent);
