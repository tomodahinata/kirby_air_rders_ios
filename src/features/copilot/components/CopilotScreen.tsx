import { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/shared/components/layout/Header';
import { CurrentContextCard } from '@/features/navigation/components/CurrentContextCard';
import { AISuggestionCard } from '@/features/suggestion/components/AISuggestionCard';
import { VoiceListeningBar } from '@/shared/components/ui/VoiceListeningBar';

export function CopilotScreen() {
  const [isListening, setIsListening] = useState(true);

  const handleVoicePress = useCallback(() => {
    setIsListening((prev) => !prev);
  }, []);

  const handleSuggestionPress = useCallback((suggestionId: string) => {
    console.log('Selected suggestion:', suggestionId);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#e8eaed]" edges={['top']}>
      <Header title="Data Plug Copilot" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Context Card */}
        <CurrentContextCard minutesLeft={12} destination="Roppongi Hills" eta="11:15 AM" />

        {/* AI Suggestions Section */}
        <View className="mb-4">
          <Text className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3 px-1">
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

      {/* Voice Listening Bar */}
      <VoiceListeningBar isListening={isListening} onPress={handleVoicePress} />
    </SafeAreaView>
  );
}
