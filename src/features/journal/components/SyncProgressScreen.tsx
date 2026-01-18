import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { X, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { CircularProgress } from '@/shared/components/ui/CircularProgress';
import { InfoBanner } from '@/shared/components/ui/InfoBanner';

type SyncStatus = 'syncing' | 'completed' | 'error';

interface SyncProgressScreenProps {
  isVisible: boolean;
  progress: number;
  status: SyncStatus;
  userName?: string;
  onClose: () => void;
  onUserPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STATUS_TEXT: Record<SyncStatus, string> = {
  syncing: '同期中...',
  completed: '同期完了',
  error: '同期エラー',
};

const INFO_MESSAGES: Record<SyncStatus, string> = {
  syncing: '安全のためエンジン始動後に完了します',
  completed: 'データが正常に車両と同期されました',
  error: '同期に失敗しました。再試行してください',
};

function SyncProgressScreenComponent({
  isVisible,
  progress,
  status,
  userName = 'Taro',
  onClose,
  onUserPress,
}: SyncProgressScreenProps) {
  const closeButtonScale = useSharedValue(1);

  const closeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeButtonScale.value }],
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <View className="absolute inset-0 bg-white">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center justify-between px-4 py-3"
        >
          {/* Close Button */}
          <AnimatedPressable
            style={closeButtonStyle}
            onPressIn={() => {
              closeButtonScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
              closeButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="閉じる"
            className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
          >
            <X size={20} color="#64748b" strokeWidth={2} />
          </AnimatedPressable>

          {/* User Badge */}
          <Pressable
            onPress={onUserPress}
            accessibilityRole="button"
            accessibilityLabel={`ユーザー: ${userName}`}
            className="flex-row items-center"
          >
            <Text className="text-base font-medium text-slate-700 mr-2">{userName}</Text>
            <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center border border-slate-200">
              <User size={20} color="#64748b" strokeWidth={1.5} />
            </View>
          </Pressable>
        </Animated.View>

        {/* Main Content */}
        <View className="flex-1 items-center justify-center px-6">
          {/* Circular Progress */}
          <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
            <CircularProgress
              progress={progress}
              size={260}
              strokeWidth={10}
              showPercentage={true}
              showIcon={true}
            />
          </Animated.View>

          {/* Status Text */}
          <Animated.Text
            entering={FadeInDown.delay(200).duration(400)}
            className="text-2xl font-bold text-slate-800 mt-8"
          >
            {STATUS_TEXT[status]}
          </Animated.Text>
        </View>

        {/* Bottom Info Banner */}
        <View className="pb-6">
          <InfoBanner
            message={INFO_MESSAGES[status]}
            variant={status === 'error' ? 'error' : 'info'}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

export const SyncProgressScreen = memo(SyncProgressScreenComponent);
