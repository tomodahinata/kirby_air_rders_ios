import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { History, Home, ChevronRight } from 'lucide-react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface DestinationOption {
  id: string;
  icon: typeof History;
  label: string;
  iconColor: string;
  iconBgColor: string;
}

interface DestinationBottomSheetProps {
  onHistoryPress: () => void;
  onHomePress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DEFAULT_OPTIONS: DestinationOption[] = [
  {
    id: 'history',
    icon: History,
    label: '履歴から選択',
    iconColor: '#3b82f6',
    iconBgColor: '#eff6ff',
  },
  {
    id: 'home',
    icon: Home,
    label: '自宅へ帰る',
    iconColor: '#22c55e',
    iconBgColor: '#f0fdf4',
  },
];

interface OptionRowProps {
  option: DestinationOption;
  onPress: () => void;
  delay?: number;
}

function OptionRow({ option, onPress, delay = 0 }: OptionRowProps) {
  const scale = useSharedValue(1);
  const Icon = option.icon;

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(delay).duration(300).springify()}
      style={rowStyle}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      className="flex-row items-center py-4 active:bg-slate-50 rounded-xl"
    >
      {/* Icon */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: option.iconBgColor }}
      >
        <Icon size={24} color={option.iconColor} strokeWidth={2} />
      </View>

      {/* Label */}
      <Text className="flex-1 text-lg font-medium text-slate-800 ml-4">{option.label}</Text>

      {/* Chevron */}
      <ChevronRight size={22} color="#94a3b8" strokeWidth={2} />
    </AnimatedPressable>
  );
}

function DestinationBottomSheetComponent({
  onHistoryPress,
  onHomePress,
}: DestinationBottomSheetProps) {
  const handleOptionPress = (optionId: string) => {
    if (optionId === 'history') {
      onHistoryPress();
    } else if (optionId === 'home') {
      onHomePress();
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(200).duration(400).springify()}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 10,
      }}
      className="bg-white rounded-t-3xl pt-3 pb-28 px-5"
    >
      {/* Drag Handle */}
      <View className="items-center mb-4">
        <View className="w-10 h-1 bg-slate-300 rounded-full" />
      </View>

      {/* Options */}
      <View className="space-y-1">
        {DEFAULT_OPTIONS.map((option, index) => (
          <OptionRow
            key={option.id}
            option={option}
            onPress={() => handleOptionPress(option.id)}
            delay={250 + index * 100}
          />
        ))}
      </View>
    </Animated.View>
  );
}

export const DestinationBottomSheet = memo(DestinationBottomSheetComponent);
