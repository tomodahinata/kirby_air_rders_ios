import { BlurView } from 'expo-blur';
import { Loader2, Mic, Volume2 } from 'lucide-react-native';
import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type OrbState = 'idle' | 'listening' | 'processing' | 'speaking';

interface GlowingOrbAvatarProps {
  /** Current state of the AI */
  state?: OrbState;
  /** Size of the orb */
  size?: number;
  /** Audio level for visualization (0-1) */
  audioLevel?: number;
}

const STATE_COLORS = {
  idle: { primary: '#94a3b8', glow: 'rgba(148, 163, 184, 0.3)' },
  listening: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
  processing: { primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
  speaking: { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
};

/**
 * Glowing Orb Avatar
 *
 * A beautiful, animated orb that represents the AI assistant.
 * Changes color and animation based on the current state.
 */
function GlowingOrbAvatarComponent({
  state = 'idle',
  size = 120,
  audioLevel = 0,
}: GlowingOrbAvatarProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);

  const colors = STATE_COLORS[state];

  useEffect(() => {
    switch (state) {
      case 'idle':
        // Gentle breathing animation
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        );
        glowOpacity.value = withTiming(0.3, { duration: 300 });
        rotation.value = withTiming(0, { duration: 300 });
        break;

      case 'listening':
        // Reactive to audio
        scale.value = withSpring(1 + audioLevel * 0.2);
        glowOpacity.value = withTiming(0.5 + audioLevel * 0.3, { duration: 100 });
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 600, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 600, easing: Easing.in(Easing.quad) })
          ),
          -1,
          true
        );
        break;

      case 'processing':
        // Spinning animation
        rotation.value = withRepeat(withTiming(360, { duration: 2000, easing: Easing.linear }), -1);
        scale.value = withTiming(0.95, { duration: 300 });
        glowOpacity.value = withRepeat(
          withSequence(withTiming(0.6, { duration: 500 }), withTiming(0.3, { duration: 500 })),
          -1,
          true
        );
        break;

      case 'speaking':
        // Pulsing to speech
        scale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 300, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 300, easing: Easing.in(Easing.quad) })
          ),
          -1,
          true
        );
        glowOpacity.value = withTiming(0.6, { duration: 200 });
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.5, { duration: 400, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 400, easing: Easing.in(Easing.quad) })
          ),
          -1,
          true
        );
        break;
    }
  }, [state, audioLevel, scale, rotation, glowOpacity, pulseScale]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const IconComponent = {
    idle: Mic,
    listening: Mic,
    processing: Loader2,
    speaking: Volume2,
  }[state];

  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          glowStyle,
          {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: size * 0.8,
            backgroundColor: colors.glow,
          },
        ]}
      />

      {/* Inner glow ring */}
      <Animated.View
        style={[
          styles.innerGlow,
          glowStyle,
          {
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: size * 0.65,
            backgroundColor: colors.glow,
          },
        ]}
      />

      {/* Main orb */}
      <Animated.View style={[styles.orbWrapper, orbStyle]}>
        <BlurView
          intensity={40}
          tint="light"
          style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <View
            style={[
              styles.orbInner,
              {
                width: size - 8,
                height: size - 8,
                borderRadius: (size - 8) / 2,
                backgroundColor: colors.primary,
              },
            ]}
          >
            <IconComponent size={size * 0.35} color="#ffffff" strokeWidth={2} />
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
  },
  innerGlow: {
    position: 'absolute',
  },
  orbWrapper: {
    position: 'absolute',
  },
  orb: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  orbInner: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export const GlowingOrbAvatar = memo(GlowingOrbAvatarComponent);
