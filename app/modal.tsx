import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Pressable
        className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 active:bg-gray-200"
        onPress={() => router.back()}
      >
        <X size={24} color="#374151" />
      </Pressable>

      <View className="items-center">
        <Text className="mb-4 text-2xl font-bold text-gray-900">モーダル</Text>
        <View className="my-6 h-px w-4/5 bg-gray-200" />
        <Text className="text-center text-gray-600">
          このモーダルはアプリ内で情報を表示するために使用されます。
        </Text>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
