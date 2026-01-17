import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { History } from 'lucide-react-native';

export default function HistoryTab() {
  return (
    <SafeAreaView className="flex-1 bg-surface-base" edges={['top']}>
      <View className="flex-1 items-center justify-center px-8">
        <View className="bg-surface-elevated rounded-full p-4 mb-4">
          <History size={48} color="#94a3b8" />
        </View>
        <Text className="text-car-xl font-bold text-text-primary text-center">訪問履歴</Text>
        <Text className="text-car-base text-text-secondary mt-2 text-center">
          あなたの訪問履歴がここに表示されます
        </Text>
      </View>
    </SafeAreaView>
  );
}
