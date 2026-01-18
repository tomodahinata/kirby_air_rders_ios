import { memo, useMemo } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeInUp, Layout } from 'react-native-reanimated';

interface TranscriptDisplayProps {
  transcript: string;
  keywords?: string[];
  suffix?: string;
  isSearching?: boolean;
}

interface TextSegment {
  text: string;
  isHighlighted: boolean;
  key: string;
}

function TranscriptDisplayComponent({
  transcript,
  keywords = [],
  suffix = 'を探しています...',
  isSearching = true,
}: TranscriptDisplayProps) {
  // Parse transcript and identify keywords for highlighting
  const segments = useMemo<TextSegment[]>(() => {
    if (!transcript) return [];
    if (keywords.length === 0) {
      return [{ text: transcript, isHighlighted: false, key: 'full' }];
    }

    const result: TextSegment[] = [];
    let remaining = transcript;
    let keyIndex = 0;

    // Simple sequential matching for keywords
    for (const keyword of keywords) {
      const index = remaining.indexOf(keyword);
      if (index === -1) continue;

      // Add text before keyword
      if (index > 0) {
        result.push({
          text: remaining.substring(0, index),
          isHighlighted: false,
          key: `text-${keyIndex++}`,
        });
      }

      // Add keyword
      result.push({
        text: keyword,
        isHighlighted: true,
        key: `keyword-${keyIndex++}`,
      });

      remaining = remaining.substring(index + keyword.length);
    }

    // Add remaining text
    if (remaining) {
      result.push({
        text: remaining,
        isHighlighted: false,
        key: `text-${keyIndex}`,
      });
    }

    return result;
  }, [transcript, keywords]);

  if (!transcript) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      layout={Layout.springify()}
      className="items-center px-6"
    >
      <View className="flex-row flex-wrap justify-center items-baseline">
        <Text className="text-[26px] font-bold text-slate-800">「</Text>
        {segments.map((segment, index) => (
          <Animated.View key={segment.key} entering={FadeInUp.delay(index * 50).duration(300)}>
            {segment.isHighlighted ? (
              <View className="bg-blue-100 rounded-lg px-2 py-0.5 mx-0.5">
                <Text className="text-[26px] font-bold text-blue-700">{segment.text}</Text>
              </View>
            ) : (
              <Text className="text-[26px] font-bold text-slate-800">{segment.text}</Text>
            )}
          </Animated.View>
        ))}
        <Text className="text-[26px] font-bold text-slate-800">」</Text>
      </View>

      {isSearching && (
        <Animated.Text
          entering={FadeIn.delay(200).duration(300)}
          className="text-[26px] font-bold text-slate-800 mt-1"
        >
          {suffix}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

export const TranscriptDisplay = memo(TranscriptDisplayComponent);
