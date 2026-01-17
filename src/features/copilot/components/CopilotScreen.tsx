import { useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/shared/components/layout/Header';
import { CurrentContextCard } from '@/features/navigation/components/CurrentContextCard';
import { AISuggestionCard } from '@/features/suggestion/components/AISuggestionCard';
import {
  useVoiceChat,
  ConnectionBadge,
  ConversationItem,
  VoiceControlBar,
} from '@/features/voice-chat';

export function CopilotScreen() {
  const {
    conversationHistory,
    currentTranscript,
    error,
    isConnected,
    isConnecting,
    isListening,
    isProcessing,
    isSpeaking,
    connect,
    disconnect,
    startListening,
    stopListening,
    clearError,
  } = useVoiceChat({
    onError: (err) => {
      Alert.alert('エラー', err.message);
    },
  });

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch {
      Alert.alert('接続エラー', 'サーバーに接続できませんでした');
    }
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleStartListening = useCallback(async () => {
    try {
      await startListening();
    } catch {
      Alert.alert('録音エラー', 'マイクにアクセスできませんでした');
    }
  }, [startListening]);

  const handleStopListening = useCallback(async () => {
    try {
      await stopListening();
    } catch {
      Alert.alert('録音エラー', '録音の停止に失敗しました');
    }
  }, [stopListening]);

  const handleSuggestionPress = useCallback((suggestionId: string) => {
    console.log('Selected suggestion:', suggestionId);
  }, []);

  // エラー表示
  if (error) {
    Alert.alert('エラー', error, [{ text: 'OK', onPress: clearError }]);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-base" edges={['top']}>
      <Header
        title="Data Plug Copilot"
        rightElement={<ConnectionBadge isConnected={isConnected} isConnecting={isConnecting} />}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Context Card */}
        <CurrentContextCard minutesLeft={12} destination="Roppongi Hills" eta="11:15 AM" />

        {/* 会話履歴セクション */}
        {conversationHistory.length > 0 && (
          <View className="mb-4">
            <Text className="text-label tracking-widest text-text-muted uppercase mb-3 px-1">
              Conversation
            </Text>
            <View className="bg-surface-elevated rounded-2xl p-4 border border-slate-700">
              {conversationHistory.map((entry) => (
                <ConversationItem key={entry.id} entry={entry} />
              ))}
            </View>
          </View>
        )}

        {/* AI Suggestions Section */}
        <View className="mb-4">
          <Text className="text-label tracking-widest text-text-muted uppercase mb-3 px-1">
            AI Suggestions
          </Text>

          <View className="flex-row gap-3">
            {/* Cafe Suggestion - Highlighted */}
            <AISuggestionCard
              type="cafe"
              title={'Cafe: "Sharp Taste" Espresso'}
              subtitle="15min stop?"
              socialCount={15}
              rating={4.8}
              isHighlighted={true}
              onPress={() => handleSuggestionPress('cafe-1')}
            />

            {/* Scenic Detour */}
            <AISuggestionCard
              type="detour"
              title="Scenic Detour"
              subtitle="+5 mins, relaxed"
              source="web"
              isHighlighted={false}
              onPress={() => handleSuggestionPress('detour-1')}
            />
          </View>
        </View>
      </ScrollView>

      {/* Voice Control Bar */}
      <VoiceControlBar
        isConnected={isConnected}
        isConnecting={isConnecting}
        isListening={isListening}
        isProcessing={isProcessing}
        isSpeaking={isSpeaking}
        currentTranscript={currentTranscript}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onStartListening={handleStartListening}
        onStopListening={handleStopListening}
      />
    </SafeAreaView>
  );
}
