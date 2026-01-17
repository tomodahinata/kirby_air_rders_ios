import { memo } from 'react';
import { View, Text } from 'react-native';
import {
  Heart,
  Search,
  ShoppingCart,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';

import type { StructuredContext } from '../types';

interface DataCollectionCardProps {
  contextData: StructuredContext | null;
  isComplete: boolean;
}

interface DataItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'pending' | 'complete' | 'error';
}

function DataItemComponent({ icon, label, value, status }: DataItemProps) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-700">
      <View className="flex-row items-center flex-1">
        <View className="mr-3">{icon}</View>
        <View className="flex-1">
          <Text className="text-base text-gray-300">{label}</Text>
          <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
      <View className="ml-2">
        {status === 'complete' ? (
          <CheckCircle size={20} color="#22c55e" />
        ) : status === 'error' ? (
          <AlertCircle size={20} color="#ef4444" />
        ) : (
          <View className="w-5 h-5 rounded-full bg-gray-600" />
        )}
      </View>
    </View>
  );
}

const DataItem = memo(DataItemComponent);

function DataCollectionCardComponent({ contextData, isComplete }: DataCollectionCardProps) {
  const health = contextData?.extraction.health;
  const behavior = contextData?.extraction.behavior;

  return (
    <View className="bg-gray-800 rounded-2xl p-5">
      <Text className="text-xl font-bold text-white mb-4">収集データサマリー</Text>

      <DataItem
        icon={<Heart size={24} color="#ef4444" />}
        label="ヘルスケア"
        value={
          health
            ? `${health.currentCondition === 'excellent' ? '優良' : health.currentCondition === 'good' ? '良好' : health.currentCondition === 'fair' ? '普通' : '要注意'} / ストレス: ${health.stressLevel === 'low' ? '低' : health.stressLevel === 'moderate' ? '中' : '高'}`
            : '未収集'
        }
        status={isComplete && health ? 'complete' : 'pending'}
      />

      <DataItem
        icon={<Search size={24} color="#3b82f6" />}
        label="検索履歴"
        value={behavior ? behavior.recentSearchTheme : '未収集'}
        status={isComplete && behavior ? 'complete' : 'pending'}
      />

      <DataItem
        icon={<ShoppingCart size={24} color="#f59e0b" />}
        label="購買履歴"
        value={behavior ? behavior.purchaseTrend : '未収集'}
        status={isComplete && behavior ? 'complete' : 'pending'}
      />

      <DataItem
        icon={<Calendar size={24} color="#8b5cf6" />}
        label="カレンダー"
        value={behavior?.upcomingPlans[0] ? `次の予定: ${behavior.upcomingPlans[0]}` : '未収集'}
        status={isComplete && behavior ? 'complete' : 'pending'}
      />

      {isComplete && contextData && (
        <View className="mt-4 p-3 bg-gray-700 rounded-xl">
          <Text className="text-sm text-gray-400 mb-1">LLMへのヒント</Text>
          <Text className="text-sm text-white">
            {contextData.llmHints.suggestedCategories.slice(0, 3).join(', ')}
          </Text>
          {contextData.llmHints.specialConsiderations.length > 0 && (
            <Text className="text-xs text-gray-400 mt-1">
              {contextData.llmHints.specialConsiderations[0]}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export const DataCollectionCard = memo(DataCollectionCardComponent);
