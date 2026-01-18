import { memo, useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Car } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  showIcon?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CircularProgressComponent({
  progress,
  size = 240,
  strokeWidth = 8,
  showPercentage = true,
  showIcon = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (circumference * animatedProgress.value) / 100;
    return {
      strokeDashoffset,
    };
  });

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG Progress Ring */}
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress Circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>

      {/* Center Content */}
      <View className="absolute items-center justify-center">
        {showIcon && (
          <View className="mb-2">
            <Car size={40} color="#64748b" strokeWidth={1.5} />
          </View>
        )}
        {showPercentage && (
          <Text className="text-5xl font-bold text-slate-800">{Math.round(progress)}%</Text>
        )}
      </View>
    </View>
  );
}

export const CircularProgress = memo(CircularProgressComponent);
