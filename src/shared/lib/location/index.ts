// Types & Schemas
export {
  locationCoordinatesSchema,
  addressSchema,
  locationDataSchema,
  locationPermissionStatusSchema,
  locationStateSchema,
  initialMetadataSchema,
  DEFAULT_LOCATION_OPTIONS,
  type LocationCoordinates,
  type Address,
  type LocationData,
  type LocationPermissionStatus,
  type LocationState,
  type InitialMetadata,
  type LocationOptions,
} from './schema';

// Service
export {
  LocationError,
  checkLocationPermission,
  requestLocationPermission,
  isLocationServicesEnabled,
  getCurrentLocation,
  getCurrentLocationSafe,
} from './locationService';

// Hook & Store
export {
  useLocation,
  useLocationStore,
  selectLocation,
  selectIsLoading,
  selectPermissionStatus,
  selectError,
} from './useLocation';
