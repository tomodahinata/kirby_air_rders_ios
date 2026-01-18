import { memo, useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  cancelAnimation,
} from 'react-native-reanimated';

type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking';

interface VoiceStatusBadgeProps {
  status: VoiceStatus;
}

const STATUS_CONFIG: Record<VoiceStatus, { text: string; showAnimation: boolean }> = {
  idle: { text: '待機中', showAnimation: false },
  connecting: { text: '接続中...', showAnimation: true },
  listening: { text: 'Agentが聞いています...', showAnimation: true },
  processing: { text: '処理中...', showAnimation: true },
  speaking: { text: 'Agentが話しています...', showAnimation: true },
};

function VoiceStatusBadgeComponent({ status }: VoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  // Animation for the bars
  const bar1Height = useSharedValue(8);
  const bar2Height = useSharedValue(12);
  const bar3Height = useSharedValue(6);

  useEffect(() => {
    if (config.showAnimation) {
      bar1Height.value = withRepeat(
        withSequence(withTiming(14, { duration: 300 }), withTiming(6, { duration: 300 })),
        -1,
        true
      );

      bar2Height.value = withRepeat(
        withSequence(withTiming(8, { duration: 250 }), withTiming(16, { duration: 250 })),
        -1,
        true
      );

      bar3Height.value = withRepeat(
        withSequence(withTiming(12, { duration: 350 }), withTiming(4, { duration: 350 })),
        -1,
        true
      );
    } else {
      cancelAnimation(bar1Height);
      cancelAnimation(bar2Height);
      cancelAnimation(bar3Height);
      bar1Height.value = withTiming(8, { duration: 200 });
      bar2Height.value = withTiming(12, { duration: 200 });
      bar3Height.value = withTiming(6, { duration: 200 });
    }

    return () => {
      cancelAnimation(bar1Height);
      cancelAnimation(bar2Height);
      cancelAnimation(bar3Height);
    };
  }, [config.showAnimation, bar1Height, bar2Height, bar3Height]);

  const bar1Style = useAnimatedStyle(() => ({
    height: bar1Height.value,
  }));

  const bar2Style = useAnimatedStyle(() => ({
    height: bar2Height.value,
  }));

  const bar3Style = useAnimatedStyle(() => ({
    height: bar3Height.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="flex-row items-center bg-white rounded-full px-4 py-2.5"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Animated Bars Icon */}
      <View className="flex-row items-end gap-0.5 mr-2 h-4">
        <Animated.View
          style={[bar1Style, { width: 3, backgroundColor: '#3b82f6', borderRadius: 1.5 }]}
        />
        <Animated.View
          style={[bar2Style, { width: 3, backgroundColor: '#3b82f6', borderRadius: 1.5 }]}
        />
        <Animated.View
          style={[bar3Style, { width: 3, backgroundColor: '#3b82f6', borderRadius: 1.5 }]}
        />
      </View>

      <Text className="text-sm font-medium text-slate-600">{config.text}</Text>
    </Animated.View>
  );
}

export const VoiceStatusBadge = memo(VoiceStatusBadgeComponent);
