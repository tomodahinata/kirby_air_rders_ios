import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';

export default function SettingsTab() {
  return (
    <SafeAreaView className="flex-1 bg-surface-dark" edges={['top']}>
      <View className="flex-1 items-center justify-center px-8">
        <View className="bg-gray-800 rounded-full p-4 mb-4">
          <Settings size={48} color="#9ca3af" />
        </View>
        <Text className="text-car-xl font-bold text-white text-center">設定</Text>
        <Text className="text-car-base text-gray-400 mt-2 text-center">
          アプリの設定を変更できます
        </Text>
      </View>
    </SafeAreaView>
  );
}
