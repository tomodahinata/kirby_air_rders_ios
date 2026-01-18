import { memo } from 'react';
import { Text } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface AIMatchBadgeProps {
  message: string;
}

function AIMatchBadgeComponent({ message }: AIMatchBadgeProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="flex-row items-center bg-white rounded-full px-4 py-2.5 self-start"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Sparkles size={16} color="#3b82f6" strokeWidth={2} />
      <Text className="text-sm font-medium text-slate-700 ml-2">AI: {message}</Text>
    </Animated.View>
  );
}

export const AIMatchBadge = memo(AIMatchBadgeComponent);
