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
      <View
        accessible
        accessibilityLabel="接続中"
        className="flex-row items-center bg-amber-900/30 px-3 py-1.5 rounded-full min-h-[32px]"
      >
        <Wifi size={14} color="#f59e0b" />
        <Text className="text-car-sm text-warning ml-1.5">接続中...</Text>
      </View>
    );
  }

  if (isConnected) {
    return (
      <View
        accessible
        accessibilityLabel="接続済み"
        className="flex-row items-center bg-green-900/30 px-3 py-1.5 rounded-full min-h-[32px]"
      >
        <Wifi size={14} color="#22c55e" />
        <Text className="text-car-sm text-success ml-1.5">接続済み</Text>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel="未接続"
      className="flex-row items-center bg-surface-overlay px-3 py-1.5 rounded-full min-h-[32px]"
    >
      <WifiOff size={14} color="#64748b" />
      <Text className="text-car-sm text-text-muted ml-1.5">未接続</Text>
    </View>
  );
}

export const ConnectionBadge = memo(ConnectionBadgeComponent);
