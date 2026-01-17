import { useState, useCallback, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { AppState, AppStateStatus } from 'react-native';

import type { UrlIntent } from '../types/realData';

/**
 * URL パターンマッチ
 */
const URL_PATTERN = /https?:\/\/[^\s]+/gi;

/**
 * ドメインから URL タイプを推定
 */
function inferUrlType(
  url: string
): 'maps' | 'restaurant' | 'hotel' | 'shopping' | 'event' | 'other' {
  const lowerUrl = url.toLowerCase();

  // 地図系
  if (
    lowerUrl.includes('maps.google') ||
    lowerUrl.includes('maps.apple') ||
    lowerUrl.includes('goo.gl/maps')
  ) {
    return 'maps';
  }

  // レストラン・グルメ系
  if (
    lowerUrl.includes('tabelog.com') ||
    lowerUrl.includes('hotpepper') ||
    lowerUrl.includes('gnavi') ||
    lowerUrl.includes('retty')
  ) {
    return 'restaurant';
  }

  // ホテル・宿泊系
  if (
    lowerUrl.includes('booking.com') ||
    lowerUrl.includes('jalan.net') ||
    lowerUrl.includes('rakuten.co.jp/travel') ||
    lowerUrl.includes('ikyu.com')
  ) {
    return 'hotel';
  }

  // ショッピング系
  if (
    lowerUrl.includes('amazon') ||
    lowerUrl.includes('rakuten.co.jp') ||
    lowerUrl.includes('yahoo.co.jp/shopping')
  ) {
    return 'shopping';
  }

  // イベント系
  if (
    lowerUrl.includes('eplus.jp') ||
    lowerUrl.includes('pia.jp') ||
    lowerUrl.includes('lawsonticket')
  ) {
    return 'event';
  }

  return 'other';
}

/**
 * ドメイン抽出
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * クリップボード URL 検知フック
 */
export function useClipboardUrl(options?: { checkOnMount?: boolean; checkOnFocus?: boolean }) {
  const { checkOnMount = true, checkOnFocus = true } = options ?? {};

  const [detectedUrl, setDetectedUrl] = useState<UrlIntent | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  /**
   * クリップボードをチェック
   */
  const checkClipboard = useCallback(async () => {
    setIsChecking(true);

    try {
      const hasString = await Clipboard.hasStringAsync();

      if (!hasString) {
        setDetectedUrl(null);
        return null;
      }

      const text = await Clipboard.getStringAsync();
      const matches = text.match(URL_PATTERN);

      if (!matches || matches.length === 0) {
        setDetectedUrl(null);
        return null;
      }

      // 最初にマッチした URL を使用
      const url = matches[0];
      if (!url) {
        setDetectedUrl(null);
        return null;
      }

      const urlIntent: UrlIntent = {
        url,
        detectedAt: new Date().toISOString(),
        domain: extractDomain(url),
        type: inferUrlType(url),
      };

      setDetectedUrl(urlIntent);
      setLastCheckedAt(new Date());

      return urlIntent;
    } catch (error) {
      console.error('[Clipboard] Error checking clipboard:', error);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * 検出結果をクリア
   */
  const clearDetectedUrl = useCallback(() => {
    setDetectedUrl(null);
  }, []);

  /**
   * 検出を無視（次回まで表示しない）
   */
  const dismissUrl = useCallback(() => {
    setDetectedUrl(null);
    // 実際にはストレージに保存して、同じ URL を再検出しないようにする
  }, []);

  // マウント時にチェック
  useEffect(() => {
    if (checkOnMount) {
      checkClipboard();
    }
  }, [checkOnMount, checkClipboard]);

  // アプリフォーカス時にチェック
  useEffect(() => {
    if (!checkOnFocus) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkClipboard();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [checkOnFocus, checkClipboard]);

  return {
    detectedUrl,
    isChecking,
    lastCheckedAt,
    checkClipboard,
    clearDetectedUrl,
    dismissUrl,
  };
}
