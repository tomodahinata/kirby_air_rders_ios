import * as Linking from 'expo-linking';
import { Platform, Alert } from 'react-native';

/**
 * 目的地情報
 */
interface NavigationDestination {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * 現在地座標
 */
interface CurrentLocation {
  latitude: number;
  longitude: number;
}

/**
 * Google Mapsでルート案内を開始する
 * @param destination 目的地情報（latitude, longitudeは必須）
 * @param currentLocation 現在地（オプション、指定しない場合は現在地から）
 */
export async function openGoogleMapsNavigation(
  destination: NavigationDestination,
  currentLocation?: CurrentLocation
): Promise<boolean> {
  // 座標が必須
  if (destination.latitude === undefined || destination.longitude === undefined) {
    console.error('[Navigation] Latitude and longitude are required');
    Alert.alert('ナビゲーションエラー', '目的地の座標が指定されていません。');
    return false;
  }

  // 目的地パラメータを構築（座標を使用）
  const destinationParam = `${destination.latitude},${destination.longitude}`;

  // 出発地パラメータ
  const originParam = currentLocation
    ? `${currentLocation.latitude},${currentLocation.longitude}`
    : '';

  // Google Maps URL Scheme (iOS/Android)
  const googleMapsAppUrl = Platform.select({
    ios: `comgooglemaps://?${originParam ? `saddr=${originParam}&` : ''}daddr=${destinationParam}&directionsmode=driving`,
    android: `google.navigation:q=${destinationParam}`,
    default: '',
  });

  // Web版 Google Maps URL (フォールバック用)
  const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1${originParam ? `&origin=${originParam}` : ''}&destination=${destinationParam}&travelmode=driving`;

  try {
    // Google Mapsアプリが開けるか確認
    const canOpenApp = await Linking.canOpenURL(googleMapsAppUrl);

    if (canOpenApp && googleMapsAppUrl) {
      console.log('[Navigation] Opening Google Maps app:', googleMapsAppUrl);
      await Linking.openURL(googleMapsAppUrl);
      return true;
    } else {
      // Google Mapsアプリがない場合はWeb版を開く
      console.log('[Navigation] Opening Google Maps web:', googleMapsWebUrl);
      await Linking.openURL(googleMapsWebUrl);
      return true;
    }
  } catch (error) {
    console.error('[Navigation] Failed to open Google Maps:', error);
    Alert.alert('ナビゲーションエラー', 'Google Mapsを開けませんでした。', [{ text: 'OK' }]);
    return false;
  }
}

/**
 * Apple Mapsでルート案内を開始する (iOSのみ)
 */
export async function openAppleMapsNavigation(
  destination: NavigationDestination,
  currentLocation?: CurrentLocation
): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    console.warn('[Navigation] Apple Maps is only available on iOS');
    return false;
  }

  let destinationParam: string;

  if (destination.latitude !== undefined && destination.longitude !== undefined) {
    destinationParam = `${destination.latitude},${destination.longitude}`;
  } else if (destination.address) {
    destinationParam = encodeURIComponent(destination.address);
  } else {
    destinationParam = encodeURIComponent(destination.name);
  }

  const originParam = currentLocation
    ? `saddr=${currentLocation.latitude},${currentLocation.longitude}&`
    : '';

  const appleMapsUrl = `maps://?${originParam}daddr=${destinationParam}&dirflg=d`;

  try {
    console.log('[Navigation] Opening Apple Maps:', appleMapsUrl);
    await Linking.openURL(appleMapsUrl);
    return true;
  } catch (error) {
    console.error('[Navigation] Failed to open Apple Maps:', error);
    return false;
  }
}

/**
 * プラットフォームに応じたナビゲーションアプリを開く
 * iOS: Google Maps優先、なければApple Maps
 * Android: Google Maps
 */
export async function openNavigation(
  destination: NavigationDestination,
  currentLocation?: CurrentLocation
): Promise<boolean> {
  // まずGoogle Mapsを試す
  const googleMapsOpened = await openGoogleMapsNavigation(destination, currentLocation);

  if (!googleMapsOpened && Platform.OS === 'ios') {
    // Google Mapsが開けなかった場合、iOSならApple Mapsを試す
    return await openAppleMapsNavigation(destination, currentLocation);
  }

  return googleMapsOpened;
}
