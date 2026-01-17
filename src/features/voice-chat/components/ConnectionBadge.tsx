import { memo } from 'react';
import { View, Text } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';

interface ConnectionBadgeProps {
  isConnected: boolean;
  isConnecting: boolean;
}

function ConnectionBadgeComponent({ isConnected, isConnecting }: ConnectionBadgeProps) {
  if (isConnecting) {
    return (
      <View className="flex-row items-center bg-yellow-100 px-3 py-1 rounded-full">
        <Wifi size={14} color="#ca8a04" />
        <Text className="text-xs text-yellow-700 ml-1">接続中...</Text>
      </View>
    );
  }

  if (isConnected) {
    return (
      <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full">
        <Wifi size={14} color="#16a34a" />
        <Text className="text-xs text-green-700 ml-1">接続済み</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full">
      <WifiOff size={14} color="#6b7280" />
      <Text className="text-xs text-gray-500 ml-1">未接続</Text>
    </View>
  );
}

export const ConnectionBadge = memo(ConnectionBadgeComponent);
