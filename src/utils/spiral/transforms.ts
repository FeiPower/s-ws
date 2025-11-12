import type { Point2D, ViewportState } from '../tiles/types';

/**
 * Convert screen coordinates to world coordinates
 */
export const toWorld = (
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
  viewport: ViewportState
): Point2D => {
  // Center-relative screen coordinates
  const x = screenX - canvasWidth / 2;
  const y = screenY - canvasHeight / 2;

  // Apply inverse rotation
  const c = Math.cos(-viewport.rotation);
  const s = Math.sin(-viewport.rotation);
  const xr = x * c - y * s;
  const yr = x * s + y * c;

  // Apply inverse scale and offset
  return {
    x: xr / viewport.scale - viewport.offsetX,
    y: yr / viewport.scale - viewport.offsetY,
  };
};

/**
 * Convert world coordinates to screen coordinates
 */
export const toScreen = (
  worldX: number,
  worldY: number,
  canvasWidth: number,
  canvasHeight: number,
  viewport: ViewportState
): Point2D => {
  // Apply offset
  let x = worldX + viewport.offsetX;
  let y = worldY + viewport.offsetY;

  // Apply rotation
  const c = Math.cos(viewport.rotation);
  const s = Math.sin(viewport.rotation);
  const xr = x * c - y * s;
  const yr = x * s + y * c;

  // Apply scale and center
  return {
    x: xr * viewport.scale + canvasWidth / 2,
    y: yr * viewport.scale + canvasHeight / 2,
  };
};

/**
 * Check if a world point is visible on screen
 */
export const isVisibleOnScreen = (
  worldPoint: Point2D,
  canvasWidth: number,
  canvasHeight: number,
  viewport: ViewportState,
  margin = 100
): boolean => {
  const screen = toScreen(
    worldPoint.x,
    worldPoint.y,
    canvasWidth,
    canvasHeight,
    viewport
  );

  return (
    screen.x >= -margin &&
    screen.x <= canvasWidth + margin &&
    screen.y >= -margin &&
    screen.y <= canvasHeight + margin
  );
};

/**
 * Apply focal zoom - zoom towards a specific screen point
 * Returns updated viewport state
 */
export const applyFocalZoom = (
  focalScreenX: number,
  focalScreenY: number,
  zoomFactor: number,
  canvasWidth: number,
  canvasHeight: number,
  viewport: ViewportState
): ViewportState => {
  // Get world coordinates of focal point before zoom
  const worldPoint = toWorld(
    focalScreenX,
    focalScreenY,
    canvasWidth,
    canvasHeight,
    viewport
  );

  // Apply zoom
  const newScale = viewport.scale * zoomFactor;

  // Calculate new screen position of the same world point
  const tempViewport = { ...viewport, scale: newScale };
  const newScreen = toScreen(
    worldPoint.x,
    worldPoint.y,
    canvasWidth,
    canvasHeight,
    tempViewport
  );

  // Adjust offset to keep focal point stable
  const deltaX = (focalScreenX - newScreen.x) / newScale;
  const deltaY = (focalScreenY - newScreen.y) / newScale;

  return {
    scale: newScale,
    offsetX: viewport.offsetX + deltaX,
    offsetY: viewport.offsetY + deltaY,
    rotation: viewport.rotation,
  };
};

/**
 * Apply pan to viewport
 */
export const applyPan = (
  deltaX: number,
  deltaY: number,
  viewport: ViewportState
): ViewportState => {
  // Apply inverse rotation to pan delta
  const c = Math.cos(-viewport.rotation);
  const s = Math.sin(-viewport.rotation);
  const dx = deltaX * c - deltaY * s;
  const dy = deltaX * s + deltaY * c;

  return {
    ...viewport,
    offsetX: viewport.offsetX + dx / viewport.scale,
    offsetY: viewport.offsetY + dy / viewport.scale,
  };
};

