/**
 * Unique identifier for a tile
 */
export type TileId = string;

/**
 * Polar bounding box for tile placement
 */
export interface PolarBBox {
  /** Minimum radius */
  rMin: number;
  /** Maximum radius */
  rMax: number;
  /** Minimum theta (angle in radians) */
  tMin: number;
  /** Maximum theta (angle in radians) */
  tMax: number;
}

/**
 * Tile specification for content placement on the spiral
 */
export interface TileSpec {
  /** Unique identifier */
  id: TileId;
  /** Display title */
  title: string;
  /** Route/URL for the tile content */
  route: string;
  /** Optional summary text */
  summary?: string;
  /** Polar bounding box for positioning */
  bbox: PolarBBox;
  /** Priority for rendering order (higher = rendered first) */
  priority?: number;
}

/**
 * Viewport state
 */
export interface ViewportState {
  /** Current scale/zoom level */
  scale: number;
  /** Horizontal offset in world coordinates */
  offsetX: number;
  /** Vertical offset in world coordinates */
  offsetY: number;
  /** Rotation angle in radians */
  rotation: number;
}

/**
 * Spiral engine configuration
 */
export interface SpiralConfig {
  /** Initial scale parameter 'a' for r = a * φ^(θ/(π/2)) */
  a: number;
  /** Period for normalization (default PHI) */
  period: number;
  /** Canvas or WebGL renderer */
  renderer: 'canvas' | 'webgl';
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Main API for the spiral engine
 */
export interface SpiralEngineAPI {
  /**
   * Mount the engine to a DOM element
   */
  mount: (el: HTMLElement) => void;

  /**
   * Unmount and cleanup
   */
  unmount: () => void;

  /**
   * Set tiles for rendering
   */
  setTiles: (tiles: TileSpec[]) => void;

  /**
   * Register callback for tile focus changes
   */
  onFocus: (cb: (tileId: TileId | null) => void) => void;

  /**
   * Programmatically focus a tile with optional animation
   */
  focusTile: (tileId: TileId, animate?: boolean) => void;

  /**
   * Get current viewport state
   */
  getViewport: () => ViewportState;

  /**
   * Set viewport state
   */
  setViewport: (state: Partial<ViewportState>, animate?: boolean) => void;
}

/**
 * Point in 2D space
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Polar coordinates
 */
export interface PolarPoint {
  r: number;
  theta: number;
}

/**
 * Tile visibility state
 */
export type TileVisibility = 'hidden' | 'visible' | 'focused';

/**
 * Tile render state
 */
export interface TileRenderState {
  id: TileId;
  visibility: TileVisibility;
  screenPosition: Point2D;
  worldPosition: Point2D;
  scale: number;
}

