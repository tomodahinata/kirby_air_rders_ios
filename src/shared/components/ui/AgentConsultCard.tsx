import { Mic } from 'lucide-react-native';
import { memo, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AgentConsultCardProps {
  onPress: () => void;
  isListening?: boolean;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

function AgentConsultCardComponent({
  onPress,
  isListening = false,
  disabled = false,
}: AgentConsultCardProps) {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  // Pulsing animation when listening
  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(0.6, { duration: 800, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0.6, { duration: 300 });
    }
  }, [isListening, pulseOpacity, pulseScale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(100).duration(400).springify()}
      style={[
        cardStyle,
        {
          shadowColor: '#3b82f6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 5,
        },
      ]}
      onPressIn={() => {
        if (!disabled) {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Agentに相談する"
      accessibilityHint="声で行き先を伝えることができます"
      accessibilityState={{ disabled }}
      className={`bg-white rounded-2xl px-5 py-4 flex-row items-center ${disabled ? 'opacity-50' : ''}`}
    >
      {/* Mic Icon with pulse effect */}
      <View className="relative items-center justify-center">
        {/* Pulse ring */}
        <AnimatedView style={pulseStyle} className="absolute w-14 h-14 rounded-full bg-blue-500" />

        {/* Mic button background */}
        <View className="w-14 h-14 rounded-full bg-blue-500 items-center justify-center z-10">
          <Mic size={28} color="#fff" strokeWidth={2} />
        </View>
      </View>

      {/* Text content */}
      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold text-slate-800">Agentに相談する</Text>
        <Text className="text-base text-slate-500 mt-0.5">声で行き先を伝える</Text>
      </View>
    </AnimatedPressable>
  );
}

export const AgentConsultCard = memo(AgentConsultCardComponent);
