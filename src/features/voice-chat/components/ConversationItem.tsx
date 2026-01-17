import { memo } from 'react';
import { View, Text } from 'react-native';

import type { ConversationEntry } from '../types';

interface ConversationItemProps {
  entry: ConversationEntry;
}

function ConversationItemComponent({ entry }: ConversationItemProps) {
  const isUser = entry.role === 'user';

  return (
    <View className={`mb-3 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-blue-500' : 'bg-white'}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Text className={`text-base ${isUser ? 'text-white' : 'text-gray-800'}`}>
          {entry.content}
        </Text>
      </View>
      <Text className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
        {new Date(entry.timestamp).toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

export const ConversationItem = memo(ConversationItemComponent);
