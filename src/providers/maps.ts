import type { GeoPoint } from '@/domain/types';

/**
 * MapsProvider abstraction. The MVP ships a local, dependency-free implementation
 * (haversine + street-grid factor + equirectangular projection for the SVG map).
 * A Google Maps / Mapbox provider can implement the same contract later.
 */
export interface MapsProvider {
  distanceKm(a: GeoPoint, b: GeoPoint): number;
  walkingMinutes(a: GeoPoint, b: GeoPoint): number;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  project(p: GeoPoint, width: number, height: number): { x: number; y: number; inside: boolean };
}

const R = 6371;
const WALK_KMH = 4.8;
const STREET_FACTOR = 1.3; // Rome's streets are not straight lines

export class LocalMapsProvider implements MapsProvider {
  bounds = { minLat: 41.868, maxLat: 41.916, minLng: 12.448, maxLng: 12.518 };

  distanceKm(a: GeoPoint, b: GeoPoint) {
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  walkingMinutes(a: GeoPoint, b: GeoPoint) {
    return Math.max(1, Math.round(((this.distanceKm(a, b) * STREET_FACTOR) / WALK_KMH) * 60));
  }

  project(p: GeoPoint, width: number, height: number) {
    const { minLat, maxLat, minLng, maxLng } = this.bounds;
    const x = ((p.lng - minLng) / (maxLng - minLng)) * width;
    const y = ((maxLat - p.lat) / (maxLat - minLat)) * height;
    return { x, y, inside: x >= 0 && x <= width && y >= 0 && y <= height };
  }
}

export const maps: MapsProvider = new LocalMapsProvider();

/** Approximate course of the Tiber through central Rome — used to draw the stylised map. */
export const TIBER: GeoPoint[] = [
  [41.918, 12.4705], [41.912, 12.4728], [41.9065, 12.4738], [41.9035, 12.4695], [41.9025, 12.4655],
  [41.8995, 12.4652], [41.896, 12.4675], [41.8925, 12.4705], [41.8905, 12.4772], [41.886, 12.4792],
  [41.881, 12.4765], [41.876, 12.4718], [41.868, 12.468],
].map(([lat, lng]) => ({ lat, lng }));
