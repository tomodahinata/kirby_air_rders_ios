import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { History, MapPin, Clock } from 'lucide-react-native';

export default function HistoryTab() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <Text className="text-2xl font-bold text-slate-800">訪問履歴</Text>
        <Text className="text-base text-slate-500 mt-1">過去に訪れた場所の記録</Text>
      </View>

      {/* Empty State */}
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="bg-white rounded-3xl p-8 items-center w-full max-w-sm"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          {/* Icon Container */}
          <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-5">
            <History size={40} color="#3b82f6" />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-slate-800 text-center">履歴はまだありません</Text>

          {/* Description */}
          <Text className="text-slate-500 mt-2 text-center leading-relaxed">
            ナビゲーションを利用すると{'\n'}訪問した場所が自動的に記録されます
          </Text>

          {/* Features Preview */}
          <View className="mt-6 w-full">
            <View className="flex-row items-center py-3 border-t border-slate-100">
              <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center">
                <MapPin size={20} color="#22c55e" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-slate-700">訪問場所の記録</Text>
                <Text className="text-xs text-slate-400">自動で保存されます</Text>
              </View>
            </View>

            <View className="flex-row items-center py-3 border-t border-slate-100">
              <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
                <Clock size={20} color="#f59e0b" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-slate-700">滞在時間の追跡</Text>
                <Text className="text-xs text-slate-400">どれくらい滞在したか記録</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
