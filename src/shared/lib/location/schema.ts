import { z } from 'zod';

/**
 * 位置座標スキーマ
 */
export const locationCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nullable().optional(),
  altitude: z.number().nullable().optional(),
  altitudeAccuracy: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
});

export type LocationCoordinates = z.infer<typeof locationCoordinatesSchema>;

/**
 * 住所情報スキーマ
 */
export const addressSchema = z.object({
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  isoCountryCode: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  streetNumber: z.string().nullable().optional(),
  subregion: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
});

export type Address = z.infer<typeof addressSchema>;

/**
 * 位置情報全体スキーマ（座標 + 住所）
 */
export const locationDataSchema = z.object({
  coordinates: locationCoordinatesSchema,
  address: addressSchema.nullable().optional(),
  timestamp: z.string().datetime(),
});

export type LocationData = z.infer<typeof locationDataSchema>;

/**
 * 位置情報権限状態
 */
export const locationPermissionStatusSchema = z.enum(['undetermined', 'granted', 'denied']);

export type LocationPermissionStatus = z.infer<typeof locationPermissionStatusSchema>;

/**
 * 位置情報取得状態
 */
export const locationStateSchema = z.object({
  /** 現在の位置情報（取得済みの場合） */
  location: locationDataSchema.nullable(),
  /** 位置情報取得中かどうか */
  isLoading: z.boolean(),
  /** 権限状態 */
  permissionStatus: locationPermissionStatusSchema,
  /** エラーメッセージ */
  error: z.string().nullable(),
  /** 最終更新日時 */
  lastUpdatedAt: z.string().datetime().nullable(),
});

export type LocationState = z.infer<typeof locationStateSchema>;

/**
 * 初期メタデータスキーマ（WebSocket送信用）
 */
export const initialMetadataSchema = z.object({
  type: z.literal('metadata'),
  timestamp: z.string().datetime(),
  payload: z.object({
    location: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number().nullable().optional(),
        altitude: z.number().nullable().optional(),
        address: z
          .object({
            city: z.string().nullable().optional(),
            region: z.string().nullable().optional(),
            country: z.string().nullable().optional(),
          })
          .nullable()
          .optional(),
      })
      .nullable(), // 取得失敗時はnull
  }),
});

export type InitialMetadata = z.infer<typeof initialMetadataSchema>;

/**
 * 位置情報取得オプション
 */
export interface LocationOptions {
  /** 高精度モードを使用するか（GPS優先） */
  highAccuracy?: boolean;
  /** タイムアウト（ミリ秒） */
  timeout?: number;
  /** 住所情報も取得するか */
  includeAddress?: boolean;
}

/**
 * デフォルトの位置情報取得オプション
 */
export const DEFAULT_LOCATION_OPTIONS: Required<LocationOptions> = {
  highAccuracy: true,
  timeout: 10000,
  includeAddress: true,
};
