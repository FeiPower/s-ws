import { PHI, K, EPSILON } from './constants';
import type { Point2D, PolarPoint } from '../tiles/types';

/**
 * Calculate radius for a given theta using logarithmic spiral formula
 * r = a * φ^(θ/(π/2))
 */
export const calculateRadius = (theta: number, a: number): number => {
  return a * Math.pow(PHI, theta / (Math.PI / 2));
};

/**
 * Calculate theta for a given radius (inverse of calculateRadius)
 * θ = (π/2) * log_φ(r/a)
 */
export const calculateTheta = (r: number, a: number): number => {
  if (r <= EPSILON || a <= EPSILON) return 0;
  return (Math.PI / 2) * (Math.log(r / a) / Math.log(PHI));
};

/**
 * Convert polar coordinates to Cartesian
 */
export const polarToCartesian = (polar: PolarPoint): Point2D => {
  return {
    x: polar.r * Math.cos(polar.theta),
    y: polar.r * Math.sin(polar.theta),
  };
};

/**
 * Convert Cartesian coordinates to polar
 */
export const cartesianToPolar = (point: Point2D): PolarPoint => {
  return {
    r: Math.sqrt(point.x * point.x + point.y * point.y),
    theta: Math.atan2(point.y, point.x),
  };
};

/**
 * Calculate distance between two points
 */
export const distance = (p1: Point2D, p2: Point2D): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

/**
 * Smooth step interpolation (cubic hermite)
 */
export const smoothStep = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/**
 * Normalize angle to range [-π, π]
 */
export const normalizeAngle = (angle: number): number => {
  let normalized = angle % (2 * Math.PI);
  if (normalized > Math.PI) normalized -= 2 * Math.PI;
  if (normalized < -Math.PI) normalized += 2 * Math.PI;
  return normalized;
};

/**
 * Check if a point is within a polar bounding box
 */
export const isPointInPolarBBox = (
  point: PolarPoint,
  bbox: { rMin: number; rMax: number; tMin: number; tMax: number }
): boolean => {
  const { r, theta } = point;
  const normalizedTheta = normalizeAngle(theta);
  const tMin = normalizeAngle(bbox.tMin);
  const tMax = normalizeAngle(bbox.tMax);

  const inRadius = r >= bbox.rMin && r <= bbox.rMax;

  // Handle angle wrapping
  let inAngle: boolean;
  if (tMin <= tMax) {
    inAngle = normalizedTheta >= tMin && normalizedTheta <= tMax;
  } else {
    // Wraps around ±π
    inAngle = normalizedTheta >= tMin || normalizedTheta <= tMax;
  }

  return inRadius && inAngle;
};

