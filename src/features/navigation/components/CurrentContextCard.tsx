import { memo } from 'react';
import { View, Text } from 'react-native';
import { ArrowRight, Navigation } from 'lucide-react-native';

import { Card } from '@/shared/components/ui/Card';

interface CurrentContextProps {
  minutesLeft: number;
  destination: string;
  eta: string;
}

function CurrentContextCardComponent({ minutesLeft, destination, eta }: CurrentContextProps) {
  return (
    <Card variant="glass" className="mb-6">
      {/* ラベル */}
      <Text className="text-label tracking-widest text-text-muted mb-2">現在の状況</Text>

      {/* 残り時間表示 */}
      <View className="mb-4">
        <Text className="text-display-xl font-bold text-text-primary leading-none">
          残り {minutesLeft}分
        </Text>
        <Text className="text-display-lg font-bold text-text-secondary leading-none">
          目的地まで
        </Text>
      </View>

      {/* 目的地情報 */}
      <View className="flex-row items-center gap-3">
        <ArrowRight size={24} color="#60a5fa" strokeWidth={2} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Navigation size={16} color="#60a5fa" fill="#60a5fa" />
            <Text className="text-car-lg font-semibold text-text-primary">目的地</Text>
          </View>
          <Text className="text-car-lg font-semibold text-text-primary">{destination}</Text>
          <Text className="text-car-base text-text-secondary mt-1">到着予定: {eta}</Text>
        </View>
      </View>
    </Card>
  );
}

export const CurrentContextCard = memo(CurrentContextCardComponent);
