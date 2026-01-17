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
      {/* Label */}
      <Text className="text-label tracking-widest text-text-muted uppercase mb-2">
        Current Context
      </Text>

      {/* Time Display */}
      <View className="mb-4">
        <Text className="text-display-xl font-bold text-text-primary leading-none">
          {minutesLeft} MIN
        </Text>
        <Text className="text-display-lg font-bold text-text-primary leading-none">LEFT</Text>
      </View>

      {/* Destination Info */}
      <View className="flex-row items-center gap-3">
        <ArrowRight size={24} color="#60a5fa" strokeWidth={2} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Navigation size={16} color="#60a5fa" fill="#60a5fa" />
            <Text className="text-car-lg font-semibold text-text-primary">DESTINATION</Text>
          </View>
          <Text className="text-car-lg font-semibold text-text-primary">({destination})</Text>
          <Text className="text-car-base text-text-secondary mt-1">ETA: {eta}</Text>
        </View>
      </View>
    </Card>
  );
}

export const CurrentContextCard = memo(CurrentContextCardComponent);
