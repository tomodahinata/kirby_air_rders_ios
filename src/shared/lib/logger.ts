/**
 * Production-safe Logger Utility
 *
 * Replaces console.log with environment-aware logging.
 * In production builds (__DEV__ = false), debug and info logs are silenced.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_CONFIG: LoggerConfig = {
  enabled: __DEV__,
  minLevel: 'debug',
};

function shouldLog(level: LogLevel, config: LoggerConfig): boolean {
  if (!config.enabled) return level === 'error' || level === 'warn';
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

function formatMessage(prefix: string | undefined, ...args: unknown[]): unknown[] {
  if (prefix) {
    return [`[${prefix}]`, ...args];
  }
  return args;
}

/**
 * Create a namespaced logger instance
 */
export function createLogger(namespace: string): Logger {
  return new Logger({ ...DEFAULT_CONFIG, prefix: namespace });
}

/**
 * Logger class with configurable output
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  debug(...args: unknown[]): void {
    if (shouldLog('debug', this.config)) {
      console.log(...formatMessage(this.config.prefix, ...args));
    }
  }

  info(...args: unknown[]): void {
    if (shouldLog('info', this.config)) {
      console.info(...formatMessage(this.config.prefix, ...args));
    }
  }

  warn(...args: unknown[]): void {
    if (shouldLog('warn', this.config)) {
      console.warn(...formatMessage(this.config.prefix, ...args));
    }
  }

  error(...args: unknown[]): void {
    if (shouldLog('error', this.config)) {
      console.error(...formatMessage(this.config.prefix, ...args));
    }
  }

  /**
   * Group related logs (only in dev)
   */
  group(label: string): void {
    if (this.config.enabled && console.group) {
      console.group(formatMessage(this.config.prefix, label).join(' '));
    }
  }

  groupEnd(): void {
    if (this.config.enabled && console.groupEnd) {
      console.groupEnd();
    }
  }

  /**
   * Log with timing measurement
   */
  time(label: string): void {
    if (this.config.enabled) {
      console.time(`[${this.config.prefix}] ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.config.enabled) {
      console.timeEnd(`[${this.config.prefix}] ${label}`);
    }
  }
}

/**
 * Default logger instance (generic)
 */
export const logger = new Logger();

/**
 * Pre-configured loggers for common modules
 */
export const loggers = {
  websocket: createLogger('WebSocket'),
  audio: createLogger('Audio'),
  voiceChat: createLogger('VoiceChat'),
  location: createLogger('Location'),
  navigation: createLogger('Navigation'),
  journal: createLogger('Journal'),
  suggestion: createLogger('Suggestion'),
  copilot: createLogger('Copilot'),
  connection: createLogger('Connection'),
} as const;
