import { memo, useCallback } from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'car';

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Variant styles with proper dark mode tokens
const variantStyles: Record<ButtonVariant, { base: string; pressed: string; text: string }> = {
  primary: {
    base: 'bg-primary-600',
    pressed: 'bg-primary-700',
    text: 'text-white',
  },
  secondary: {
    base: 'bg-surface-elevated border border-slate-600',
    pressed: 'bg-surface-overlay',
    text: 'text-white',
  },
  ghost: {
    base: 'bg-transparent',
    pressed: 'bg-surface-elevated',
    text: 'text-primary-400',
  },
  danger: {
    base: 'bg-error',
    pressed: 'bg-red-700',
    text: 'text-white',
  },
};

// Size styles - all sizes meet 48px minimum touch target
const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'px-4 py-3 min-h-[48px]',
    text: 'text-base',
  },
  md: {
    container: 'px-5 py-3.5 min-h-[52px]',
    text: 'text-car-base',
  },
  lg: {
    container: 'px-6 py-4 min-h-[56px]',
    text: 'text-car-lg',
  },
  car: {
    container: 'px-8 py-5 min-h-[64px]',
    text: 'text-car-xl',
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
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      onPress();
    }
  }, [disabled, loading, onPress]);

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  // Derive accessibility label from children if not provided
  const derivedLabel = accessibilityLabel ?? (typeof children === 'string' ? children : undefined);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={derivedLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }): StyleProp<ViewStyle> => [
        {
          opacity: pressed && !disabled ? 0.95 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
      ]}
      className={`
        flex-row items-center justify-center rounded-xl
        ${variantStyle.base}
        ${sizeStyle.container}
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {({ pressed }) => (
        <>
          {loading ? (
            <ActivityIndicator
              color={variant === 'ghost' ? '#60a5fa' : '#ffffff'}
              size={size === 'car' || size === 'lg' ? 'large' : 'small'}
            />
          ) : (
            <View
              className={`flex-row items-center gap-2 ${
                pressed && !disabled ? variantStyle.pressed : ''
              }`}
            >
              {icon}
              <Text className={`font-semibold text-center ${variantStyle.text} ${sizeStyle.text}`}>
                {children}
              </Text>
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

export const Button = memo(ButtonComponent);
