import { memo } from 'react';
import { View, Text } from 'react-native';
import { Sparkles, CheckCircle } from 'lucide-react-native';

import type { SuggestionReason } from '../types/suggestion';

interface ReasonCardProps {
  reason: SuggestionReason;
}

function ReasonCardComponent({ reason }: ReasonCardProps) {
  return (
    <View className="bg-surface-dark/50 rounded-xl p-4 border border-gray-700/50">
      {/* Primary reason with AI icon */}
      <View className="flex-row items-start gap-3 mb-3">
        <View className="bg-primary-600/20 rounded-full p-2">
          <Sparkles size={20} color="#60a5fa" />
        </View>
        <View className="flex-1">
          <Text className="text-car-base font-medium text-white leading-relaxed">
            {reason.primary}
          </Text>
        </View>
      </View>

      {/* Contributing factors */}
      {reason.factors.length > 0 && (
        <View className="ml-11 gap-2">
          {reason.factors.map((factor, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <CheckCircle size={14} color="#9ca3af" />
              <Text className="text-sm text-gray-400">{factor}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Confidence indicator */}
      <View className="mt-3 ml-11">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-gray-500">AI確信度</Text>
          <View className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${reason.confidence * 100}%` }}
            />
          </View>
          <Text className="text-xs text-gray-500">{Math.round(reason.confidence * 100)}%</Text>
        </View>
      </View>
    </View>
  );
}

export const ReasonCard = memo(ReasonCardComponent);
