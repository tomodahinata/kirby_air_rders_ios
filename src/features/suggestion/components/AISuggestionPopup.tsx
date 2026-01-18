import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sparkles, MapPin, Coffee, Fuel, Camera } from 'lucide-react-native';
import Animated, {
  SlideInLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

type SuggestionType = 'scenic' | 'rest' | 'cafe' | 'gas' | 'photo';

interface AISuggestionPopupProps {
  type: SuggestionType;
  title: string;
  description: string;
  onAdd: () => void;
  onDetails: () => void;
  onDismiss?: () => void;
}

const ICON_CONFIG: Record<
  SuggestionType,
  { icon: typeof Sparkles; bgColor: string; iconColor: string }
> = {
  scenic: { icon: Sparkles, bgColor: '#f3e8ff', iconColor: '#a855f7' },
  rest: { icon: MapPin, bgColor: '#dbeafe', iconColor: '#3b82f6' },
  cafe: { icon: Coffee, bgColor: '#fef3c7', iconColor: '#f59e0b' },
  gas: { icon: Fuel, bgColor: '#fee2e2', iconColor: '#ef4444' },
  photo: { icon: Camera, bgColor: '#d1fae5', iconColor: '#10b981' },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AISuggestionPopupComponent({
  type,
  title,
  description,
  onAdd,
  onDetails,
}: AISuggestionPopupProps) {
  const config = ICON_CONFIG[type];
  const Icon = config.icon;

  const addButtonScale = useSharedValue(1);
  const detailsButtonScale = useSharedValue(1);

  const addButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const detailsButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: detailsButtonScale.value }],
  }));

  return (
    <Animated.View entering={SlideInLeft.duration(400).springify()} className="mx-4">
      <View
        className="bg-white rounded-3xl p-5"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 10,
        }}
      >
        {/* Header with Icon */}
        <View className="flex-row items-start mb-3">
          {/* Icon Container */}
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
            style={{ backgroundColor: config.bgColor }}
          >
            <Icon size={24} color={config.iconColor} strokeWidth={2} />
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-800 mb-1">{title}</Text>
            <Text className="text-sm text-slate-500 leading-5">{description}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-2">
          {/* Add Button */}
          <AnimatedPressable
            style={[
              addButtonStyle,
              {
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}
            onPressIn={() => {
              addButtonScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
              addButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel="ルートに追加"
            className="flex-1 bg-primary-500 rounded-2xl py-3.5 items-center justify-center"
          >
            <Text className="text-base font-semibold text-white">追加</Text>
          </AnimatedPressable>

          {/* Details Button */}
          <AnimatedPressable
            style={detailsButtonStyle}
            onPressIn={() => {
              detailsButtonScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
              detailsButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            onPress={onDetails}
            accessibilityRole="button"
            accessibilityLabel="詳細を見る"
            className="flex-1 bg-white rounded-2xl py-3.5 items-center justify-center border border-slate-200"
          >
            <Text className="text-base font-semibold text-slate-700">詳細を見る</Text>
          </AnimatedPressable>
        </View>
      </View>
    </Animated.View>
  );
}

export const AISuggestionPopup = memo(AISuggestionPopupComponent);
