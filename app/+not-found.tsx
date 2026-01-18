import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { AlertCircle, Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'ページが見つかりません' }} />
      <View className="flex-1 items-center justify-center bg-white p-6">
        <AlertCircle size={64} color="#9CA3AF" />

        <Text className="mt-6 text-xl font-bold text-gray-900">このページは存在しません</Text>

        <Text className="mt-2 text-center text-gray-500">
          お探しのページが見つかりませんでした。
        </Text>

        <Link href="/" asChild>
          <View className="mt-8 flex-row items-center rounded-xl bg-blue-600 px-6 py-3">
            <Home size={20} color="#FFFFFF" />
            <Text className="ml-2 text-lg font-semibold text-white">ホームに戻る</Text>
          </View>
        </Link>
      </View>
    </>
  );
}
