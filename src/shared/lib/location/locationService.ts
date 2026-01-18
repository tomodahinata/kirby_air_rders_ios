import * as Location from 'expo-location';

import { loggers } from '@/shared/lib/logger';
import {
  type LocationData,
  type LocationCoordinates,
  type Address,
  type LocationPermissionStatus,
  type LocationOptions,
  DEFAULT_LOCATION_OPTIONS,
} from './schema';

const log = loggers.location;

/**
 * 位置情報サービスエラー
 */
export class LocationError extends Error {
  constructor(
    message: string,
    public readonly code: 'PERMISSION_DENIED' | 'TIMEOUT' | 'UNAVAILABLE' | 'UNKNOWN' = 'UNKNOWN'
  ) {
    super(message);
    this.name = 'LocationError';
    Object.setPrototypeOf(this, LocationError.prototype);
  }
}

/**
 * 位置情報権限の状態を確認
 */
export async function checkLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    switch (status) {
      case Location.PermissionStatus.GRANTED:
        return 'granted';
      case Location.PermissionStatus.DENIED:
        return 'denied';
      default:
        return 'undetermined';
    }
  } catch (error) {
    log.error('Permission check error:', error);
    return 'undetermined';
  }
}

/**
 * 位置情報権限をリクエスト
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    log.debug('Requesting foreground permission...');
    const { status } = await Location.requestForegroundPermissionsAsync();

    const result: LocationPermissionStatus =
      status === Location.PermissionStatus.GRANTED ? 'granted' : 'denied';

    log.debug(`Permission result: ${result}`);
    return result;
  } catch (error) {
    log.error('Permission request error:', error);
    return 'denied';
  }
}

/**
 * 位置情報サービスが有効かどうかを確認
 */
export async function isLocationServicesEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    log.error('Services check error:', error);
    return false;
  }
}

/**
 * 現在位置を取得
 */
export async function getCurrentLocation(options: LocationOptions = {}): Promise<LocationData> {
  const opts = { ...DEFAULT_LOCATION_OPTIONS, ...options };

  log.debug('Getting current location...', opts);

  // 権限を確認
  let permissionStatus = await checkLocationPermission();
  if (permissionStatus === 'undetermined') {
    permissionStatus = await requestLocationPermission();
  }

  if (permissionStatus !== 'granted') {
    throw new LocationError('位置情報の権限が許可されていません', 'PERMISSION_DENIED');
  }

  // 位置情報サービスが有効か確認
  const servicesEnabled = await isLocationServicesEnabled();
  if (!servicesEnabled) {
    throw new LocationError(
      '位置情報サービスが無効です。設定から有効にしてください。',
      'UNAVAILABLE'
    );
  }

  // 位置情報を取得（タイムアウト付き）
  const locationPromise = Location.getCurrentPositionAsync({
    accuracy: opts.highAccuracy ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new LocationError(`位置情報の取得がタイムアウトしました（${opts.timeout}ms）`, 'TIMEOUT')
      );
    }, opts.timeout);
  });

  let location: Location.LocationObject;
  try {
    location = await Promise.race([locationPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof LocationError) {
      throw error;
    }
    throw new LocationError(
      error instanceof Error ? error.message : '位置情報の取得に失敗しました',
      'UNKNOWN'
    );
  }

  log.debug('Position obtained:', {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    accuracy: location.coords.accuracy,
  });

  // 座標データを変換
  const coordinates: LocationCoordinates = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    altitude: location.coords.altitude,
    altitudeAccuracy: location.coords.altitudeAccuracy,
    heading: location.coords.heading,
    speed: location.coords.speed,
  };

  // 住所情報を取得（オプション）
  let address: Address | null = null;
  if (opts.includeAddress) {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const addr = addresses[0];
      if (addr) {
        address = {
          city: addr.city,
          country: addr.country,
          district: addr.district,
          isoCountryCode: addr.isoCountryCode,
          name: addr.name,
          postalCode: addr.postalCode,
          region: addr.region,
          street: addr.street,
          streetNumber: addr.streetNumber,
          subregion: addr.subregion,
          timezone: addr.timezone,
        };
        log.debug('Address obtained:', address.city, address.region);
      }
    } catch (error) {
      // 住所取得失敗は致命的ではないのでログのみ
      log.warn('Reverse geocode failed:', error);
    }
  }

  const locationData: LocationData = {
    coordinates,
    address,
    timestamp: new Date().toISOString(),
  };

  return locationData;
}

/**
 * 位置情報を安全に取得（エラー時はnullを返す）
 * UIブロッキングを避けつつ、フェイルセーフに取得
 */
export async function getCurrentLocationSafe(
  options: LocationOptions = {}
): Promise<LocationData | null> {
  try {
    return await getCurrentLocation(options);
  } catch (error) {
    if (error instanceof LocationError) {
      log.warn(`Safe get failed (${error.code}):`, error.message);
    } else {
      log.error('Safe get failed:', error);
    }
    return null;
  }
}
