import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MapPin, Calendar, Star, Pencil, Trash2, Navigation } from 'lucide-react-native';

import { Button } from '@/shared/components/ui/Button';
import { useJournalStore, JournalEntryForm } from '@/features/journal';

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekDay = weekDays[date.getDay()];
  return `${year}年${month}月${day}日（${weekDay}）${hours}:${minutes}`;
}

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const entries = useJournalStore((s) => s.entries);
  const deleteEntry = useJournalStore((s) => s.deleteEntry);

  const [isEditing, setIsEditing] = useState(false);

  const entry = useMemo(() => entries.find((e) => e.id === id), [entries, id]);

  const handleDelete = useCallback(() => {
    Alert.alert('記録を削除', 'この記録を削除してもよろしいですか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          if (id) {
            deleteEntry(id);
            router.back();
          }
        },
      },
    ]);
  }, [id, deleteEntry, router]);

  const handleEditSuccess = useCallback(() => {
    setIsEditing(false);
  }, []);

  if (!entry) {
    return (
      <SafeAreaView className="flex-1 bg-surface-base items-center justify-center">
        <Text className="text-text-secondary">記録が見つかりません</Text>
        <Button onPress={() => router.back()} size="md" className="mt-4">
          戻る
        </Button>
      </SafeAreaView>
    );
  }

  if (isEditing) {
    return (
      <>
        <Stack.Screen options={{ title: '記録を編集' }} />
        <JournalEntryForm
          entryId={entry.id}
          initialValues={{
            visited_at: new Date(entry.visited_at),
            place_name: entry.place_name,
            address: entry.address,
            rating: entry.rating,
            location: entry.location,
            notes: entry.notes,
          }}
          onSuccess={handleEditSuccess}
        />
      </>
    );
  }

  const fullAddress = [entry.address.prefecture, entry.address.city, entry.address.detail]
    .filter(Boolean)
    .join(' ');

  return (
    <SafeAreaView className="flex-1 bg-surface-base">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Place Name Header */}
        <View className="bg-surface-elevated px-4 py-6 border-b border-slate-700">
          <Text className="text-car-2xl font-bold text-text-primary mb-2">{entry.place_name}</Text>

          {/* Rating */}
          <View className="flex-row items-center">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={24}
                color={i < entry.rating ? '#f59e0b' : '#475569'}
                fill={i < entry.rating ? '#f59e0b' : 'transparent'}
              />
            ))}
          </View>
        </View>

        {/* Details */}
        <View className="bg-surface-elevated mt-3 px-4 py-4">
          {/* Visited Date */}
          <View className="flex-row items-center py-3 border-b border-slate-700">
            <Calendar size={20} color="#94a3b8" />
            <View className="ml-3">
              <Text className="text-car-sm text-text-muted">訪問日時</Text>
              <Text className="text-car-base text-text-primary">
                {formatDateTime(entry.visited_at)}
              </Text>
            </View>
          </View>

          {/* Address */}
          <View className="flex-row items-start py-3">
            <MapPin size={20} color="#94a3b8" className="mt-1" />
            <View className="ml-3 flex-1">
              <Text className="text-car-sm text-text-muted">住所</Text>
              <Text className="text-car-base text-text-primary">{fullAddress}</Text>
            </View>
          </View>

          {/* Navigation Button */}
          {entry.location && (
            <Pressable
              onPress={() => {
                // TODO: Open in maps app with Linking.openURL
                // const url = `https://www.google.com/maps/dir/?api=1&destination=${entry.location?.lat},${entry.location?.lng}`;
              }}
              accessibilityRole="button"
              accessibilityLabel="ナビを開始"
              className="flex-row items-center justify-center bg-primary-600/20 rounded-xl py-4 mt-2 min-h-[52px]"
            >
              <Navigation size={18} color="#60a5fa" />
              <Text className="text-primary-400 font-medium ml-2 text-car-base">ナビを開始</Text>
            </Pressable>
          )}
        </View>

        {/* Notes */}
        {entry.notes && (
          <View className="bg-surface-elevated mt-3 px-4 py-4">
            <Text className="text-car-sm text-text-muted mb-2">メモ</Text>
            <Text className="text-car-base text-text-primary leading-6">{entry.notes}</Text>
          </View>
        )}

        {/* Metadata */}
        <View className="px-4 py-4">
          <Text className="text-car-sm text-text-muted">
            作成: {new Date(entry.created_at).toLocaleDateString('ja-JP')}
          </Text>
          {entry.updated_at !== entry.created_at && (
            <Text className="text-car-sm text-text-muted mt-1">
              更新: {new Date(entry.updated_at).toLocaleDateString('ja-JP')}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface-elevated border-t border-slate-700 p-4 pb-8 flex-row gap-3">
        <Button
          onPress={handleDelete}
          variant="danger"
          size="lg"
          icon={<Trash2 size={18} color="#fff" />}
          className="flex-1"
        >
          削除
        </Button>
        <Button
          onPress={() => setIsEditing(true)}
          size="lg"
          icon={<Pencil size={18} color="#fff" />}
          className="flex-1"
        >
          編集
        </Button>
      </View>
    </SafeAreaView>
  );
}
