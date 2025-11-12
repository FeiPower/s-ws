import type { TileSpec, PolarBBox, Point2D } from './types';
import { polarToCartesian, calculateRadius } from '../spiral/math';

/**
 * Generate polar bounding box for a tile at a specific arc position
 * Uses golden ratio subdivision
 */
export const generatePolarBBox = (
  arcIndex: number,
  subdivisions: number = 5,
  baseRadius: number = 100
): PolarBBox => {
  const PHI = 1.618;
  const thetaRange = (2 * Math.PI) / subdivisions;
  const tMin = arcIndex * thetaRange;
  const tMax = tMin + thetaRange;

  const radiusScale = Math.pow(PHI, Math.floor(arcIndex / subdivisions));
  const rMin = baseRadius * radiusScale;
  const rMax = rMin * PHI;

  return { rMin, rMax, tMin, tMax };
};

/**
 * Get center point of a polar bounding box in world coordinates
 */
export const getBBoxCenter = (bbox: PolarBBox, a: number = 1): Point2D => {
  const r = (bbox.rMin + bbox.rMax) / 2;
  const theta = (bbox.tMin + bbox.tMax) / 2;

  return polarToCartesian({ r, theta });
};

/**
 * Create a sample tile specification
 */
export const createTileSpec = (
  id: string,
  title: string,
  route: string,
  arcIndex: number,
  summary?: string,
  priority?: number
): TileSpec => {
  return {
    id,
    title,
    route,
    summary,
    bbox: generatePolarBBox(arcIndex),
    priority: priority ?? 0,
  };
};

/**
 * Generate a spiral layout of tiles
 */
export const generateSpiralLayout = (
  count: number,
  baseRadius: number = 100
): TileSpec[] => {
  const tiles: TileSpec[] = [];
  const PHI = 1.618;

  for (let i = 0; i < count; i++) {
    const theta = i * (Math.PI / 3); // 60 degrees apart
    const radiusScale = Math.pow(PHI, i * 0.5);
    const rMin = baseRadius * radiusScale;
    const rMax = rMin * 1.5;

    tiles.push({
      id: `tile-${i}`,
      title: `Section ${i + 1}`,
      route: `/section-${i + 1}`,
      summary: `Content for section ${i + 1}`,
      bbox: {
        rMin,
        rMax,
        tMin: theta - Math.PI / 6,
        tMax: theta + Math.PI / 6,
      },
      priority: count - i,
    });
  }

  return tiles;
};

