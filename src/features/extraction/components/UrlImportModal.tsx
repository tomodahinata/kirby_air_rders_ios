import { memo, useCallback } from 'react';
import { View, Text, Modal, Pressable, Linking } from 'react-native';
import {
  Link2,
  MapPin,
  Utensils,
  Hotel,
  ShoppingBag,
  Calendar,
  X,
  ExternalLink,
  Check,
} from 'lucide-react-native';

import type { UrlIntent } from '../types/realData';

interface UrlImportModalProps {
  visible: boolean;
  urlIntent: UrlIntent | null;
  onImport: (urlIntent: UrlIntent) => void;
  onDismiss: () => void;
  onClose: () => void;
}

/**
 * URL タイプに応じたアイコンを取得
 */
function getUrlTypeIcon(type: UrlIntent['type']) {
  const size = 32;
  const color = '#60a5fa';

  switch (type) {
    case 'maps':
      return <MapPin size={size} color={color} />;
    case 'restaurant':
      return <Utensils size={size} color={color} />;
    case 'hotel':
      return <Hotel size={size} color={color} />;
    case 'shopping':
      return <ShoppingBag size={size} color={color} />;
    case 'event':
      return <Calendar size={size} color={color} />;
    default:
      return <Link2 size={size} color={color} />;
  }
}

/**
 * URL タイプのラベルを取得
 */
function getUrlTypeLabel(type: UrlIntent['type']): string {
  switch (type) {
    case 'maps':
      return '地図・場所';
    case 'restaurant':
      return 'レストラン・グルメ';
    case 'hotel':
      return 'ホテル・宿泊';
    case 'shopping':
      return 'ショッピング';
    case 'event':
      return 'イベント・チケット';
    default:
      return 'ウェブサイト';
  }
}

function UrlImportModalComponent({
  visible,
  urlIntent,
  onImport,
  onDismiss,
  onClose,
}: UrlImportModalProps) {
  const handleOpenUrl = useCallback(() => {
    if (urlIntent?.url) {
      Linking.openURL(urlIntent.url);
    }
  }, [urlIntent?.url]);

  const handleImport = useCallback(() => {
    if (urlIntent) {
      onImport(urlIntent);
    }
  }, [urlIntent, onImport]);

  if (!urlIntent) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-gray-900 rounded-t-3xl px-6 pb-10 pt-6">
          {/* ヘッダー */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-white">URLを検出しました</Text>
            <Pressable onPress={onClose} className="p-2 bg-gray-800 rounded-full">
              <X size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {/* URL 情報 */}
          <View className="bg-gray-800 rounded-2xl p-5 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-blue-600/20 p-3 rounded-xl mr-4">
                {getUrlTypeIcon(urlIntent.type)}
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-400">{getUrlTypeLabel(urlIntent.type)}</Text>
                <Text className="text-base text-white font-medium mt-0.5">{urlIntent.domain}</Text>
              </View>
            </View>

            <View className="bg-gray-700 rounded-xl p-3">
              <Text className="text-sm text-gray-300" numberOfLines={2} ellipsizeMode="middle">
                {urlIntent.url}
              </Text>
            </View>

            <Pressable
              onPress={handleOpenUrl}
              className="flex-row items-center justify-center mt-3 py-2"
            >
              <ExternalLink size={16} color="#60a5fa" />
              <Text className="text-blue-400 ml-2 text-sm">ブラウザで開く</Text>
            </Pressable>
          </View>

          {/* 説明 */}
          <Text className="text-sm text-gray-400 text-center mb-6">
            このURLの情報をナビの目的地候補として取り込みますか？
          </Text>

          {/* アクションボタン */}
          <View className="flex-row gap-3">
            <Pressable onPress={onDismiss} className="flex-1 bg-gray-700 rounded-2xl py-4 px-6">
              <Text className="text-gray-300 text-center text-lg font-semibold">今回は無視</Text>
            </Pressable>

            <Pressable
              onPress={handleImport}
              className="flex-1 bg-blue-600 rounded-2xl py-4 px-6 flex-row items-center justify-center"
            >
              <Check size={20} color="#ffffff" />
              <Text className="text-white text-center text-lg font-semibold ml-2">取り込む</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export const UrlImportModal = memo(UrlImportModalComponent);
