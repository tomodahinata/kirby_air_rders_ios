import { memo, useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, SafeAreaView } from 'react-native';
import { ChevronDown, X, Check } from 'lucide-react-native';

import { PREFECTURES, type Prefecture } from '../types';
import type { Address } from '@/shared/types/schema';

interface AddressInputProps {
  value: Address;
  onChange: (address: Address) => void;
  errors?: {
    prefecture?: string;
    city?: string;
  };
  className?: string;
}

function AddressInputComponent({ value, onChange, errors, className = '' }: AddressInputProps) {
  const [showPrefecturePicker, setShowPrefecturePicker] = useState(false);

  const handlePrefectureSelect = useCallback(
    (prefecture: Prefecture) => {
      onChange({ ...value, prefecture });
      setShowPrefecturePicker(false);
    },
    [value, onChange]
  );

  const handleCityChange = useCallback(
    (city: string) => {
      onChange({ ...value, city });
    },
    [value, onChange]
  );

  const handleDetailChange = useCallback(
    (detail: string) => {
      onChange({ ...value, detail: detail || undefined });
    },
    [value, onChange]
  );

  const renderPrefectureItem = useCallback(
    ({ item }: { item: Prefecture }) => {
      const isSelected = item === value.prefecture;
      return (
        <Pressable
          onPress={() => handlePrefectureSelect(item)}
          className={`flex-row items-center justify-between px-4 py-3 border-b border-gray-100 ${
            isSelected ? 'bg-orange-50' : 'active:bg-gray-50'
          }`}
        >
          <Text
            className={`text-base ${isSelected ? 'text-orange-600 font-semibold' : 'text-gray-800'}`}
          >
            {item}
          </Text>
          {isSelected && <Check size={20} color="#ea580c" />}
        </Pressable>
      );
    },
    [value.prefecture, handlePrefectureSelect]
  );

  return (
    <View className={className}>
      {/* Prefecture Selector */}
      <View className="mb-3">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          都道府県 <Text className="text-red-500">*</Text>
        </Text>
        <Pressable
          onPress={() => setShowPrefecturePicker(true)}
          className={`flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border ${
            errors?.prefecture ? 'border-red-400' : 'border-gray-200'
          }`}
        >
          <Text className={`text-base ${value.prefecture ? 'text-gray-900' : 'text-gray-400'}`}>
            {value.prefecture || '選択してください'}
          </Text>
          <ChevronDown size={20} color="#9ca3af" />
        </Pressable>
        {errors?.prefecture && (
          <Text className="text-sm text-red-500 mt-1">{errors.prefecture}</Text>
        )}
      </View>

      {/* City Input */}
      <View className="mb-3">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          市区町村 <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={value.city}
          onChangeText={handleCityChange}
          placeholder="例: 渋谷区"
          placeholderTextColor="#9ca3af"
          className={`bg-gray-50 rounded-xl px-4 py-3 text-base text-gray-900 border ${
            errors?.city ? 'border-red-400' : 'border-gray-200'
          }`}
        />
        {errors?.city && <Text className="text-sm text-red-500 mt-1">{errors.city}</Text>}
      </View>

      {/* Detail Input (Optional) */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1">詳細住所（任意）</Text>
        <TextInput
          value={value.detail ?? ''}
          onChangeText={handleDetailChange}
          placeholder="例: 道玄坂1-2-3"
          placeholderTextColor="#9ca3af"
          className="bg-gray-50 rounded-xl px-4 py-3 text-base text-gray-900 border border-gray-200"
        />
      </View>

      {/* Prefecture Picker Modal */}
      <Modal
        visible={showPrefecturePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrefecturePicker(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <Pressable onPress={() => setShowPrefecturePicker(false)} className="p-2">
              <X size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">都道府県を選択</Text>
            <View className="w-10" />
          </View>

          {/* Prefecture List */}
          <FlatList
            data={PREFECTURES}
            renderItem={renderPrefectureItem}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export const AddressInput = memo(AddressInputComponent);
