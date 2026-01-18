import { memo, useCallback, useMemo, useState } from 'react';
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

import { VoiceStatusBadge } from '@/shared/components/ui/VoiceStatusBadge';
import { QuickActionChip } from '@/shared/components/ui/QuickActionChip';
import { GlowingOrbAvatar } from '@/shared/components/ui/GlowingOrbAvatar';
import { AudioWaveVisualizer } from '@/shared/components/ui/AudioWaveVisualizer';
import { ReconnectingOverlay } from '@/shared/components/ui/ReconnectingOverlay';
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
  isConnecting?: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  audioLevel?: number;
  retryAttempt?: number;
  maxRetries?: number;
  onStartListening: () => void;
  onStopListening: () => void;
  onCancel: () => void;
  onReconnect?: () => void;
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
  isConnecting = false,
  isListening,
  isProcessing,
  isSpeaking,
  currentTranscript,
  audioLevel = 0,
  retryAttempt = 0,
  maxRetries = 3,
  onStartListening,
  onStopListening,
  onCancel,
  onReconnect,
  onKeyboardInput,
  onQuickAction,
}: VoiceInputScreenProps) {
  const [showReconnectOverlay, setShowReconnectOverlay] = useState(false);

  // Determine current status
  const status: VoiceStatus = useMemo(() => {
    if (isConnecting) return 'connecting';
    if (!isConnected) return 'idle';
    if (isSpeaking) return 'speaking';
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  }, [isConnected, isConnecting, isListening, isProcessing, isSpeaking]);

  // Map status to orb state
  const orbState = useMemo(() => {
    switch (status) {
      case 'listening':
        return 'listening';
      case 'processing':
        return 'processing';
      case 'speaking':
        return 'speaking';
      default:
        return 'idle';
    }
  }, [status]);

  // Extract keywords from transcript for highlighting
  const keywords = useMemo(() => {
    if (!currentTranscript) return [];
    const words = currentTranscript.split(/[\s、。への]+/).filter((w) => w.length >= 2);
    return words.slice(0, 3);
  }, [currentTranscript]);

  // Handle orb/mic press
  const handleOrbPress = useCallback(() => {
    if (!isConnected) {
      setShowReconnectOverlay(true);
      return;
    }
    if (isListening) {
      onStopListening();
    } else if (!isProcessing && !isSpeaking) {
      onStartListening();
    }
  }, [isConnected, isListening, isProcessing, isSpeaking, onStartListening, onStopListening]);

  // Handle reconnect
  const handleReconnect = useCallback(() => {
    setShowReconnectOverlay(false);
    onReconnect?.();
  }, [onReconnect]);

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

  // Status message based on current state
  const statusMessage = useMemo(() => {
    if (!isConnected && !isConnecting) return 'タップして接続';
    if (isConnecting) return '接続中...';
    if (isSpeaking) return 'AIが話しています...';
    if (isProcessing) return '考えています...';
    if (isListening) return '聞いています...';
    return 'タップして話しかける';
  }, [isConnected, isConnecting, isListening, isProcessing, isSpeaking]);

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
            className="items-center pt-4"
          >
            <VoiceStatusBadge status={status} />
          </Animated.View>

          {/* Middle Section - AI Orb & Audio Visualization */}
          <View className="flex-1 justify-center items-center">
            {/* Transcript Display */}
            {currentTranscript ? (
              <Animated.View entering={FadeIn.duration(300)} className="mb-8 px-6">
                <TranscriptDisplay
                  transcript={currentTranscript}
                  keywords={keywords}
                  isSearching={isProcessing}
                />
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(300)} className="mb-8 px-6">
                <Text className="text-xl text-slate-400 text-center font-medium">
                  {statusMessage}
                </Text>
              </Animated.View>
            )}

            {/* Glowing Orb Avatar - Central AI Presence */}
            <Animated.View entering={FadeInUp.delay(200).duration(500).springify()}>
              <Pressable
                onPress={handleOrbPress}
                accessibilityRole="button"
                accessibilityLabel={isListening ? '録音を停止' : '話しかける'}
                accessibilityHint="タップしてAIと会話を開始"
              >
                <GlowingOrbAvatar state={orbState} size={160} audioLevel={audioLevel} />
              </Pressable>
            </Animated.View>

            {/* Audio Wave Visualizer - Shows audio feedback */}
            <Animated.View entering={FadeIn.delay(400).duration(400)} className="mt-8">
              <AudioWaveVisualizer
                audioLevel={audioLevel}
                isActive={isListening || isSpeaking}
                barCount={12}
                size="lg"
                color={isSpeaking ? '#8B5CF6' : '#3B82F6'}
              />
            </Animated.View>

            {/* Mic indicator for listening state */}
            {isListening && (
              <Animated.View entering={FadeIn.duration(200)} className="mt-4 flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                <Text className="text-sm text-slate-500">録音中</Text>
              </Animated.View>
            )}
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
                <View className="w-14 h-14 rounded-full bg-white items-center justify-center border border-slate-200 shadow-sm">
                  <Keyboard size={24} color="#64748b" strokeWidth={1.5} />
                </View>
                <Text className="text-xs text-slate-500 mt-2">キーボード</Text>
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
                  className="w-16 h-16 rounded-full items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: isListening
                      ? 'rgba(254, 202, 202, 0.9)'
                      : 'rgba(241, 245, 249, 0.9)',
                  }}
                >
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{
                      backgroundColor: isListening ? '#ef4444' : '#cbd5e1',
                    }}
                  >
                    <Square size={16} color="#ffffff" fill="#ffffff" />
                  </View>
                </View>
                <Text className="text-xs text-slate-500 mt-2">停止</Text>
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
                <View className="w-14 h-14 rounded-full bg-white items-center justify-center border border-slate-200 shadow-sm">
                  <X size={24} color="#64748b" strokeWidth={1.5} />
                </View>
                <Text className="text-xs text-slate-500 mt-2">キャンセル</Text>
              </AnimatedPressable>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>

      {/* Reconnecting Overlay */}
      <ReconnectingOverlay
        isVisible={showReconnectOverlay || (!isConnected && isConnecting)}
        status={isConnecting ? 'reconnecting' : 'disconnected'}
        retryAttempt={retryAttempt}
        maxRetries={maxRetries}
        onReconnect={handleReconnect}
        onCancel={() => {
          setShowReconnectOverlay(false);
          onCancel();
        }}
      />
    </View>
  );
}

export const VoiceInputScreen = memo(VoiceInputScreenComponent);
