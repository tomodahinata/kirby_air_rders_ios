import { memo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

import { loggers } from '@/shared/lib/logger';

const log = loggers.navigation;

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

/**
 * 座標
 */
interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * ナビゲーションマップのProps
 */
interface NavigationMapProps {
  /** 現在地 */
  origin: Coordinate | null;
  /** 目的地 */
  destination: Coordinate | null;
  /** ルート取得完了時のコールバック */
  onRouteReady?: (result: { distance: number; duration: number }) => void;
  /** エラー時のコールバック */
  onError?: (error: string) => void;
  /** 地図のスタイル（暗めのテーマ用） */
  darkMode?: boolean;
}

/**
 * ダークモード用の地図スタイル
 */
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#304a7d' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#255763' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2c6675' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
];

/**
 * デフォルトのリージョン（東京）
 */
const DEFAULT_REGION: Region = {
  latitude: 35.6762,
  longitude: 139.6503,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * ナビゲーションマップコンポーネント
 * 現在地から目的地へのルートを地図上に表示
 */
function NavigationMapComponent({
  origin,
  destination,
  onRouteReady,
  onError,
  darkMode = true,
}: NavigationMapProps) {
  const mapRef = useRef<MapView>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  // 地図の初期位置を設定
  const initialRegion: Region = origin
    ? {
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : DEFAULT_REGION;

  // origin または destination が変更されたときに地図をフィット
  useEffect(() => {
    if (mapRef.current && origin && destination) {
      // 両方のマーカーが見えるように地図をフィット
      mapRef.current.fitToCoordinates([origin, destination], {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    } else if (mapRef.current && origin) {
      // 現在地のみの場合
      mapRef.current.animateToRegion({
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [origin, destination]);

  // ルート取得成功時
  const handleRouteReady = (result: { distance: number; duration: number }) => {
    setIsLoading(false);
    setRouteInfo(result);
    onRouteReady?.(result);
  };

  // ルート取得エラー時
  const handleRouteError = (errorMessage: string) => {
    setIsLoading(false);
    log.error('Route error:', errorMessage);
    onError?.(errorMessage);
  };

  // ルート取得開始時
  const handleRouteStart = () => {
    setIsLoading(true);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        customMapStyle={darkMode ? darkMapStyle : undefined}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={true}
        pitchEnabled={true}
      >
        {/* 現在地マーカー（カスタム） */}
        {origin && (
          <Marker coordinate={origin} title="現在地" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.originMarker}>
              <View style={styles.originMarkerInner} />
            </View>
          </Marker>
        )}

        {/* 目的地マーカー */}
        {destination && <Marker coordinate={destination} title="目的地" pinColor="#ef4444" />}

        {/* ルート表示 */}
        {origin && destination && GOOGLE_MAPS_API_KEY && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={5}
            strokeColor="#3b82f6"
            optimizeWaypoints={true}
            onStart={handleRouteStart}
            onReady={handleRouteReady}
            onError={handleRouteError}
          />
        )}
      </MapView>

      {/* ローディングインジケーター */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>ルートを取得中...</Text>
        </View>
      )}

      {/* ルート情報表示 */}
      {routeInfo && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeInfoItem}>
            <Text style={styles.routeInfoValue}>{Math.round(routeInfo.duration)} 分</Text>
            <Text style={styles.routeInfoLabel}>所要時間</Text>
          </View>
          <View style={styles.routeInfoDivider} />
          <View style={styles.routeInfoItem}>
            <Text style={styles.routeInfoValue}>{routeInfo.distance.toFixed(1)} km</Text>
            <Text style={styles.routeInfoLabel}>距離</Text>
          </View>
        </View>
      )}

      {/* APIキー未設定の警告 */}
      {!GOOGLE_MAPS_API_KEY && destination && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>Google Maps APIキーが設定されていません</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  originMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 8,
    fontSize: 14,
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfoItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  routeInfoValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  routeInfoLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  routeInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#475569',
  },
  warningContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
});

export const NavigationMap = memo(NavigationMapComponent);
