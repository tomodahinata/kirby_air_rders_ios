import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react-native';

import type { StyleProp, ViewStyle } from 'react-native';

interface VoiceControlBarProps {
  isConnected: boolean;
  isConnecting: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
}

function VoiceControlBarComponent({
  isConnected,
  isConnecting,
  isListening,
  isProcessing,
  isSpeaking,
  currentTranscript,
  onConnect,
  onDisconnect,
  onStartListening,
  onStopListening,
}: VoiceControlBarProps) {
  const getStatusText = () => {
    if (!isConnected) return '会話を開始するには接続してください';
    if (isListening) return currentTranscript || '聞いています...';
    if (isProcessing) return '処理中...';
    if (isSpeaking) return '応答中...';
    return 'タップして話しかけてください';
  };

  return (
    <View
      className="mx-4 mb-6 rounded-2xl p-4 border border-slate-700"
      style={{
        backgroundColor: 'rgba(30, 41, 59, 0.95)', // surface-elevated with transparency
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* ステータステキスト */}
      <Text className="text-car-base text-text-secondary text-center mb-3" numberOfLines={2}>
        {getStatusText()}
      </Text>

      {/* コントロールボタン */}
      <View className="flex-row items-center justify-center gap-4">
        {/* 接続/切断ボタン */}
        <Pressable
          onPress={isConnected ? onDisconnect : onConnect}
          disabled={isConnecting}
          accessibilityRole="button"
          accessibilityLabel={isConnected ? '通話を終了' : '通話を開始'}
          accessibilityState={{ disabled: isConnecting }}
          style={({ pressed }): StyleProp<ViewStyle> => [
            {
              opacity: isConnecting ? 0.5 : pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
          className={`w-14 h-14 rounded-full items-center justify-center ${
            isConnected ? 'bg-error' : 'bg-success'
          }`}
        >
          {isConnected ? (
            <PhoneOff size={24} color="#ffffff" />
          ) : (
            <Phone size={24} color="#ffffff" />
          )}
        </Pressable>

        {/* マイクボタン */}
        <Pressable
          onPress={isListening ? onStopListening : onStartListening}
          disabled={!isConnected || isProcessing || isSpeaking}
          accessibilityRole="button"
          accessibilityLabel={isListening ? 'マイクを停止' : 'マイクを開始'}
          accessibilityState={{ disabled: !isConnected || isProcessing || isSpeaking }}
          style={({ pressed }): StyleProp<ViewStyle> => [
            {
              opacity: !isConnected || isProcessing || isSpeaking ? 0.5 : pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
          className={`w-16 h-16 rounded-full items-center justify-center ${
            isListening ? 'bg-error' : isConnected ? 'bg-primary-600' : 'bg-surface-overlay'
          }`}
        >
          {isListening ? <MicOff size={28} color="#ffffff" /> : <Mic size={28} color="#ffffff" />}
        </Pressable>
      </View>

      {/* ボタンラベル */}
      <View className="flex-row justify-center gap-8 mt-2">
        <Text className="text-car-sm text-text-muted w-14 text-center">
          {isConnected ? '終了' : '開始'}
        </Text>
        <Text className="text-car-sm text-text-muted w-16 text-center">
          {isListening ? '停止' : 'マイク'}
        </Text>
      </View>
    </View>
  );
}

export const VoiceControlBar = memo(VoiceControlBarComponent);
