import { memo, useCallback } from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'car'; // 'car' is for car display (large touch target)

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<ButtonVariant, { base: string; text: string }> = {
  primary: {
    base: 'bg-primary-600 active:bg-primary-700',
    text: 'text-white',
  },
  secondary: {
    base: 'bg-surface-light active:bg-gray-600 border border-gray-600',
    text: 'text-white',
  },
  ghost: {
    base: 'bg-transparent active:bg-surface-light',
    text: 'text-primary-400',
  },
  danger: {
    base: 'bg-red-600 active:bg-red-700',
    text: 'text-white',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'px-3 py-2 min-h-[36px]',
    text: 'text-sm',
  },
  md: {
    container: 'px-4 py-3 min-h-[44px]',
    text: 'text-base',
  },
  lg: {
    container: 'px-6 py-4 min-h-[52px]',
    text: 'text-lg',
  },
  car: {
    container: 'px-6 py-5 min-h-[64px]',
    text: 'text-car-lg',
  },
};

function ButtonComponent({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
}: ButtonProps) {
  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      onPress();
    }
  }, [disabled, loading, onPress]);

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={`
        flex-row items-center justify-center rounded-xl
        ${variantStyle.base}
        ${sizeStyle.container}
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? '#60a5fa' : '#ffffff'}
          size={size === 'car' || size === 'lg' ? 'large' : 'small'}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`font-semibold text-center ${variantStyle.text} ${sizeStyle.text}`}>
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export const Button = memo(ButtonComponent);
