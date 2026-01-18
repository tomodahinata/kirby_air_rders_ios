import { memo } from 'react';
import { Text, View } from 'react-native';

type TimeInfoVariant = 'duration' | 'arrival';

interface TimeInfoCardProps {
  variant: TimeInfoVariant;
  label: string;
  value: string;
  unit?: string;
}

function TimeInfoCardComponent({ variant, label, value, unit }: TimeInfoCardProps) {
  const isArrival = variant === 'arrival';

  return (
    <View className="flex-1 bg-slate-100 rounded-2xl py-4 px-5 items-center">
      {/* Label */}
      <Text className="text-sm text-slate-500 mb-1">{label}</Text>

      {/* Value */}
      <View className="flex-row items-baseline">
        <Text className={`text-3xl font-bold ${isArrival ? 'text-primary-500' : 'text-slate-800'}`}>
          {value}
        </Text>
        {unit && (
          <Text
            className={`text-lg font-medium ml-0.5 ${isArrival ? 'text-primary-500' : 'text-slate-600'}`}
          >
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
}

export const TimeInfoCard = memo(TimeInfoCardComponent);
