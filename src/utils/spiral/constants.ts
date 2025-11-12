/**
 * Golden ratio (φ) - the fundamental constant for Fibonacci spiral
 */
export const PHI = 1.6180339887;

/**
 * Natural logarithm of phi - used in log-spiral calculations
 */
export const LOG_PHI = Math.log(PHI);

/**
 * Growth constant k for the log-spiral: r = a * φ^(θ/(π/2))
 * Derived from: k = ln(φ) / (π/2)
 */
export const K = LOG_PHI / (Math.PI / 2);

/**
 * Epsilon for floating-point comparisons
 */
export const EPSILON = 1e-10;

/**
 * Maximum theta range for spiral rendering (in radians)
 */
export const THETA_MAX = 8 * Math.PI;

/**
 * Step size for spiral path generation
 */
export const THETA_STEP = 0.01;

/**
 * Default zoom sensitivity
 */
export const ZOOM_SENSITIVITY = 0.0015;

/**
 * Default rotation sensitivity (subtle)
 */
export const ROTATION_SENSITIVITY = 0.0003;

/**
 * Maximum rotation to prevent motion sickness (in radians)
 */
export const MAX_ROTATION = Math.PI / 6; // 30 degrees

/**
 * Minimum scale to prevent numeric underflow
 */
export const MIN_SCALE = 0.01;

/**
 * Maximum scale to prevent numeric overflow
 */
export const MAX_SCALE = 100;

/**
 * Target FPS
 */
export const TARGET_FPS = 60;

/**
 * Frame time in milliseconds
 */
export const FRAME_TIME = 1000 / TARGET_FPS;

