import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react-native';

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
      className="mx-4 mb-6 rounded-2xl p-4"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* ステータステキスト */}
      <Text className="text-sm text-gray-500 text-center mb-3" numberOfLines={2}>
        {getStatusText()}
      </Text>

      {/* コントロールボタン */}
      <View className="flex-row items-center justify-center gap-4">
        {/* 接続/切断ボタン */}
        <Pressable
          onPress={isConnected ? onDisconnect : onConnect}
          disabled={isConnecting}
          className={`w-14 h-14 rounded-full items-center justify-center ${
            isConnected ? 'bg-red-500' : 'bg-green-500'
          } ${isConnecting ? 'opacity-50' : ''}`}
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
          className={`w-16 h-16 rounded-full items-center justify-center ${
            isListening ? 'bg-red-500' : isConnected ? 'bg-blue-500' : 'bg-gray-300'
          } ${!isConnected || isProcessing || isSpeaking ? 'opacity-50' : ''}`}
        >
          {isListening ? <MicOff size={28} color="#ffffff" /> : <Mic size={28} color="#ffffff" />}
        </Pressable>
      </View>

      {/* ボタンラベル */}
      <View className="flex-row justify-center gap-8 mt-2">
        <Text className="text-xs text-gray-400 w-14 text-center">
          {isConnected ? '終了' : '開始'}
        </Text>
        <Text className="text-xs text-gray-400 w-16 text-center">
          {isListening ? '停止' : 'マイク'}
        </Text>
      </View>
    </View>
  );
}

export const VoiceControlBar = memo(VoiceControlBarComponent);
