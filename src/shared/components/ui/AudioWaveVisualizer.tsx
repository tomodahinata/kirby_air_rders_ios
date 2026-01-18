import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface AudioWaveVisualizerProps {
  /** Audio level from 0 to 1 */
  audioLevel?: number;
  /** Whether the visualization is active */
  isActive?: boolean;
  /** Number of bars in the visualizer */
  barCount?: number;
  /** Primary color */
  color?: string;
  /** Size of the visualizer */
  size?: 'sm' | 'md' | 'lg';
}

const BAR_CONFIG = {
  sm: { width: 3, gap: 2, maxHeight: 24, minHeight: 8 },
  md: { width: 4, gap: 3, maxHeight: 40, minHeight: 12 },
  lg: { width: 5, gap: 4, maxHeight: 56, minHeight: 16 },
};

/**
 * Audio Wave Visualizer
 *
 * Displays animated bars that react to audio input level.
 * Similar to Siri's voice visualization.
 */
function AudioWaveVisualizerComponent({
  audioLevel = 0,
  isActive = false,
  barCount = 5,
  color = '#3b82f6',
  size = 'md',
}: AudioWaveVisualizerProps) {
  const config = BAR_CONFIG[size];

  return (
    <View style={styles.container}>
      {Array.from({ length: barCount }).map((_, index) => (
        <AnimatedBar
          key={index}
          index={index}
          totalBars={barCount}
          audioLevel={audioLevel}
          isActive={isActive}
          color={color}
          config={config}
        />
      ))}
    </View>
  );
}

interface AnimatedBarProps {
  index: number;
  totalBars: number;
  audioLevel: number;
  isActive: boolean;
  color: string;
  config: (typeof BAR_CONFIG)['md'];
}

function AnimatedBar({ index, totalBars, audioLevel, isActive, color, config }: AnimatedBarProps) {
  const heightValue = useSharedValue(config.minHeight);
  const opacityValue = useSharedValue(0.3);

  // Calculate distance from center for wave effect
  const centerIndex = (totalBars - 1) / 2;
  const distanceFromCenter = Math.abs(index - centerIndex);
  const normalizedDistance = distanceFromCenter / centerIndex;

  useEffect(() => {
    if (isActive) {
      // Animate opacity
      opacityValue.value = withTiming(1, { duration: 200 });

      // Create different animation patterns for each bar
      const baseDelay = index * 50;
      const baseDuration = 400 + index * 30;

      // When audio is active, use audio level to influence height
      if (audioLevel > 0.05) {
        const targetHeight =
          config.minHeight +
          (config.maxHeight - config.minHeight) * audioLevel * (1 - normalizedDistance * 0.3);

        heightValue.value = withTiming(targetHeight, {
          duration: 100,
          easing: Easing.out(Easing.quad),
        });
      } else {
        // Idle animation when active but no audio
        heightValue.value = withDelay(
          baseDelay,
          withRepeat(
            withSequence(
              withTiming(config.minHeight + (config.maxHeight - config.minHeight) * 0.4, {
                duration: baseDuration,
                easing: Easing.inOut(Easing.sin),
              }),
              withTiming(config.minHeight, {
                duration: baseDuration,
                easing: Easing.inOut(Easing.sin),
              })
            ),
            -1,
            true
          )
        );
      }
    } else {
      // Inactive state
      opacityValue.value = withTiming(0.3, { duration: 300 });
      heightValue.value = withTiming(config.minHeight, { duration: 300 });
    }
  }, [isActive, audioLevel, index, normalizedDistance, config, heightValue, opacityValue]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: heightValue.value,
      opacity: opacityValue.value,
      backgroundColor: color,
      width: config.width,
      marginHorizontal: config.gap / 2,
      borderRadius: config.width / 2,
    };
  });

  return <Animated.View style={animatedStyle} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const AudioWaveVisualizer = memo(AudioWaveVisualizerComponent);
