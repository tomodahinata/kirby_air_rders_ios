import { memo } from 'react';
import { Pressable, Text } from 'react-native';
import {
  TrendingUp,
  Fuel,
  Utensils,
  Coffee,
  ParkingCircle,
  type LucideIcon,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInRight,
} from 'react-native-reanimated';

type ChipType = 'trend' | 'gas' | 'restaurant' | 'cafe' | 'parking' | 'custom';

interface QuickActionChipProps {
  type: ChipType;
  label: string;
  onPress: () => void;
  index?: number;
  customIcon?: LucideIcon;
}

const ICON_MAP: Record<Exclude<ChipType, 'custom'>, LucideIcon> = {
  trend: TrendingUp,
  gas: Fuel,
  restaurant: Utensils,
  cafe: Coffee,
  parking: ParkingCircle,
};

const ICON_COLORS: Record<ChipType, string> = {
  trend: '#3b82f6',
  gas: '#f59e0b',
  restaurant: '#ef4444',
  cafe: '#8b5cf6',
  parking: '#10b981',
  custom: '#64748b',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function QuickActionChipComponent({
  type,
  label,
  onPress,
  index = 0,
  customIcon,
}: QuickActionChipProps) {
  const scale = useSharedValue(1);

  const Icon = type === 'custom' ? (customIcon ?? TrendingUp) : ICON_MAP[type];
  const iconColor = ICON_COLORS[type];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      entering={FadeInRight.delay(index * 80)
        .duration(400)
        .springify()}
      style={[
        animatedStyle,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-slate-100"
    >
      <Icon size={18} color={iconColor} strokeWidth={2} />
      <Text className="ml-2 text-[15px] font-medium text-slate-700">{label}</Text>
    </AnimatedPressable>
  );
}

export const QuickActionChip = memo(QuickActionChipComponent);
