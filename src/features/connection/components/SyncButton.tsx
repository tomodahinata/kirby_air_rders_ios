import { memo, useCallback } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { Send, RefreshCw, CheckCircle } from 'lucide-react-native';

import type { ConnectionStatus } from '../types';

interface SyncButtonProps {
  status: ConnectionStatus;
  isExtractionComplete: boolean;
  onPress: () => void;
  disabled?: boolean;
}

function SyncButtonComponent({
  status,
  isExtractionComplete,
  onPress,
  disabled = false,
}: SyncButtonProps) {
  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress();
    }
  }, [onPress, disabled]);

  const getButtonConfig = () => {
    if (!isExtractionComplete) {
      return {
        text: 'データ収集が必要です',
        icon: <RefreshCw size={28} color="#9ca3af" />,
        bgClass: 'bg-gray-700',
        textClass: 'text-gray-400',
        disabled: true,
      };
    }

    switch (status) {
      case 'disconnected':
        return {
          text: '車載器に送信',
          icon: <Send size={28} color="#ffffff" />,
          bgClass: 'bg-blue-600 active:bg-blue-700',
          textClass: 'text-white',
          disabled: false,
        };
      case 'connecting':
        return {
          text: '接続中...',
          icon: <ActivityIndicator size="small" color="#ffffff" />,
          bgClass: 'bg-blue-500',
          textClass: 'text-white',
          disabled: true,
        };
      case 'connected':
        return {
          text: 'データを送信',
          icon: <Send size={28} color="#ffffff" />,
          bgClass: 'bg-green-600 active:bg-green-700',
          textClass: 'text-white',
          disabled: false,
        };
      case 'transferring':
        return {
          text: '送信中...',
          icon: <ActivityIndicator size="small" color="#ffffff" />,
          bgClass: 'bg-amber-500',
          textClass: 'text-white',
          disabled: true,
        };
      case 'done':
        return {
          text: '送信完了',
          icon: <CheckCircle size={28} color="#ffffff" />,
          bgClass: 'bg-green-600',
          textClass: 'text-white',
          disabled: true,
        };
      case 'error':
        return {
          text: '再試行',
          icon: <RefreshCw size={28} color="#ffffff" />,
          bgClass: 'bg-red-600 active:bg-red-700',
          textClass: 'text-white',
          disabled: false,
        };
      default:
        return {
          text: '送信',
          icon: <Send size={28} color="#ffffff" />,
          bgClass: 'bg-blue-600',
          textClass: 'text-white',
          disabled: false,
        };
    }
  };

  const config = getButtonConfig();
  const isDisabled = disabled || config.disabled;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      className={`min-h-[72px] rounded-2xl px-8 py-5 ${config.bgClass} ${
        isDisabled ? 'opacity-60' : ''
      }`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View className="flex-row items-center justify-center">
        {config.icon}
        <Text className={`text-xl font-bold ml-3 ${config.textClass}`}>{config.text}</Text>
      </View>
    </Pressable>
  );
}

export const SyncButton = memo(SyncButtonComponent);
