import { memo, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Mic } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  FadeInUp,
  cancelAnimation,
} from 'react-native-reanimated';

interface AgentConsultBarProps {
  isListening?: boolean;
  isConnected?: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AgentConsultBarComponent({
  isListening = false,
  isConnected = false,
  onPress,
}: AgentConsultBarProps) {
  const barScale = useSharedValue(1);
  const micScale = useSharedValue(1);
  const indicatorOpacity = useSharedValue(1);

  // Pulsing indicator when listening
  useEffect(() => {
    if (isListening) {
      indicatorOpacity.value = withRepeat(withTiming(0.3, { duration: 800 }), -1, true);
    } else {
      cancelAnimation(indicatorOpacity);
      indicatorOpacity.value = withTiming(1, { duration: 200 });
    }

    return () => {
      cancelAnimation(indicatorOpacity);
    };
  }, [isListening, indicatorOpacity]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: barScale.value }],
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

  return (
    <Animated.View entering={FadeInUp.delay(300).duration(400).springify()} className="mx-4 mb-28">
      <AnimatedPressable
        style={barAnimatedStyle}
        onPressIn={() => {
          barScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
          micScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          barScale.value = withSpring(1, { damping: 15, stiffness: 400 });
          micScale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Agentと相談する"
        accessibilityHint="タップして音声入力を開始"
      >
        <View
          className="bg-white rounded-full flex-row items-center px-5 py-3"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          {/* Mic Icon */}
          <Animated.View
            style={[
              micAnimatedStyle,
              {
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#3b82f6',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}
          >
            <Mic size={22} color="#ffffff" strokeWidth={2} />
          </Animated.View>

          {/* Text Content */}
          <View className="flex-1 ml-4">
            <Text className="text-lg font-semibold text-slate-800">Agentと相談する</Text>
            <Text className="text-sm text-slate-500">
              {isListening ? '聞いています...' : 'タップして話す'}
            </Text>
          </View>

          {/* Status Indicator */}
          <Animated.View
            style={[
              indicatorStyle,
              {
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isListening ? '#ef4444' : isConnected ? '#22c55e' : '#94a3b8',
              },
            ]}
          />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export const AgentConsultBar = memo(AgentConsultBarComponent);
