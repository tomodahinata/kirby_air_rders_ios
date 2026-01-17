// Real data hooks
export { useHealthData, HEALTHKIT_PERMISSIONS } from './useHealthData';
export { useCalendarEvents } from './useCalendarEvents';
export { useClipboardUrl } from './useClipboardUrl';

// Data provider (DI pattern)
export {
  useDataProvider,
  getExecutionEnvironment,
  isNativeModuleAvailable,
  type DataProviderResult,
} from './useDataProvider';
