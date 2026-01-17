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
    <Card className="mb-6">
      {/* Label */}
      <Text className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">
        Current Context
      </Text>

      {/* Time Display */}
      <View className="mb-4">
        <Text className="text-7xl font-bold text-gray-900 leading-none">{minutesLeft} MIN</Text>
        <Text className="text-5xl font-bold text-gray-900 leading-none">LEFT</Text>
      </View>

      {/* Destination Info */}
      <View className="flex-row items-center gap-3">
        <ArrowRight size={24} color="#1a1a1a" strokeWidth={2} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Navigation size={16} color="#1a1a1a" fill="#1a1a1a" />
            <Text className="text-lg font-semibold text-gray-900">DESTINATION</Text>
          </View>
          <Text className="text-lg font-semibold text-gray-900">({destination})</Text>
          <Text className="text-base text-gray-500 mt-1">ETA: {eta}</Text>
        </View>
      </View>
    </Card>
  );
}

export const CurrentContextCard = memo(CurrentContextCardComponent);
