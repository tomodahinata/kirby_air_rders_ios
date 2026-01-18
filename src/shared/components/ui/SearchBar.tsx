import { memo, forwardRef } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import type { TextInputProps } from 'react-native';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  placeholder?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SearchBarComponent = forwardRef<TextInput, SearchBarProps>(
  ({ value, onChangeText, onClear, onFocus, placeholder = '行き先を検索', ...rest }, ref) => {
    const scale = useSharedValue(1);

    const containerStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handleFocus = () => {
      scale.value = withSpring(1.02, { damping: 15, stiffness: 400 });
      onFocus?.();
    };

    const handleBlur = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    const handleClear = () => {
      onChangeText('');
      onClear?.();
    };

    const showClearButton = value.length > 0;

    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          containerStyle,
          {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          },
        ]}
        className="bg-white rounded-2xl"
      >
        <View className="flex-row items-center px-4 py-3 min-h-[56px]">
          {/* Search Icon */}
          <Search size={22} color="#94a3b8" strokeWidth={2} />

          {/* Input */}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            accessibilityLabel="行き先検索"
            accessibilityHint="行き先を入力して検索"
            className="flex-1 ml-3 text-lg text-slate-800"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            {...rest}
          />

          {/* Clear Button */}
          {showClearButton && (
            <AnimatedPressable
              entering={FadeIn.duration(200)}
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="検索をクリア"
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center ml-2"
            >
              <X size={18} color="#64748b" strokeWidth={2} />
            </AnimatedPressable>
          )}
        </View>
      </Animated.View>
    );
  }
);

SearchBarComponent.displayName = 'SearchBar';

export const SearchBar = memo(SearchBarComponent);
