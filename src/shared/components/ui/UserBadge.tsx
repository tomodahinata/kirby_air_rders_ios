import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface UserBadgeProps {
  name: string;
  initial?: string;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function UserBadgeComponent({ name, initial, onPress }: UserBadgeProps) {
  const scale = useSharedValue(1);
  const userInitial = initial || name.charAt(0).toUpperCase();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      entering={FadeIn.duration(300)}
      style={[
        animatedStyle,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`ユーザー: ${name}`}
      className="flex-row items-center bg-white rounded-full pl-1 pr-4 py-1"
    >
      {/* Avatar */}
      <View className="w-9 h-9 rounded-full bg-primary-500 items-center justify-center mr-2">
        <Text className="text-base font-semibold text-white">{userInitial}</Text>
      </View>

      {/* Name */}
      <Text className="text-base font-medium text-slate-700">{name}</Text>
    </AnimatedPressable>
  );
}

export const UserBadge = memo(UserBadgeComponent);
