import { memo } from 'react';
import { Text } from 'react-native';
import { Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

type BannerVariant = 'info' | 'success' | 'warning' | 'error';

interface InfoBannerProps {
  message: string;
  variant?: BannerVariant;
}

const VARIANT_CONFIG: Record<
  BannerVariant,
  { icon: typeof Info; iconColor: string; bgColor: string; textColor: string }
> = {
  info: {
    icon: Info,
    iconColor: '#3b82f6',
    bgColor: '#f1f5f9',
    textColor: '#475569',
  },
  success: {
    icon: CheckCircle,
    iconColor: '#22c55e',
    bgColor: '#f0fdf4',
    textColor: '#166534',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#f59e0b',
    bgColor: '#fffbeb',
    textColor: '#92400e',
  },
  error: {
    icon: AlertCircle,
    iconColor: '#ef4444',
    bgColor: '#fef2f2',
    textColor: '#991b1b',
  },
};

function InfoBannerComponent({ message, variant = 'info' }: InfoBannerProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <Animated.View
      entering={FadeInUp.delay(300).duration(400)}
      className="mx-4 rounded-2xl px-4 py-3.5 flex-row items-center"
      style={{ backgroundColor: config.bgColor }}
    >
      <Icon size={20} color={config.iconColor} strokeWidth={2} />
      <Text className="flex-1 ml-3 text-base" style={{ color: config.textColor }}>
        {message}
      </Text>
    </Animated.View>
  );
}

export const InfoBanner = memo(InfoBannerComponent);
