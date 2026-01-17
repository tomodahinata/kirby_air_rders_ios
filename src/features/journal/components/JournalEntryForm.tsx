import { memo, useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import { StarRating } from '@/shared/components/ui/StarRating';
import { Button } from '@/shared/components/ui/Button';
import { AddressInput } from './AddressInput';
import { DateTimePicker } from './DateTimePicker';
import { useJournalStore } from '../store/journalStore';
import { createJournalEntrySchema } from '../types';
import type { Address } from '@/shared/types/schema';

import type { JournalFormState, JournalFormErrors } from '../types';

interface JournalEntryFormProps {
  initialValues?: Partial<JournalFormState>;
  entryId?: string;
  onSuccess?: () => void;
}

const DEFAULT_FORM_STATE: JournalFormState = {
  visited_at: new Date(),
  place_name: '',
  address: {
    country: '日本',
    prefecture: '',
    city: '',
    detail: undefined,
  },
  rating: 0,
  location: undefined,
  notes: undefined,
};

function JournalEntryFormComponent({ initialValues, entryId, onSuccess }: JournalEntryFormProps) {
  const router = useRouter();
  const addEntry = useJournalStore((state) => state.addEntry);
  const updateEntry = useJournalStore((state) => state.updateEntry);

  const [formState, setFormState] = useState<JournalFormState>({
    ...DEFAULT_FORM_STATE,
    ...initialValues,
  });
  const [errors, setErrors] = useState<JournalFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!entryId;

  const handleVisitedAtChange = useCallback((date: Date) => {
    setFormState((prev) => ({ ...prev, visited_at: date }));
    setErrors((prev) => ({ ...prev, visited_at: undefined }));
  }, []);

  const handlePlaceNameChange = useCallback((text: string) => {
    setFormState((prev) => ({ ...prev, place_name: text }));
    setErrors((prev) => ({ ...prev, place_name: undefined }));
  }, []);

  const handleAddressChange = useCallback((address: Address) => {
    setFormState((prev) => ({ ...prev, address }));
    setErrors((prev) => ({ ...prev, address: undefined }));
  }, []);

  const handleRatingChange = useCallback((rating: number) => {
    setFormState((prev) => ({ ...prev, rating }));
    setErrors((prev) => ({ ...prev, rating: undefined }));
  }, []);

  const handleNotesChange = useCallback((text: string) => {
    setFormState((prev) => ({ ...prev, notes: text || undefined }));
    setErrors((prev) => ({ ...prev, notes: undefined }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: JournalFormErrors = {};

    // Place name validation
    if (!formState.place_name.trim()) {
      newErrors.place_name = '場所の名前を入力してください';
    } else if (formState.place_name.length > 100) {
      newErrors.place_name = '100文字以内で入力してください';
    }

    // Address validation
    if (!formState.address.prefecture) {
      newErrors.address = {
        ...newErrors.address,
        prefecture: '都道府県を選択してください',
      };
    }
    if (!formState.address.city.trim()) {
      newErrors.address = {
        ...newErrors.address,
        city: '市区町村を入力してください',
      };
    }

    // Rating validation
    if (formState.rating < 1 || formState.rating > 5) {
      newErrors.rating = '評価を選択してください';
    }

    // Notes validation
    if (formState.notes && formState.notes.length > 500) {
      newErrors.notes = 'メモは500文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const entryData = {
        visited_at: formState.visited_at.toISOString(),
        place_name: formState.place_name.trim(),
        address: {
          country: formState.address.country || '日本',
          prefecture: formState.address.prefecture,
          city: formState.address.city.trim(),
          detail: formState.address.detail?.trim() || undefined,
        },
        rating: formState.rating,
        location: formState.location,
        notes: formState.notes?.trim() || undefined,
      };

      // Validate with Zod
      const result = createJournalEntrySchema.safeParse(entryData);
      if (!result.success) {
        Alert.alert('入力エラー', '入力内容を確認してください');
        console.error('[JournalForm] Validation error:', result.error);
        return;
      }

      if (isEditMode && entryId) {
        updateEntry(entryId, result.data);
      } else {
        addEntry(result.data);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
      }
    } catch (error) {
      console.error('[JournalForm] Submit error:', error);
      Alert.alert('エラー', '保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, validateForm, isEditMode, entryId, addEntry, updateEntry, onSuccess, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-4">
          {/* Visited Date */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <DateTimePicker
              value={formState.visited_at}
              onChange={handleVisitedAtChange}
              mode="datetime"
              label="訪問日時"
              maximumDate={new Date()}
              error={errors.visited_at}
            />
          </View>

          {/* Place Name */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              場所の名前 <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formState.place_name}
              onChangeText={handlePlaceNameChange}
              placeholder="例: 道の駅 富士吉田"
              placeholderTextColor="#9ca3af"
              className={`bg-gray-50 rounded-xl px-4 py-3 text-base text-gray-900 border ${
                errors.place_name ? 'border-red-400' : 'border-gray-200'
              }`}
              maxLength={100}
            />
            {errors.place_name && (
              <Text className="text-sm text-red-500 mt-1">{errors.place_name}</Text>
            )}
            <Text className="text-xs text-gray-400 mt-1 text-right">
              {formState.place_name.length}/100
            </Text>
          </View>

          {/* Address */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">住所</Text>
            <AddressInput
              value={formState.address}
              onChange={handleAddressChange}
              errors={errors.address}
            />
          </View>

          {/* Rating */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              評価 <Text className="text-red-500">*</Text>
            </Text>
            <View className="items-center">
              <StarRating
                value={formState.rating}
                onChange={handleRatingChange}
                size="lg"
                showLabel
              />
            </View>
            {errors.rating && (
              <Text className="text-sm text-red-500 mt-2 text-center">{errors.rating}</Text>
            )}
          </View>

          {/* Notes */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">メモ（任意）</Text>
            <TextInput
              value={formState.notes ?? ''}
              onChangeText={handleNotesChange}
              placeholder="思い出や感想を記録しましょう"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className={`bg-gray-50 rounded-xl px-4 py-3 text-base text-gray-900 border min-h-[120px] ${
                errors.notes ? 'border-red-400' : 'border-gray-200'
              }`}
              maxLength={500}
            />
            {errors.notes && <Text className="text-sm text-red-500 mt-1">{errors.notes}</Text>}
            <Text className="text-xs text-gray-400 mt-1 text-right">
              {formState.notes?.length ?? 0}/500
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8">
        <Button onPress={handleSubmit} size="lg" loading={isSubmitting} disabled={isSubmitting}>
          {isEditMode ? '更新する' : '登録する'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

export const JournalEntryForm = memo(JournalEntryFormComponent);
