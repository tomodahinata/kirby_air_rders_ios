import { z } from 'zod';

// Coordinate schema for geolocation
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;

// Generic API response wrapper
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    timestamp: z.string().datetime(),
  });

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
