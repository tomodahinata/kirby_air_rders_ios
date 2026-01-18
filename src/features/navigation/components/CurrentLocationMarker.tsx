import { memo, useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from 'react-native-reanimated';

interface CurrentLocationMarkerProps {
  locationName?: string;
  showLabel?: boolean;
}

function CurrentLocationMarkerComponent({
  locationName = '現在地',
  showLabel = true,
}: CurrentLocationMarkerProps) {
  // Pulse animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0.4, { duration: 0 })
      ),
      -1,
      false
    );
  }, [pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.duration(300)} className="items-center">
      {/* Marker Container */}
      <View className="items-center justify-center" style={{ width: 80, height: 80 }}>
        {/* Pulse Ring */}
        <Animated.View
          style={[
            pulseStyle,
            {
              position: 'absolute',
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(59, 130, 246, 0.3)',
            },
          ]}
        />

        {/* Outer Circle */}
        <View
          className="absolute items-center justify-center"
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(147, 197, 253, 0.5)',
          }}
        />

        {/* Inner Circle (Core) */}
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#3b82f6',
            borderWidth: 3,
            borderColor: '#ffffff',
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 4,
          }}
        />
      </View>

      {/* Location Label */}
      {showLabel && (
        <View
          className="bg-white rounded-full px-3 py-1.5 mt-1"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text className="text-xs font-medium text-slate-700">{locationName}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export const CurrentLocationMarker = memo(CurrentLocationMarkerComponent);
