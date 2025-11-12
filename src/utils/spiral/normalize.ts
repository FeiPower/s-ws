import { PHI, LOG_PHI, MIN_SCALE, MAX_SCALE } from './constants';
import type { ViewportState } from '../tiles/types';

/**
 * Normalization state for the spiral engine
 */
export interface NormalizationState {
  /** Current 'a' parameter for r = a * φ^(θ/(π/2)) */
  a: number;
  /** Period for normalization (typically PHI) */
  period: number;
}

/**
 * Normalize viewport scale by period (φ) to maintain visual invariance
 * This prevents numeric drift at extreme zoom levels
 * 
 * For Canvas: adjusts scale and 'a' parameter
 * For WebGL: adjusts scale and logA uniform
 */
export const normalizeScale = (
  viewport: ViewportState,
  state: NormalizationState
): { viewport: ViewportState; state: NormalizationState } => {
  let { scale } = viewport;
  let { a, period } = state;

  // Normalize upward (zooming in)
  while (scale >= period && scale < MAX_SCALE * period) {
    scale /= period;
    a *= period;
  }

  // Normalize downward (zooming out)
  while (scale < 1.0 && scale > MIN_SCALE / period) {
    scale *= period;
    a /= period;
  }

  return {
    viewport: { ...viewport, scale },
    state: { a, period },
  };
};

/**
 * Normalize for WebGL shader (logA adjustment)
 */
export const normalizeScaleGL = (
  scale: number,
  logA: number,
  period: number = PHI
): { scale: number; logA: number } => {
  let newScale = scale;
  let newLogA = logA;

  // Normalize upward
  while (newScale >= period && newScale < MAX_SCALE * period) {
    newScale /= period;
    newLogA += LOG_PHI;
  }

  // Normalize downward
  while (newScale < 1.0 && newScale > MIN_SCALE / period) {
    newScale *= period;
    newLogA -= LOG_PHI;
  }

  return { scale: newScale, logA: newLogA };
};

/**
 * Create initial normalization state
 */
export const createNormalizationState = (
  initialA: number = 1,
  period: number = PHI
): NormalizationState => {
  return { a: initialA, period };
};

