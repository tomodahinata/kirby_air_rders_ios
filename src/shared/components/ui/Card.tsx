import { memo } from 'react';
import { View, Pressable } from 'react-native';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type CardVariant = 'default' | 'highlight' | 'glass' | 'neon';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Dark mode variant styles
const variantStyles: Record<CardVariant, string> = {
  default: 'bg-surface-elevated border border-slate-700',
  highlight: 'bg-amber-900/30 border-2 border-amber-500/50',
  glass: 'bg-surface-glass border border-slate-600/50',
  neon: 'bg-surface-elevated border border-primary-500/50',
};

// Shadow configurations per variant
const getShadowStyle = (variant: CardVariant, pressed: boolean = false): ViewStyle => {
  const baseOpacity = pressed ? 0.1 : 0.15;

  switch (variant) {
    case 'neon':
      return {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: pressed ? 0.2 : 0.3,
        shadowRadius: 24,
        elevation: 8,
      };
    case 'highlight':
      return {
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: pressed ? 0.15 : 0.25,
        shadowRadius: 20,
        elevation: 6,
      };
    default:
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: baseOpacity,
        shadowRadius: 24,
        elevation: 4,
      };
  }
};

function CardComponent({
  children,
  variant = 'default',
  onPress,
  disabled,
  className = '',
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const baseStyles = `rounded-3xl p-5 ${variantStyles[variant]}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={({ pressed }): StyleProp<ViewStyle> => [
          getShadowStyle(variant, pressed),
          {
            opacity: pressed ? 0.95 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        className={`${baseStyles} ${disabled ? 'opacity-50' : ''} ${className}`}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={getShadowStyle(variant)}
      className={`${baseStyles} ${className}`}
    >
      {children}
    </View>
  );
}

export const Card = memo(CardComponent);
