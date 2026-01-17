import { memo, useEffect, useRef } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';

interface VoiceListeningBarProps {
  isListening?: boolean;
  onPress?: () => void;
}

function WaveformBars() {
  const bars = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.7)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.8)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.4)).current,
  ];

  useEffect(() => {
    const animations = bars.map((bar, index) => {
      const randomDuration = 300 + Math.random() * 400;
      const randomDelay = index * 50;

      return Animated.loop(
        Animated.sequence([
          Animated.delay(randomDelay),
          Animated.timing(bar, {
            toValue: 0.2 + Math.random() * 0.8,
            duration: randomDuration,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.3 + Math.random() * 0.4,
            duration: randomDuration,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, []);

  return (
    <View className="flex-row items-center gap-[3px] h-6">
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          className="w-[3px] rounded-full bg-gray-400"
          style={{
            transform: [{ scaleY: bar }],
            height: 20,
          }}
        />
      ))}
    </View>
  );
}

function VoiceListeningBarComponent({ isListening = true, onPress }: VoiceListeningBarProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-8 rounded-full px-6 py-4 flex-row items-center justify-center gap-4"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
      }}
    >
      {isListening && <WaveformBars />}
      <Text className="text-base font-medium text-gray-600">
        {isListening ? 'Listening...' : 'Tap to speak'}
      </Text>
    </Pressable>
  );
}

export const VoiceListeningBar = memo(VoiceListeningBarComponent);
