import { memo, useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

interface HeaderProps {
  title: string;
  showLanguageToggle?: boolean;
  rightElement?: ReactNode;
}

type Language = 'EN' | 'JP';

function HeaderComponent({ title, showLanguageToggle = true, rightElement }: HeaderProps) {
  const [language, setLanguage] = useState<Language>('EN');

  const toggleLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  return (
    <View className="flex-row items-center justify-between px-5 py-4 bg-surface-base">
      <Text className="text-car-xl font-bold text-text-primary">{title}</Text>

      {rightElement
        ? rightElement
        : showLanguageToggle && (
            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={() => toggleLanguage('EN')}
                accessibilityRole="button"
                accessibilityLabel="英語に切り替え"
                accessibilityState={{ selected: language === 'EN' }}
                style={({ pressed }): StyleProp<ViewStyle> => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className="min-w-[48px] min-h-[48px] items-center justify-center rounded-lg"
              >
                <Text
                  className={`text-car-base font-semibold ${
                    language === 'EN' ? 'text-primary-400' : 'text-text-muted'
                  }`}
                >
                  英語
                </Text>
              </Pressable>

              <Text className="text-text-muted">|</Text>

              <Pressable
                onPress={() => toggleLanguage('JP')}
                accessibilityRole="button"
                accessibilityLabel="日本語に切り替え"
                accessibilityState={{ selected: language === 'JP' }}
                style={({ pressed }): StyleProp<ViewStyle> => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className="min-w-[48px] min-h-[48px] items-center justify-center rounded-lg"
              >
                <Text
                  className={`text-car-base font-semibold ${
                    language === 'JP' ? 'text-primary-400' : 'text-text-muted'
                  }`}
                >
                  日本語
                </Text>
              </Pressable>
            </View>
          )}
    </View>
  );
}

export const Header = memo(HeaderComponent);
