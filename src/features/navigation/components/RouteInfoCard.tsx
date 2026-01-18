import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface RouteInfoCardProps {
  destination: string;
  subtitle?: string;
  durationHours: number;
  durationMinutes: number;
  userInitial?: string;
  onUserPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function RouteInfoCardComponent({
  destination,
  subtitle = '提案経由地を含む最適ルート',
  durationHours,
  durationMinutes,
  userInitial = 'T',
  onUserPress,
}: RouteInfoCardProps) {
  const avatarScale = useSharedValue(1);

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} className="mx-4 mt-2">
      <View
        className="bg-white rounded-3xl p-5 flex-row justify-between items-start"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        {/* Left: Route Info */}
        <View className="flex-1 mr-4">
          {/* Destination Label */}
          <View className="flex-row items-center mb-1">
            <View className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
            <Text className="text-xs text-slate-400 font-medium">目</Text>
          </View>

          {/* Destination Name */}
          <Text className="text-xl font-bold text-slate-800 mb-1">{destination}へのルート</Text>

          {/* Subtitle */}
          <Text className="text-sm text-slate-500 mb-4">{subtitle}</Text>

          {/* Duration */}
          <View className="flex-row items-baseline">
            <Text className="text-4xl font-bold text-primary-500">{durationHours}</Text>
            <Text className="text-lg font-medium text-slate-600 ml-0.5">時間</Text>
            <Text className="text-4xl font-bold text-primary-500 ml-1">{durationMinutes}</Text>
            <Text className="text-lg font-medium text-slate-600 ml-0.5">分</Text>
          </View>
        </View>

        {/* Right: User Avatar */}
        <AnimatedPressable
          style={avatarAnimatedStyle}
          onPressIn={() => {
            avatarScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
          }}
          onPressOut={() => {
            avatarScale.value = withSpring(1, { damping: 15, stiffness: 400 });
          }}
          onPress={onUserPress}
          accessibilityRole="button"
          accessibilityLabel="ユーザーメニュー"
          className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center border-2 border-slate-200"
        >
          <Text className="text-lg font-semibold text-slate-600">{userInitial}</Text>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

export const RouteInfoCard = memo(RouteInfoCardComponent);
