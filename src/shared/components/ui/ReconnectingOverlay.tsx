import { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { WifiOff, RefreshCw } from 'lucide-react-native';

type ConnectionStatus = 'disconnected' | 'reconnecting' | 'error';

interface ReconnectingOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Current connection status */
  status: ConnectionStatus;
  /** Retry attempt number */
  retryAttempt?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Manual reconnect handler */
  onReconnect?: () => void;
  /** Cancel/dismiss handler */
  onCancel?: () => void;
}

const STATUS_CONFIG = {
  disconnected: {
    title: '接続が切断されました',
    subtitle: '再接続を試みています...',
    color: '#f59e0b',
  },
  reconnecting: {
    title: '再接続中...',
    subtitle: '接続を回復しています',
    color: '#3b82f6',
  },
  error: {
    title: '接続に失敗しました',
    subtitle: 'ネットワーク接続を確認してください',
    color: '#ef4444',
  },
};

/**
 * Reconnecting Overlay
 *
 * Displays connection status and retry information when WebSocket disconnects.
 */
function ReconnectingOverlayComponent({
  isVisible,
  status,
  retryAttempt = 0,
  maxRetries = 5,
  onReconnect,
  onCancel,
}: ReconnectingOverlayProps) {
  if (!isVisible) return null;

  const config = STATUS_CONFIG[status];

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <BlurView intensity={90} tint="light" style={styles.blurContainer}>
        <Animated.View entering={SlideInDown.duration(300).springify()} style={styles.content}>
          {/* Status Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
            {status === 'reconnecting' ? (
              <ActivityIndicator size="large" color={config.color} />
            ) : (
              <WifiOff size={40} color={config.color} strokeWidth={1.5} />
            )}
          </View>

          {/* Status Text */}
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          {/* Retry Counter */}
          {status === 'reconnecting' && retryAttempt > 0 && (
            <View style={styles.retryContainer}>
              <Text style={styles.retryText}>
                再試行: {retryAttempt} / {maxRetries}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(retryAttempt / maxRetries) * 100}%`,
                      backgroundColor: config.color,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {status === 'error' && (
            <View style={styles.buttonContainer}>
              <Pressable style={styles.primaryButton} onPress={onReconnect}>
                <RefreshCw size={18} color="#ffffff" strokeWidth={2} />
                <Text style={styles.primaryButtonText}>再接続</Text>
              </Pressable>

              {onCancel && (
                <Pressable style={styles.secondaryButton} onPress={onCancel}>
                  <Text style={styles.secondaryButtonText}>キャンセル</Text>
                </Pressable>
              )}
            </View>
          )}
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  retryText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export const ReconnectingOverlay = memo(ReconnectingOverlayComponent);
