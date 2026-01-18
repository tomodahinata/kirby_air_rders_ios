import { Component, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

import { loggers } from '@/shared/lib/logger';

const log = loggers.copilot;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    log.error('ErrorBoundary caught an error:', error);
    log.error('Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  onGoHome?: () => void;
}

/**
 * Default Error Fallback UI
 *
 * A beautiful error screen that allows users to retry or go home.
 */
function DefaultErrorFallback({ error, onRetry, onGoHome }: DefaultErrorFallbackProps) {
  return (
    <BlurView intensity={95} tint="light" style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
        <Animated.View entering={SlideInUp.duration(400).springify()} style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <AlertTriangle size={48} color="#ef4444" strokeWidth={1.5} />
          </View>
        </Animated.View>

        <Text style={styles.title}>予期せぬエラーが発生しました</Text>

        <Text style={styles.subtitle}>
          ご不便をおかけして申し訳ありません。{'\n'}
          下のボタンをタップして再試行してください。
        </Text>

        {__DEV__ && error && (
          <View style={styles.errorDetails}>
            <Text style={styles.errorLabel}>エラー詳細:</Text>
            <Text style={styles.errorMessage} numberOfLines={3}>
              {error.message}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Pressable style={styles.primaryButton} onPress={onRetry}>
            <RefreshCw size={20} color="#ffffff" strokeWidth={2} />
            <Text style={styles.primaryButtonText}>再試行</Text>
          </Pressable>

          {onGoHome && (
            <Pressable style={styles.secondaryButton} onPress={onGoHome}>
              <Home size={20} color="#3b82f6" strokeWidth={2} />
              <Text style={styles.secondaryButtonText}>ホームに戻る</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
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
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
});
