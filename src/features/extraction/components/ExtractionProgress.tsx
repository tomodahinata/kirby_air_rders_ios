import { memo, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Activity, Loader } from 'lucide-react-native';

import type { ExtractionProgress as ExtractionProgressType } from '../types';

interface ExtractionProgressProps {
  progress: ExtractionProgressType;
  isExtracting: boolean;
}

function ExtractionProgressComponent({ progress, isExtracting }: ExtractionProgressProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  // プログレスバーアニメーション
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress.progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress.progress, animatedWidth]);

  // スピナーアニメーション
  useEffect(() => {
    if (isExtracting) {
      const spin = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    }
  }, [isExtracting, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusColor = () => {
    switch (progress.status) {
      case 'complete':
        return '#22c55e';
      case 'error':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'idle':
        return '待機中';
      case 'collecting_health':
        return 'ヘルスデータ収集中';
      case 'collecting_behavior':
        return '行動データ収集中';
      case 'aggregating':
        return 'データ統合中';
      case 'complete':
        return '完了';
      case 'error':
        return 'エラー';
      default:
        return '処理中';
    }
  };

  return (
    <View className="bg-gray-800 rounded-2xl p-5">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          {isExtracting ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Loader size={24} color="#3b82f6" />
            </Animated.View>
          ) : (
            <Activity size={24} color={getStatusColor()} />
          )}
          <Text className="text-lg font-semibold text-white ml-3">{getStatusText()}</Text>
        </View>
        <Text className="text-2xl font-bold text-white">{Math.round(progress.progress)}%</Text>
      </View>

      {/* プログレスバー */}
      <View className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <Animated.View
          className="h-full rounded-full"
          style={{
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: getStatusColor(),
          }}
        />
      </View>

      {/* 現在のステップ */}
      {progress.currentStep && (
        <Text className="text-sm text-gray-400 mt-3">{progress.currentStep}</Text>
      )}

      {/* 完了したステップ */}
      {progress.completedSteps.length > 0 && (
        <View className="mt-4">
          <Text className="text-xs text-gray-500 mb-2">完了したステップ:</Text>
          <View className="flex-row flex-wrap gap-2">
            {progress.completedSteps.map((step, index) => (
              <View key={index} className="bg-gray-700 px-2 py-1 rounded-full">
                <Text className="text-xs text-gray-300">{step}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* エラーメッセージ */}
      {progress.errorMessage && (
        <View className="mt-4 p-3 bg-red-900/30 rounded-xl">
          <Text className="text-sm text-red-400">{progress.errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

export const ExtractionProgress = memo(ExtractionProgressComponent);
