import { memo, useCallback } from 'react';
import { View, Text, Switch, Pressable, ActivityIndicator } from 'react-native';
import {
  Heart,
  Calendar,
  Clipboard,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Info,
} from 'lucide-react-native';

import type { DataSourceStatus, DataSourceSettings } from '../types/realData';

interface DataSourceItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isEnabled: boolean;
  isAvailable: boolean;
  isAuthorized: boolean;
  isLoading?: boolean;
  lastSync?: string;
  error?: string;
  isUsingMock?: boolean;
  onToggle: (enabled: boolean) => void;
  onRequestPermission?: () => void;
  onSync?: () => void;
}

function DataSourceItemComponent({
  icon,
  title,
  description,
  isEnabled,
  isAvailable,
  isAuthorized,
  isLoading = false,
  lastSync,
  error,
  isUsingMock = false,
  onToggle,
  onRequestPermission,
  onSync,
}: DataSourceItemProps) {
  const getStatusIcon = () => {
    if (!isAvailable) {
      return <XCircle size={18} color="#6b7280" />;
    }
    if (error) {
      return <AlertCircle size={18} color="#f59e0b" />;
    }
    if (isAuthorized && lastSync) {
      return <CheckCircle size={18} color="#22c55e" />;
    }
    if (!isAuthorized) {
      return <AlertCircle size={18} color="#f59e0b" />;
    }
    return null;
  };

  const getStatusText = () => {
    if (!isAvailable) {
      return 'この環境では利用不可';
    }
    if (error) {
      return error;
    }
    if (isUsingMock) {
      return 'モックデータを使用中';
    }
    if (isAuthorized && lastSync) {
      const date = new Date(lastSync);
      return `最終同期: ${date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (!isAuthorized) {
      return '権限が必要です';
    }
    return '未接続';
  };

  return (
    <View className="bg-gray-800 rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between">
        {/* 左側: アイコンと情報 */}
        <View className="flex-row items-center flex-1">
          <View className="bg-gray-700 p-3 rounded-xl mr-4">{icon}</View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-white">{title}</Text>
            <Text className="text-sm text-gray-400 mt-0.5">{description}</Text>
          </View>
        </View>

        {/* 右側: スイッチ */}
        <Switch
          value={isEnabled && isAvailable}
          onValueChange={onToggle}
          disabled={!isAvailable}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={isEnabled && isAvailable ? '#ffffff' : '#9ca3af'}
        />
      </View>

      {/* ステータス行 */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-700">
        <View className="flex-row items-center">
          {getStatusIcon()}
          <Text className={`text-xs ml-2 ${error ? 'text-amber-400' : 'text-gray-500'}`}>
            {getStatusText()}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {/* 権限リクエストボタン */}
          {isAvailable && !isAuthorized && onRequestPermission && (
            <Pressable onPress={onRequestPermission} className="bg-blue-600 px-3 py-1.5 rounded-lg">
              <Text className="text-xs text-white font-medium">許可する</Text>
            </Pressable>
          )}

          {/* 同期ボタン */}
          {isAvailable && isEnabled && onSync && (
            <Pressable onPress={onSync} disabled={isLoading} className="bg-gray-700 p-2 rounded-lg">
              {isLoading ? (
                <ActivityIndicator size="small" color="#60a5fa" />
              ) : (
                <RefreshCw size={16} color="#9ca3af" />
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const DataSourceItem = memo(DataSourceItemComponent);

interface DataSourceManagerProps {
  settings: DataSourceSettings;
  status: DataSourceStatus;
  healthData: {
    isLoading: boolean;
    isUsingMock: boolean;
    fetch: () => void;
    requestPermission: () => Promise<boolean>;
  };
  calendarData: {
    isLoading: boolean;
    isUsingMock: boolean;
    fetch: () => void;
    requestPermission: () => Promise<boolean>;
  };
  environment: {
    type: 'expo-go' | 'dev-client' | 'standalone';
    isNativeAvailable: boolean;
    platform: string;
  };
  onSettingsChange: (settings: Partial<DataSourceSettings>) => void;
}

function DataSourceManagerComponent({
  settings,
  status,
  healthData,
  calendarData,
  environment,
  onSettingsChange,
}: DataSourceManagerProps) {
  const handleHealthKitToggle = useCallback(
    (enabled: boolean) => {
      onSettingsChange({ useHealthKit: enabled });
    },
    [onSettingsChange]
  );

  const handleCalendarToggle = useCallback(
    (enabled: boolean) => {
      onSettingsChange({ useCalendar: enabled });
    },
    [onSettingsChange]
  );

  const handleClipboardToggle = useCallback(
    (enabled: boolean) => {
      onSettingsChange({ useClipboard: enabled });
    },
    [onSettingsChange]
  );

  const handleMockFallbackToggle = useCallback(
    (enabled: boolean) => {
      onSettingsChange({ useMockFallback: enabled });
    },
    [onSettingsChange]
  );

  return (
    <View>
      {/* 環境情報バナー */}
      <View className="bg-gray-800 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center">
          <Smartphone size={20} color="#60a5fa" />
          <Text className="text-sm text-gray-300 ml-3 flex-1">
            実行環境:{' '}
            <Text className="text-white font-medium">
              {environment.type === 'expo-go'
                ? 'Expo Go'
                : environment.type === 'dev-client'
                  ? 'Development Build'
                  : 'Standalone App'}
            </Text>
          </Text>
        </View>
        {environment.type === 'expo-go' && (
          <View className="flex-row items-start mt-3 p-3 bg-amber-900/30 rounded-xl">
            <Info size={16} color="#f59e0b" />
            <Text className="text-xs text-amber-200 ml-2 flex-1">
              Expo Goではネイティブモジュール（HealthKit等）が制限されます。
              実機ビルドを使用することで全機能が利用可能になります。
            </Text>
          </View>
        )}
      </View>

      {/* データソース一覧 */}
      <Text className="text-lg font-semibold text-white mb-3">データソース</Text>

      {/* HealthKit */}
      <DataSourceItem
        icon={<Heart size={24} color="#ef4444" />}
        title="ヘルスケア"
        description="心拍数、歩数、睡眠データを取得"
        isEnabled={settings.useHealthKit}
        isAvailable={status.healthKit.available}
        isAuthorized={status.healthKit.authorized}
        isLoading={healthData.isLoading}
        lastSync={status.healthKit.lastSync}
        error={status.healthKit.error}
        isUsingMock={healthData.isUsingMock}
        onToggle={handleHealthKitToggle}
        onRequestPermission={healthData.requestPermission}
        onSync={healthData.fetch}
      />

      {/* Calendar */}
      <DataSourceItem
        icon={<Calendar size={24} color="#8b5cf6" />}
        title="カレンダー"
        description="予定から行き先のヒントを取得"
        isEnabled={settings.useCalendar}
        isAvailable={status.calendar.available}
        isAuthorized={status.calendar.authorized}
        isLoading={calendarData.isLoading}
        lastSync={status.calendar.lastSync}
        error={status.calendar.error}
        isUsingMock={calendarData.isUsingMock}
        onToggle={handleCalendarToggle}
        onRequestPermission={calendarData.requestPermission}
        onSync={calendarData.fetch}
      />

      {/* Clipboard */}
      <DataSourceItem
        icon={<Clipboard size={24} color="#22c55e" />}
        title="クリップボード"
        description="コピーしたURLから行き先を検出"
        isEnabled={settings.useClipboard}
        isAvailable={true}
        isAuthorized={true}
        onToggle={handleClipboardToggle}
      />

      {/* 設定 */}
      <Text className="text-lg font-semibold text-white mt-6 mb-3">設定</Text>

      <View className="bg-gray-800 rounded-2xl p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base text-white">モックデータフォールバック</Text>
            <Text className="text-sm text-gray-400 mt-0.5">
              実データ取得に失敗した場合、モックデータを使用
            </Text>
          </View>
          <Switch
            value={settings.useMockFallback}
            onValueChange={handleMockFallbackToggle}
            trackColor={{ false: '#374151', true: '#3b82f6' }}
            thumbColor={settings.useMockFallback ? '#ffffff' : '#9ca3af'}
          />
        </View>
      </View>
    </View>
  );
}

export const DataSourceManager = memo(DataSourceManagerComponent);
