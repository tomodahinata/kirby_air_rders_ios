// Types
export * from './types';

// Generators
export * from './generators';

// Services
export {
  aggregateContext,
  serializeContext,
  calculateContextSize,
} from './services/contextAggregator';

// Store
export { useExtractionStore } from './store/extractionStore';

// API / Hooks
export {
  useExtractData,
  useRefreshExtraction,
  useContextData,
  useExtractionStatus,
  extractionKeys,
} from './api/useExtraction';

// Real Data Hooks (Native Integration)
export {
  useHealthData,
  useCalendarEvents,
  useClipboardUrl,
  useDataProvider,
  getExecutionEnvironment,
  isNativeModuleAvailable,
  HEALTHKIT_PERMISSIONS,
  type DataProviderResult,
} from './hooks';

// Components
export {
  DataCollectionCard,
  ExtractionProgress,
  UrlImportModal,
  DataSourceManager,
} from './components';
