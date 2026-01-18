import { memo, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, X, Square } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { PulsingMicButton } from '@/shared/components/ui/PulsingMicButton';
import { VoiceStatusBadge } from '@/shared/components/ui/VoiceStatusBadge';
import { QuickActionChip } from '@/shared/components/ui/QuickActionChip';
import { TranscriptDisplay } from './TranscriptDisplay';

type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking';

interface QuickAction {
  id: string;
  type: 'trend' | 'gas' | 'restaurant' | 'cafe' | 'parking' | 'custom';
  label: string;
}

interface VoiceInputScreenProps {
  isVisible: boolean;
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onCancel: () => void;
  onKeyboardInput?: () => void;
  onQuickAction?: (actionId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'trend', type: 'trend', label: 'トレンド' },
  { id: 'gas', type: 'gas', label: 'ガソリンスタンド' },
  { id: 'restaurant', type: 'restaurant', label: 'レストラン' },
  { id: 'cafe', type: 'cafe', label: 'カフェ' },
];

function VoiceInputScreenComponent({
  isVisible,
  isConnected,
  isListening,
  isProcessing,
  isSpeaking,
  currentTranscript,
  onStartListening,
  onStopListening,
  onCancel,
  onKeyboardInput,
  onQuickAction,
}: VoiceInputScreenProps) {
  // Determine current status
  const status: VoiceStatus = useMemo(() => {
    if (!isConnected) return 'idle';
    if (isSpeaking) return 'speaking';
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  }, [isConnected, isListening, isProcessing, isSpeaking]);

  // Extract keywords from transcript for highlighting
  const keywords = useMemo(() => {
    if (!currentTranscript) return [];
    // Simple extraction: words that look like destinations or key terms
    const words = currentTranscript.split(/[\s、。への]+/).filter((w) => w.length >= 2);
    return words.slice(0, 3);
  }, [currentTranscript]);

  // Handle mic button press
  const handleMicPress = useCallback(() => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  }, [isListening, onStartListening, onStopListening]);

  // Animation for control buttons
  const stopButtonScale = useSharedValue(1);
  const cancelButtonScale = useSharedValue(1);
  const keyboardButtonScale = useSharedValue(1);

  const stopButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stopButtonScale.value }],
  }));

  const cancelButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelButtonScale.value }],
  }));

  const keyboardButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: keyboardButtonScale.value }],
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <View className="absolute inset-0 bg-slate-50">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 justify-between py-4">
          {/* Top Section - Status Badge */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400).springify()}
            className="items-center pt-8"
          >
            <VoiceStatusBadge status={status} />
          </Animated.View>

          {/* Middle Section - Transcript & Mic Button */}
          <View className="flex-1 justify-center items-center">
            {/* Transcript Display */}
            {currentTranscript ? (
              <Animated.View entering={FadeIn.duration(300)} className="mb-10">
                <TranscriptDisplay
                  transcript={currentTranscript}
                  keywords={keywords}
                  isSearching={isProcessing}
                />
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(300)} className="mb-10 px-6">
                <Text className="text-[22px] text-slate-400 text-center font-medium">
                  {isListening ? '話しかけてください...' : 'タップして話しかける'}
                </Text>
              </Animated.View>
            )}

            {/* Pulsing Mic Button */}
            <Animated.View entering={FadeInUp.delay(200).duration(500).springify()}>
              <PulsingMicButton
                isListening={isListening}
                isDisabled={!isConnected || isProcessing || isSpeaking}
                onPress={handleMicPress}
                size="large"
              />
            </Animated.View>
          </View>

          {/* Bottom Section - Quick Actions & Controls */}
          <View className="px-4">
            {/* Quick Action Chips */}
            <Animated.View entering={FadeInUp.delay(300).duration(400)} className="mb-6">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
              >
                {DEFAULT_QUICK_ACTIONS.map((action, index) => (
                  <QuickActionChip
                    key={action.id}
                    type={action.type}
                    label={action.label}
                    index={index}
                    onPress={() => onQuickAction?.(action.id)}
                  />
                ))}
              </ScrollView>
            </Animated.View>

            {/* Control Bar */}
            <Animated.View
              entering={FadeInUp.delay(400).duration(400)}
              className="flex-row items-center justify-center gap-8 pb-4"
            >
              {/* Keyboard Input Button */}
              <AnimatedPressable
                style={keyboardButtonStyle}
                onPressIn={() => {
                  keyboardButtonScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                  keyboardButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
                onPress={onKeyboardInput}
                accessibilityRole="button"
                accessibilityLabel="キーボード入力"
                className="items-center"
              >
                <View className="w-14 h-14 rounded-full bg-white items-center justify-center border border-slate-200">
                  <Keyboard size={24} color="#64748b" strokeWidth={1.5} />
                </View>
                <Text className="text-[13px] text-slate-500 mt-2">キーボード入力</Text>
              </AnimatedPressable>

              {/* Stop Button */}
              <AnimatedPressable
                style={stopButtonStyle}
                onPressIn={() => {
                  stopButtonScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                  stopButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
                onPress={onStopListening}
                disabled={!isListening}
                accessibilityRole="button"
                accessibilityLabel="停止"
                className="items-center"
              >
                <View
                  className="w-[72px] h-[72px] rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isListening
                      ? 'rgba(254, 202, 202, 0.8)'
                      : 'rgba(241, 245, 249, 0.8)',
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor: isListening ? '#ef4444' : '#cbd5e1',
                    }}
                  >
                    <Square size={18} color="#ffffff" fill="#ffffff" />
                  </View>
                </View>
                <Text className="text-[13px] text-slate-500 mt-2">停止</Text>
              </AnimatedPressable>

              {/* Cancel Button */}
              <AnimatedPressable
                style={cancelButtonStyle}
                onPressIn={() => {
                  cancelButtonScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                  cancelButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel="キャンセル"
                className="items-center"
              >
                <View className="w-14 h-14 rounded-full bg-white items-center justify-center border border-slate-200">
                  <X size={24} color="#64748b" strokeWidth={1.5} />
                </View>
                <Text className="text-[13px] text-slate-500 mt-2">キャンセル</Text>
              </AnimatedPressable>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export const VoiceInputScreen = memo(VoiceInputScreenComponent);
