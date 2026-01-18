import { memo, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';

interface PulsingMicButtonProps {
  isListening: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  size?: 'default' | 'large';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PulsingMicButtonComponent({
  isListening,
  isDisabled = false,
  onPress,
  size = 'default',
}: PulsingMicButtonProps) {
  // Animation values
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const pulse3 = useSharedValue(1);
  const pulse4 = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  // Ring sizes based on size prop
  const ringConfig =
    size === 'large'
      ? { ring1: 280, ring2: 230, ring3: 180, ring4: 140, core: 100 }
      : { ring1: 240, ring2: 195, ring3: 155, ring4: 120, core: 85 };

  // Start pulsing animation when listening
  useEffect(() => {
    if (isListening) {
      // Staggered pulse animations for each ring
      pulse1.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      pulse2.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      pulse3.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      pulse4.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Reset animations
      cancelAnimation(pulse1);
      cancelAnimation(pulse2);
      cancelAnimation(pulse3);
      cancelAnimation(pulse4);
      pulse1.value = withTiming(1, { duration: 300 });
      pulse2.value = withTiming(1, { duration: 300 });
      pulse3.value = withTiming(1, { duration: 300 });
      pulse4.value = withTiming(1, { duration: 300 });
    }

    return () => {
      cancelAnimation(pulse1);
      cancelAnimation(pulse2);
      cancelAnimation(pulse3);
      cancelAnimation(pulse4);
    };
  }, [isListening, pulse1, pulse2, pulse3, pulse4]);

  // Animated styles for each ring
  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: interpolate(pulse1.value, [1, 1.08], [0.6, 0.4]),
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: interpolate(pulse2.value, [1, 1.06], [0.7, 0.5]),
  }));

  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse3.value }],
    opacity: interpolate(pulse3.value, [1, 1.05], [0.8, 0.6]),
  }));

  const ring4Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse4.value }],
    opacity: interpolate(pulse4.value, [1, 1.04], [0.9, 0.7]),
  }));

  // Button press animation
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <View
      className="items-center justify-center"
      style={{ width: ringConfig.ring1, height: ringConfig.ring1 }}
    >
      {/* Ring 1 - Outermost */}
      <Animated.View
        style={[
          ring1Style,
          {
            position: 'absolute',
            width: ringConfig.ring1,
            height: ringConfig.ring1,
            borderRadius: ringConfig.ring1 / 2,
            backgroundColor: 'rgba(59, 130, 246, 0.06)',
          },
        ]}
      />

      {/* Ring 2 */}
      <Animated.View
        style={[
          ring2Style,
          {
            position: 'absolute',
            width: ringConfig.ring2,
            height: ringConfig.ring2,
            borderRadius: ringConfig.ring2 / 2,
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
          },
        ]}
      />

      {/* Ring 3 */}
      <Animated.View
        style={[
          ring3Style,
          {
            position: 'absolute',
            width: ringConfig.ring3,
            height: ringConfig.ring3,
            borderRadius: ringConfig.ring3 / 2,
            backgroundColor: 'rgba(59, 130, 246, 0.22)',
          },
        ]}
      />

      {/* Ring 4 - Innermost ring */}
      <Animated.View
        style={[
          ring4Style,
          {
            position: 'absolute',
            width: ringConfig.ring4,
            height: ringConfig.ring4,
            borderRadius: ringConfig.ring4 / 2,
            backgroundColor: 'rgba(147, 197, 253, 0.6)',
          },
        ]}
      />

      {/* Core button */}
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={isListening ? 'マイクを停止' : 'マイクを開始'}
        accessibilityState={{ disabled: isDisabled }}
        style={[
          buttonAnimatedStyle,
          {
            width: ringConfig.core,
            height: ringConfig.core,
            borderRadius: ringConfig.core / 2,
            backgroundColor: '#3b82f6',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
      >
        <Mic size={size === 'large' ? 36 : 32} color="#ffffff" strokeWidth={2} />
      </AnimatedPressable>
    </View>
  );
}

export const PulsingMicButton = memo(PulsingMicButtonComponent);
