import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NavigationMap } from '@/features/navigation/components/NavigationMap';
import { RouteInfoCard } from '@/features/navigation/components/RouteInfoCard';
import { AISuggestionPopup } from '@/features/suggestion/components/AISuggestionPopup';
import { MiniSuggestionCard } from '@/features/suggestion/components/MiniSuggestionCard';
import { PlaceDetailSheet } from '@/features/suggestion/components/PlaceDetailSheet';
import { useVoiceChat, VoiceInputScreen, AgentConsultBar } from '@/features/voice-chat';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { UserBadge } from '@/shared/components/ui/UserBadge';
import { AgentConsultCard } from '@/shared/components/ui/AgentConsultCard';
import { DestinationBottomSheet } from '@/shared/components/ui/DestinationBottomSheet';
import { LocationTargetButton } from '@/shared/components/ui/LocationTargetButton';

type ScreenMode = 'home' | 'navigation';

// デモ用の場所データ
const DEMO_PLACES = {
  scenic: {
    name: '絶景休憩スポット',
    address: '山梨県南都留郡富士河口湖町',
    rating: 4.6,
    reviewCount: 856,
    imageUrl: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800',
    aiMatchMessage: '過去の履歴にマッチしています',
    additionalMinutes: 10,
    estimatedArrival: '15:45',
  },
  rest: {
    name: 'ブルーボトルコーヒー',
    address: '東京都港区南青山 3-13-14',
    rating: 4.8,
    reviewCount: 1240,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    aiMatchMessage: '深煎りの好みにマッチしています',
    additionalMinutes: 5,
    estimatedArrival: '16:15',
  },
};

export function CopilotScreen() {
  // Screen mode state
  const [screenMode, setScreenMode] = useState<ScreenMode>('home');
  const [searchQuery, setSearchQuery] = useState('');

  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [showSuggestionPopup, setShowSuggestionPopup] = useState(true);
  const [showMiniSuggestion, setShowMiniSuggestion] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<'scenic' | 'rest' | null>(null);

  const {
    currentTranscript,
    destination,
    location,
    error,
    isConnected,
    isListening,
    isProcessing,
    isSpeaking,
    connect,
    startListening,
    stopListening,
    clearError,
  } = useVoiceChat({
    onError: (err) => {
      Alert.alert('エラー', err.message);
    },
  });

  // 現在地の座標
  const origin = useMemo(() => {
    if (!location?.coordinates) return null;
    return {
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
    };
  }, [location]);

  // 目的地の座標
  const destinationCoord = useMemo(() => {
    if (!destination) return null;
    return {
      latitude: destination.latitude,
      longitude: destination.longitude,
    };
  }, [destination]);

  // Switch to navigation mode when destination is set
  useEffect(() => {
    if (destination) {
      setScreenMode('navigation');
    }
  }, [destination]);

  const handleAgentPress = useCallback(async () => {
    try {
      if (!isConnected) {
        await connect();
      }
      setIsVoiceInputActive(true);
      await startListening();
    } catch {
      Alert.alert('エラー', '音声入力を開始できませんでした');
    }
  }, [isConnected, connect, startListening]);

  const handleStartListening = useCallback(async () => {
    try {
      await startListening();
    } catch {
      Alert.alert('録音エラー', 'マイクにアクセスできませんでした');
    }
  }, [startListening]);

  const handleStopListening = useCallback(async () => {
    try {
      await stopListening();
    } catch {
      Alert.alert('録音エラー', '録音の停止に失敗しました');
    }
  }, [stopListening]);

  const handleCancelVoiceInput = useCallback(() => {
    setIsVoiceInputActive(false);
    stopListening();
  }, [stopListening]);

  const handleQuickAction = useCallback((actionId: string) => {
    console.log('Quick action selected:', actionId);
  }, []);

  const handleAddSuggestion = useCallback((type: string) => {
    console.log('Add suggestion:', type);
    if (type === 'scenic') {
      setShowSuggestionPopup(false);
    } else if (type === 'rest') {
      setShowMiniSuggestion(false);
    }
    setSelectedPlace(null);
  }, []);

  const handleViewDetails = useCallback((type: 'scenic' | 'rest') => {
    console.log('View details:', type);
    setSelectedPlace(type);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  const handleAskAI = useCallback(() => {
    setSelectedPlace(null);
    handleAgentPress();
  }, [handleAgentPress]);

  const handleUserPress = useCallback(() => {
    console.log('User menu pressed');
  }, []);

  const handleSearchFocus = useCallback(() => {
    console.log('Search focused');
  }, []);

  const handleHistoryPress = useCallback(() => {
    console.log('History pressed');
    // Navigate to history screen or show history modal
  }, []);

  const handleHomePress = useCallback(() => {
    console.log('Home pressed');
    // Set destination to home and switch to navigation mode
    setScreenMode('navigation');
  }, []);

  const handleLocationTarget = useCallback(() => {
    console.log('Location target pressed');
    // Center map on current location
  }, []);

  // エラー表示
  if (error) {
    Alert.alert('エラー', error, [{ text: 'OK', onPress: clearError }]);
  }

  // デモ用のルート情報（実際は destination から取得）
  const routeInfo = {
    destination: destination?.name || '富士山',
    durationHours: 2,
    durationMinutes: 30,
  };

  // 選択された場所のデータ
  const selectedPlaceData = selectedPlace ? DEMO_PLACES[selectedPlace] : null;

  return (
    <View className="flex-1 bg-slate-100">
      {/* 背景: ナビゲーションマップ */}
      <View className="absolute inset-0">
        <NavigationMap
          origin={origin}
          destination={screenMode === 'navigation' ? destinationCoord : null}
          darkMode={false}
          onRouteReady={(result) => {
            console.log('[CopilotScreen] Route ready:', result);
          }}
          onError={(err) => {
            console.error('[CopilotScreen] Route error:', err);
          }}
        />
      </View>

      {/* Home Mode UI */}
      {screenMode === 'home' && (
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          {/* Header: Search Bar + User Badge */}
          <View className="px-4 pt-4">
            <View className="flex-row items-center">
              <View className="flex-1 mr-3">
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={handleSearchFocus}
                  placeholder="行き先を検索"
                />
              </View>
              <UserBadge name="Taro" onPress={handleUserPress} />
            </View>
          </View>

          {/* Agent Consult Card */}
          <View className="px-4 mt-4">
            <AgentConsultCard onPress={handleAgentPress} isListening={isListening} />
          </View>

          {/* Spacer to push bottom sheet down */}
          <View className="flex-1" />

          {/* Location Target Button - positioned above DestinationBottomSheet and TabBar */}
          <View className="absolute bottom-60 right-4">
            <LocationTargetButton onPress={handleLocationTarget} />
          </View>

          {/* Destination Bottom Sheet */}
          <DestinationBottomSheet
            onHistoryPress={handleHistoryPress}
            onHomePress={handleHomePress}
          />
        </SafeAreaView>
      )}

      {/* Navigation Mode UI */}
      {screenMode === 'navigation' && (
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          {/* 上部: ルート情報カード */}
          <RouteInfoCard
            destination={routeInfo.destination}
            subtitle="提案経由地を含む最適ルート"
            durationHours={routeInfo.durationHours}
            durationMinutes={routeInfo.durationMinutes}
            userInitial="T"
            onUserPress={handleUserPress}
          />

          {/* 中央: AI提案ポップアップ */}
          <View className="flex-1 justify-center">
            {showSuggestionPopup && (
              <AISuggestionPopup
                type="scenic"
                title="絶景休憩スポット"
                description="過去の履歴とスケジュールに基づいた景色の良い立ち寄りをおすすめします"
                onAdd={() => handleAddSuggestion('scenic')}
                onDetails={() => handleViewDetails('scenic')}
              />
            )}

            {/* 小さな提案カード（画面右寄り） - positioned above AgentConsultBar and TabBar */}
            {showMiniSuggestion && (
              <View className="absolute right-4 bottom-44">
                <MiniSuggestionCard
                  label="おすすめの休憩"
                  message="コーヒーブレイクはいかがですか？"
                  labelColor="#3b82f6"
                  onAdd={() => handleAddSuggestion('rest')}
                  onDetails={() => handleViewDetails('rest')}
                />
              </View>
            )}
          </View>

          {/* 下部: Agent相談バー */}
          <AgentConsultBar
            isListening={isListening}
            isConnected={isConnected}
            onPress={handleAgentPress}
          />
        </SafeAreaView>
      )}

      {/* Place Detail Sheet */}
      {selectedPlace !== null && selectedPlaceData && (
        <PlaceDetailSheet
          isVisible={true}
          place={{
            name: selectedPlaceData.name,
            address: selectedPlaceData.address,
            imageUrl: selectedPlaceData.imageUrl,
            rating: selectedPlaceData.rating,
            reviewCount: selectedPlaceData.reviewCount,
          }}
          aiMatchMessage={selectedPlaceData.aiMatchMessage}
          additionalMinutes={selectedPlaceData.additionalMinutes}
          estimatedArrival={selectedPlaceData.estimatedArrival}
          userName="Taro"
          onAdd={() => handleAddSuggestion(selectedPlace)}
          onCancel={handleCloseDetails}
          onAskAI={handleAskAI}
          onUserPress={handleUserPress}
        />
      )}

      {/* Voice Input Screen Overlay */}
      <VoiceInputScreen
        isVisible={isVoiceInputActive}
        isConnected={isConnected}
        isListening={isListening}
        isProcessing={isProcessing}
        isSpeaking={isSpeaking}
        currentTranscript={currentTranscript}
        onStartListening={handleStartListening}
        onStopListening={handleStopListening}
        onCancel={handleCancelVoiceInput}
        onQuickAction={handleQuickAction}
      />
    </View>
  );
}
