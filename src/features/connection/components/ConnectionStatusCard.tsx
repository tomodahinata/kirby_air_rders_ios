import { memo, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Cable, Car, CheckCircle2, AlertCircle, Loader, Wifi } from 'lucide-react-native';

import type { ConnectionStatus, VehicleInfo, TransferProgress } from '../types';

interface ConnectionStatusCardProps {
  status: ConnectionStatus;
  vehicle: VehicleInfo | null;
  transferProgress: TransferProgress | null;
  error: string | null;
}

function ConnectionStatusCardComponent({
  status,
  vehicle,
  transferProgress,
  error,
}: ConnectionStatusCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // パルスアニメーション
  useEffect(() => {
    if (status === 'connecting' || status === 'transferring') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [status, pulseAnim]);

  // プログレスアニメーション
  useEffect(() => {
    if (transferProgress) {
      Animated.timing(progressAnim, {
        toValue: transferProgress.progress,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [transferProgress?.progress, progressAnim]);

  const getStatusConfig = () => {
    switch (status) {
      case 'disconnected':
        return {
          icon: <Cable size={32} color="#6b7280" />,
          title: '未接続',
          subtitle: 'USB-Cケーブルを接続してください',
          color: '#6b7280',
          bgColor: 'bg-gray-700',
        };
      case 'connecting':
        return {
          icon: <Wifi size={32} color="#3b82f6" />,
          title: '接続中...',
          subtitle: '車載ディスプレイに接続しています',
          color: '#3b82f6',
          bgColor: 'bg-blue-900/30',
        };
      case 'connected':
        return {
          icon: <Car size={32} color="#22c55e" />,
          title: '接続済み',
          subtitle: vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : '車両に接続済み',
          color: '#22c55e',
          bgColor: 'bg-green-900/30',
        };
      case 'transferring':
        return {
          icon: <Loader size={32} color="#f59e0b" />,
          title: 'データ転送中',
          subtitle: transferProgress ? getPhaseText(transferProgress.currentPhase) : '処理中...',
          color: '#f59e0b',
          bgColor: 'bg-amber-900/30',
        };
      case 'done':
        return {
          icon: <CheckCircle2 size={32} color="#22c55e" />,
          title: '転送完了',
          subtitle: '車載ディスプレイにデータを送信しました',
          color: '#22c55e',
          bgColor: 'bg-green-900/30',
        };
      case 'error':
        return {
          icon: <AlertCircle size={32} color="#ef4444" />,
          title: 'エラー',
          subtitle: error ?? '接続に問題が発生しました',
          color: '#ef4444',
          bgColor: 'bg-red-900/30',
        };
      default:
        return {
          icon: <Cable size={32} color="#6b7280" />,
          title: '不明',
          subtitle: '',
          color: '#6b7280',
          bgColor: 'bg-gray-700',
        };
    }
  };

  const getPhaseText = (
    phase: 'preparing' | 'compressing' | 'encrypting' | 'sending' | 'verifying' | 'complete'
  ) => {
    switch (phase) {
      case 'preparing':
        return 'データを準備中...';
      case 'compressing':
        return 'データを圧縮中...';
      case 'encrypting':
        return 'データを暗号化中...';
      case 'sending':
        return 'データを送信中...';
      case 'verifying':
        return 'データを検証中...';
      case 'complete':
        return '完了';
      default:
        return '処理中...';
    }
  };

  const config = getStatusConfig();

  return (
    <View className={`${config.bgColor} rounded-2xl p-5`}>
      {/* ヘッダー */}
      <View className="flex-row items-center">
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>{config.icon}</Animated.View>
        <View className="ml-4 flex-1">
          <Text className="text-xl font-bold text-white">{config.title}</Text>
          <Text className="text-sm text-gray-400 mt-0.5">{config.subtitle}</Text>
        </View>
      </View>

      {/* 転送プログレス */}
      {status === 'transferring' && transferProgress && (
        <View className="mt-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-400">進捗</Text>
            <Text className="text-sm font-semibold text-white">
              {Math.round(transferProgress.progress)}%
            </Text>
          </View>
          <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <Animated.View
              className="h-full bg-amber-500 rounded-full"
              style={{
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>
          {transferProgress.bytesTransferred > 0 && (
            <Text className="text-xs text-gray-500 mt-2">
              {Math.round(transferProgress.bytesTransferred / 1024)} KB /{' '}
              {Math.round(transferProgress.totalBytes / 1024)} KB
            </Text>
          )}
        </View>
      )}

      {/* 車両情報 */}
      {vehicle && (status === 'connected' || status === 'done') && (
        <View className="mt-4 p-3 bg-gray-800/50 rounded-xl">
          <View className="flex-row items-center">
            <Car size={20} color="#9ca3af" />
            <Text className="text-sm text-gray-300 ml-2">
              {vehicle.manufacturer} {vehicle.model} ({vehicle.year})
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export const ConnectionStatusCard = memo(ConnectionStatusCardComponent);
