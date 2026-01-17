import { memo, useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';

interface HeaderProps {
  title: string;
  showLanguageToggle?: boolean;
}

type Language = 'EN' | 'JP';

function HeaderComponent({ title, showLanguageToggle = true }: HeaderProps) {
  const [language, setLanguage] = useState<Language>('EN');

  const toggleLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <Text className="text-xl font-bold text-gray-900">{title}</Text>

      {showLanguageToggle && (
        <View className="flex-row items-center">
          <Text className="text-gray-400">[ </Text>
          <Pressable onPress={() => toggleLanguage('EN')}>
            <Text
              className={`text-sm font-semibold ${
                language === 'EN' ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              EN
            </Text>
          </Pressable>
          <Text className="text-gray-400"> | </Text>
          <Pressable onPress={() => toggleLanguage('JP')}>
            <Text
              className={`text-sm font-semibold ${
                language === 'JP' ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              JP
            </Text>
          </Pressable>
          <Text className="text-gray-400"> ]</Text>
        </View>
      )}
    </View>
  );
}

export const Header = memo(HeaderComponent);
