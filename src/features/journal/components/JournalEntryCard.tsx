import { memo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { MapPin, Calendar, ChevronRight, Star } from 'lucide-react-native';

import { Card } from '@/shared/components/ui/Card';
import type { ManualJournalEntry } from '../types';

interface JournalEntryCardProps {
  entry: ManualJournalEntry;
  onPress?: (entry: ManualJournalEntry) => void;
  className?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekDay = weekDays[date.getDay()];
  return `${year}/${month}/${day}（${weekDay}）`;
}

function JournalEntryCardComponent({ entry, onPress, className = '' }: JournalEntryCardProps) {
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(entry);
    }
  }, [entry, onPress]);

  const addressText = [entry.address.prefecture, entry.address.city].filter(Boolean).join(' ');

  return (
    <Card onPress={onPress ? handlePress : undefined} className={`mb-3 ${className}`}>
      <View className="flex-row items-start justify-between">
        {/* Main Content */}
        <View className="flex-1 pr-3">
          {/* Place Name */}
          <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={1}>
            {entry.place_name}
          </Text>

          {/* Address */}
          <View className="flex-row items-center mb-2">
            <MapPin size={14} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1" numberOfLines={1}>
              {addressText}
            </Text>
          </View>

          {/* Date */}
          <View className="flex-row items-center mb-2">
            <Calendar size={14} color="#6b7280" />
            <Text className="text-sm text-gray-500 ml-1">{formatDate(entry.visited_at)}</Text>
          </View>

          {/* Rating */}
          <View className="flex-row items-center">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={16}
                color={i < entry.rating ? '#f59e0b' : '#d1d5db'}
                fill={i < entry.rating ? '#f59e0b' : 'transparent'}
              />
            ))}
          </View>

          {/* Notes Preview */}
          {entry.notes && (
            <Text className="text-sm text-gray-500 mt-2" numberOfLines={2}>
              {entry.notes}
            </Text>
          )}
        </View>

        {/* Chevron */}
        {onPress && (
          <View className="justify-center">
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        )}
      </View>
    </Card>
  );
}

export const JournalEntryCard = memo(JournalEntryCardComponent);
