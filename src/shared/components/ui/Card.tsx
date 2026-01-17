import { memo } from 'react';
import { View, Pressable } from 'react-native';

import type { ReactNode } from 'react';

type CardVariant = 'default' | 'highlight' | 'glass';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}

function CardComponent({
  children,
  variant = 'default',
  onPress,
  disabled,
  className = '',
}: CardProps) {
  const variantStyles = {
    default: 'bg-white',
    highlight: 'bg-orange-50 border-2 border-orange-200',
    glass: 'bg-white/80',
  };

  const baseStyles = `rounded-3xl p-5 ${variantStyles[variant]}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`${baseStyles} active:scale-[0.98] active:opacity-90 ${className}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 4,
        }}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      className={`${baseStyles} ${className}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
      }}
    >
      {children}
    </View>
  );
}

export const Card = memo(CardComponent);
