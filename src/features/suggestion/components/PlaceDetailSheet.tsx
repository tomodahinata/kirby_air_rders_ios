import { memo } from 'react';
import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { Star, MapPin, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { AIMatchBadge } from '@/shared/components/ui/AIMatchBadge';
import { UserBadge } from '@/shared/components/ui/UserBadge';
import { TimeInfoCard } from '@/shared/components/ui/TimeInfoCard';

interface PlaceDetailSheetProps {
  isVisible: boolean;
  place: {
    name: string;
    address: string;
    imageUrl?: string;
    rating: number;
    reviewCount: number;
  };
  aiMatchMessage?: string;
  additionalMinutes: number;
  estimatedArrival: string;
  userName?: string;
  onAdd: () => void;
  onCancel: () => void;
  onAskAI?: () => void;
  onUserPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PlaceDetailSheetComponent({
  isVisible,
  place,
  aiMatchMessage = '深煎りの好みにマッチしています',
  additionalMinutes,
  estimatedArrival,
  userName = 'Taro',
  onAdd,
  onCancel,
  onAskAI,
  onUserPress,
}: PlaceDetailSheetProps) {
  // Button animation values
  const addButtonScale = useSharedValue(1);
  const cancelButtonScale = useSharedValue(1);
  const askAIButtonScale = useSharedValue(1);

  const addButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const cancelButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelButtonScale.value }],
  }));

  const askAIButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: askAIButtonScale.value }],
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <View className="absolute inset-0 bg-black/20">
      {/* Background with gradient effect */}
      <View className="absolute inset-0 bg-gradient-to-b from-cyan-50/80 to-white/90" />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Top Bar: User Badge & AI Match Badge */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row justify-between items-start">
            {/* AI Match Badge */}
            <View className="flex-1 mr-4">
              <AIMatchBadge message={aiMatchMessage} />
            </View>

            {/* User Badge */}
            <UserBadge name={userName} onPress={onUserPress} />
          </View>
        </View>

        {/* Bottom Sheet */}
        <View className="flex-1 justify-end">
          <Animated.View
            entering={SlideInDown.duration(400).springify()}
            className="bg-white rounded-t-3xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Drag Handle */}
            <View className="items-center pt-3 pb-4">
              <View className="w-10 h-1 rounded-full bg-slate-300" />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Place Image */}
              <View className="mx-5 mb-4">
                <View className="rounded-2xl overflow-hidden">
                  {place.imageUrl ? (
                    <Image
                      source={{ uri: place.imageUrl }}
                      className="w-full h-52"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-52 bg-slate-200 items-center justify-center">
                      <MapPin size={48} color="#94a3b8" />
                    </View>
                  )}

                  {/* Rating Badge */}
                  <View
                    className="absolute top-3 left-3 flex-row items-center bg-white/95 rounded-full px-3 py-1.5"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text className="text-sm font-semibold text-slate-800 ml-1">
                      {place.rating}
                    </Text>
                    <Text className="text-sm text-slate-500 ml-1">
                      ({place.reviewCount.toLocaleString()}件)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Place Info */}
              <View className="px-5 mb-5">
                <Text className="text-2xl font-bold text-slate-800 mb-1">{place.name}</Text>
                <Text className="text-base text-slate-500">{place.address}</Text>
              </View>

              {/* Time Info Cards */}
              <View className="flex-row px-5 gap-3 mb-6">
                <TimeInfoCard
                  variant="duration"
                  label="追加時間"
                  value={`+${additionalMinutes}`}
                  unit="分"
                />
                <TimeInfoCard variant="arrival" label="到着予定" value={estimatedArrival} />
              </View>

              {/* Action Buttons */}
              <View className="px-5 gap-3">
                {/* Add Button */}
                <AnimatedPressable
                  style={[
                    addButtonStyle,
                    {
                      shadowColor: '#3b82f6',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    },
                  ]}
                  onPressIn={() => {
                    addButtonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
                  }}
                  onPressOut={() => {
                    addButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                  }}
                  onPress={onAdd}
                  accessibilityRole="button"
                  accessibilityLabel="ルートに追加する"
                  className="bg-primary-500 rounded-2xl py-4 flex-row items-center justify-center"
                >
                  <MapPin size={20} color="#ffffff" strokeWidth={2} />
                  <Text className="text-lg font-semibold text-white ml-2">追加する</Text>
                </AnimatedPressable>

                {/* Cancel Button */}
                <AnimatedPressable
                  style={cancelButtonStyle}
                  onPressIn={() => {
                    cancelButtonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
                  }}
                  onPressOut={() => {
                    cancelButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                  }}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel="キャンセル"
                  className="bg-slate-100 rounded-2xl py-4 items-center justify-center"
                >
                  <Text className="text-lg font-semibold text-slate-700">キャンセル</Text>
                </AnimatedPressable>

                {/* Ask AI Button */}
                {onAskAI && (
                  <AnimatedPressable
                    style={askAIButtonStyle}
                    onPressIn={() => {
                      askAIButtonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
                    }}
                    onPressOut={() => {
                      askAIButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                    }}
                    onPress={onAskAI}
                    accessibilityRole="button"
                    accessibilityLabel="AIに質問する"
                    className="bg-slate-100 rounded-2xl py-4 flex-row items-center justify-center"
                  >
                    <Sparkles size={20} color="#3b82f6" strokeWidth={2} />
                    <Text className="text-lg font-semibold text-slate-700 ml-2">AIに質問する</Text>
                  </AnimatedPressable>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export const PlaceDetailSheet = memo(PlaceDetailSheetComponent);
