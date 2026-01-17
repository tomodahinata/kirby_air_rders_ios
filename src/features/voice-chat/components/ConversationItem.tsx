import { memo } from 'react';
import { View, Text } from 'react-native';

import type { ConversationEntry } from '../types';

interface ConversationItemProps {
  entry: ConversationEntry;
}

function ConversationItemComponent({ entry }: ConversationItemProps) {
  const isUser = entry.role === 'user';

  return (
    <View
      className={`mb-3 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}
      accessible
      accessibilityLabel={`${isUser ? 'あなた' : 'AI'}: ${entry.content}`}
    >
      <View
        className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-primary-600' : 'bg-surface-elevated'}`}
        style={{
          shadowColor: isUser ? '#3b82f6' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isUser ? 0.3 : 0.2,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text className={`text-car-base ${isUser ? 'text-white' : 'text-text-primary'}`}>
          {entry.content}
        </Text>
      </View>
      <Text className={`text-car-sm text-text-muted mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
        {new Date(entry.timestamp).toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

export const ConversationItem = memo(ConversationItemComponent);
