import { memo } from 'react';
import { Pressable } from 'react-native';
import { Navigation } from 'lucide-react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface LocationTargetButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LocationTargetButtonComponent({ onPress, disabled = false }: LocationTargetButtonProps) {
  const scale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      entering={FadeIn.delay(300).duration(300)}
      style={[
        buttonStyle,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        },
      ]}
      onPressIn={() => {
        if (!disabled) {
          scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="現在地に移動"
      accessibilityHint="マップを現在地に移動します"
      accessibilityState={{ disabled }}
      className={`w-14 h-14 rounded-full bg-white items-center justify-center ${disabled ? 'opacity-50' : ''}`}
    >
      <Navigation size={24} color="#3b82f6" strokeWidth={2} />
    </AnimatedPressable>
  );
}

export const LocationTargetButton = memo(LocationTargetButtonComponent);
