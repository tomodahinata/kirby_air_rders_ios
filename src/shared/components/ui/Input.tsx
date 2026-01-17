import { memo, forwardRef } from 'react';
import { View, Text, TextInput } from 'react-native';

import type { TextInputProps } from 'react-native';

interface InputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  showCharCount?: boolean;
  className?: string;
  inputClassName?: string;
}

const InputComponent = forwardRef<TextInput, InputProps>(
  (
    {
      value,
      onChangeText,
      label,
      error,
      helperText,
      required = false,
      showCharCount = false,
      maxLength,
      multiline = false,
      numberOfLines = 1,
      placeholder,
      editable = true,
      className = '',
      inputClassName = '',
      accessibilityLabel,
      ...rest
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const charCount = value?.length ?? 0;

    return (
      <View className={className}>
        {/* Label */}
        {label && (
          <Text className="text-car-sm font-medium text-text-secondary mb-2">
            {label}
            {required && <Text className="text-error"> *</Text>}
          </Text>
        )}

        {/* Input field */}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          maxLength={maxLength}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={helperText}
          accessibilityState={{ disabled: !editable }}
          className={`
            bg-surface-overlay rounded-xl px-4 py-3.5 min-h-[48px]
            text-car-base text-text-primary
            border ${hasError ? 'border-error' : 'border-slate-600'}
            ${multiline ? 'min-h-[120px] py-3' : ''}
            ${!editable ? 'opacity-50' : ''}
            ${inputClassName}
          `}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
        />

        {/* Bottom row: error/helper text and character count */}
        <View className="flex-row justify-between items-start mt-1">
          <View className="flex-1 pr-2">
            {hasError ? (
              <Text className="text-sm text-error">{error}</Text>
            ) : helperText ? (
              <Text className="text-sm text-text-muted">{helperText}</Text>
            ) : null}
          </View>

          {showCharCount && maxLength && (
            <Text
              className={`text-sm ${charCount >= maxLength ? 'text-error' : 'text-text-muted'}`}
            >
              {charCount}/{maxLength}
            </Text>
          )}
        </View>
      </View>
    );
  }
);

InputComponent.displayName = 'Input';

export const Input = memo(InputComponent);
