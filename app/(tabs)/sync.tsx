import { useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Database } from 'lucide-react-native';

import {
  useExtractData,
  useExtractionStatus,
  useContextData,
  DataCollectionCard,
  ExtractionProgress,
} from '@/features/extraction';
import {
  useCarSync,
  useConnectionStatus,
  ConnectionStatusCard,
  SyncButton,
} from '@/features/connection';

export default function SyncScreen() {
  // Extraction
  const extractMutation = useExtractData();
  const { status: extractionStatus, progress } = useExtractionStatus();
  const contextData = useContextData();

  // Connection
  const syncMutation = useCarSync();
  const {
    status: connectionStatus,
    vehicle,
    transferProgress,
    error: connectionError,
  } = useConnectionStatus();

  const isExtracting =
    extractionStatus !== 'idle' && extractionStatus !== 'complete' && extractionStatus !== 'error';

  const isExtractionComplete = extractionStatus === 'complete' && !!contextData;

  const handleStartExtraction = useCallback(() => {
    extractMutation.mutate();
  }, [extractMutation]);

  const handleSync = useCallback(() => {
    if (contextData) {
      syncMutation.mutate(contextData);
    }
  }, [contextData, syncMutation]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-900">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-white">データ同期</Text>
              <Text className="text-base text-gray-400 mt-1">パーソナルデータを車載器に送信</Text>
            </View>
            <View className="bg-blue-600/20 p-3 rounded-full">
              <Database size={28} color="#60a5fa" />
            </View>
          </View>
        </View>

        {/* データ収集セクション */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-semibold text-white mb-3">Step 1: データ収集</Text>

          {/* 収集開始ボタン */}
          {extractionStatus === 'idle' && (
            <Pressable
              onPress={handleStartExtraction}
              className="bg-blue-600 active:bg-blue-700 rounded-2xl p-5 mb-4"
              style={{
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View className="flex-row items-center justify-center">
                <RefreshCw size={24} color="#ffffff" />
                <Text className="text-lg font-bold text-white ml-3">データ収集を開始</Text>
              </View>
              <Text className="text-sm text-blue-200 text-center mt-2">
                ヘルスケア・検索・購買・カレンダーデータを収集します
              </Text>
            </Pressable>
          )}

          {/* 進捗表示 */}
          {isExtracting && (
            <View className="mb-4">
              <ExtractionProgress progress={progress} isExtracting={isExtracting} />
            </View>
          )}

          {/* 収集データサマリー */}
          <DataCollectionCard contextData={contextData} isComplete={isExtractionComplete} />

          {/* 再収集ボタン */}
          {isExtractionComplete && (
            <Pressable
              onPress={handleStartExtraction}
              className="mt-3 p-3 bg-gray-800 rounded-xl flex-row items-center justify-center"
              disabled={extractMutation.isPending}
            >
              <RefreshCw size={18} color="#9ca3af" />
              <Text className="text-gray-400 ml-2">データを再収集</Text>
            </Pressable>
          )}
        </View>

        {/* 接続・転送セクション */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-semibold text-white mb-3">Step 2: 車載器へ送信</Text>

          <ConnectionStatusCard
            status={connectionStatus}
            vehicle={vehicle}
            transferProgress={transferProgress}
            error={connectionError}
          />
        </View>

        {/* 送信ボタン */}
        <View className="px-5">
          <SyncButton
            status={connectionStatus}
            isExtractionComplete={isExtractionComplete}
            onPress={handleSync}
            disabled={syncMutation.isPending || !isExtractionComplete}
          />

          {!isExtractionComplete && (
            <Text className="text-sm text-gray-500 text-center mt-3">
              データ収集を完了してから送信してください
            </Text>
          )}
        </View>

        {/* デバッグ情報（開発用） */}
        {contextData && (
          <View className="px-5 mt-8">
            <Text className="text-sm text-gray-500 mb-2">デバッグ: LLMコンテキスト</Text>
            <View className="bg-gray-800 p-4 rounded-xl">
              <Text className="text-xs text-gray-400 font-mono">
                version: {contextData.version}
              </Text>
              <Text className="text-xs text-gray-400 font-mono">
                user: {contextData.user.name} ({contextData.user.age}歳)
              </Text>
              <Text className="text-xs text-gray-400 font-mono">
                health: {contextData.extraction.health.currentCondition}
              </Text>
              <Text className="text-xs text-gray-400 font-mono">
                stress: {contextData.extraction.health.stressLevel}
              </Text>
              <Text className="text-xs text-gray-400 font-mono">
                interests: {contextData.extraction.behavior.primaryInterests.slice(0, 3).join(', ')}
              </Text>
              <Text className="text-xs text-gray-400 font-mono">
                hints: {contextData.llmHints.suggestedCategories.join(', ')}
              </Text>
              <Text className="text-xs text-gray-400 font-mono">
                journal: {contextData.journalEntries?.length ?? 0}件
              </Text>
              <Text className="text-xs text-gray-400 font-mono mt-2">
                size: {new TextEncoder().encode(JSON.stringify(contextData)).length} bytes
              </Text>
              <Text className="text-xs text-gray-400 font-mono">
                processing: {contextData.metadata.processingTimeMs}ms
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
