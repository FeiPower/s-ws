export type InitOptions = {
  tiles: any[];
  rendererMode: 'webgl' | 'canvas' | string;
};

const PHI = 1.618;

const getZoomPhase = (scale: number): string => {
  const q = Math.log(scale / 25) / Math.log(PHI);
  if (q < 0.5) return 'overview';
  if (q < 1.5) return 'discovery';
  if (q < 2.5) return 'strategy';
  if (q < 3.5) return 'execution';
  return 'scale';
};

export const initSpiral = async ({ tiles, rendererMode }: InitOptions): Promise<void> => {
  let engine: any;
  let inputHandler: any;
  let animationId: number | null = null;
  let focusedTileId: string | null = null;

  const updateFocusOverlay = (tileId: string | null): void => {
    const overlay = document.getElementById('focus-overlay');
    const ring = document.getElementById('focus-ring');
    if (!overlay || !ring) return;

    if (tileId) {
      const tileEl = document.querySelector(`[data-tile-id="${tileId}"]`) as HTMLElement | null;
      if (tileEl) {
        const rect = tileEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        (ring as HTMLElement).style.left = `${centerX}px`;
        (ring as HTMLElement).style.top = `${centerY}px`;
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
      }
      return;
    }
    overlay.classList.add('opacity-0');
    overlay.classList.remove('opacity-100');
  };

  const updateTilePositions = async (): Promise<void> => {
    if (!engine) return;
    const viewport = engine.getViewport();
    const canvasContainer = document.getElementById('spiral-canvas') as HTMLElement | null;
    if (!canvasContainer) return;
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;

    const { toScreen } = await import('../utils/spiral/transforms.ts');
    const tileElements = document.querySelectorAll('[data-tile-id]');
    const phase = getZoomPhase(viewport.scale);
    void phase; // reserved for future use

    tileElements.forEach((el) => {
      const tileId = el.getAttribute('data-tile-id');
      const tile = tiles.find((t: any) => t.id === tileId);
      if (!tile) return;
      const r = (tile.bbox.rMin + tile.bbox.rMax) / 2;
      const theta = (tile.bbox.tMin + tile.bbox.tMax) / 2;
      const worldX = r * Math.cos(theta);
      const worldY = r * Math.sin(theta);
      const screen = toScreen(worldX, worldY, width, height, viewport);

      const margin = 200;
      const isOnScreen =
        screen.x >= -margin &&
        screen.x <= width + margin &&
        screen.y >= -margin &&
        screen.y <= height + margin;

      const tileScale = Math.min(1.5, 0.8 + viewport.scale / 80);
      let opacity = 0;
      if (isOnScreen) {
        const distanceFromCenter = Math.hypot(screen.x - width / 2, screen.y - height / 2);
        const maxDistance = Math.hypot(width, height) / 2;
        const centerProximity = 1 - Math.min(1, distanceFromCenter / maxDistance);
        opacity = Math.max(0.6, centerProximity * 0.4 + 0.6);
      }

      (el as HTMLElement).style.transform = `translate(${screen.x}px, ${screen.y}px) scale(${tileScale})`;
      (el as HTMLElement).style.opacity = String(opacity);

      if (isOnScreen && opacity > 0.3) {
        el.classList.remove('pointer-events-none');
        el.classList.add('pointer-events-auto');
      } else {
        el.classList.add('pointer-events-none');
        el.classList.remove('pointer-events-auto');
      }

      if (tileId && tileId === focusedTileId) {
        el.classList.add('ring-2', 'ring-spiral-accent', 'shadow-lg', 'shadow-spiral-accent/50', 'scale-110');
      } else {
        el.classList.remove('ring-2', 'ring-spiral-accent', 'shadow-lg', 'shadow-spiral-accent/50', 'scale-110');
      }
    });
  };

  const startTileAnimation = (): void => {
    const animate = () => {
      void updateTilePositions();
      animationId = requestAnimationFrame(animate);
    };
    animate();
  };

  const init = async (): Promise<void> => {
    const canvasContainer = document.getElementById('spiral-canvas') as HTMLElement | null;
    if (!canvasContainer) return;

    let EngineClass: any;
    if (rendererMode === 'webgl') {
      const module = await import('../components/SpiralEngineGL.ts');
      EngineClass = module.SpiralEngineGL;
    } else {
      const module = await import('../components/SpiralEngineCanvas.ts');
      EngineClass = module.SpiralEngineCanvas;
    }

    engine = new EngineClass({ debug: false });
    engine.mount(canvasContainer);
    engine.setTiles(tiles);
    startTileAnimation();

    const { UnifiedInputHandler } = await import('../utils/input/unifiedInput.ts');
    inputHandler = new UnifiedInputHandler(canvasContainer, {
      onWheel: (deltaY: number, clientX: number, clientY: number) => {
        engine.handleWheel(deltaY, clientX, clientY);
      },
      onPan: (deltaX: number, deltaY: number) => {
        engine.handlePan(deltaX, deltaY);
      },
      onKeyDown: (key: string, event: KeyboardEvent) => {
        if (key === ' ' || key === 'm' || key === 'M') {
          event.preventDefault();
          const menu = (window as any)['spiralMenu'];
          if (menu) menu.show(window.innerWidth / 2, window.innerHeight / 2);
        } else if (key === 'Home' || key === 'h') {
          event.preventDefault();
          engine.setViewport({ scale: 25, offsetX: 0, offsetY: 0, rotation: 0 });
          focusedTileId = null;
        } else if (key === 'Escape') {
          event.preventDefault();
          focusedTileId = null;
        }
      },
    });

    engine.onFocus((tileId: string) => {
      focusedTileId = tileId;
      updateFocusOverlay(tileId);
    });

    document.querySelectorAll('[data-tile-id]').forEach((el) => {
      el.addEventListener('click', () => {
        const tileId = el.getAttribute('data-tile-id');
        focusedTileId = tileId;
        updateFocusOverlay(tileId);
      });
      el.addEventListener('keydown', (e) => {
        const tileId = el.getAttribute('data-tile-id');
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          focusedTileId = tileId;
          updateFocusOverlay(tileId);
          const link = el.querySelector('a') as HTMLAnchorElement | null;
          if (link) link.click();
        }
      });
      el.addEventListener('focus', () => {
        const tileId = el.getAttribute('data-tile-id');
        focusedTileId = tileId;
        updateFocusOverlay(tileId);
      });
    });

    window.addEventListener('spiralGoHome', () => {
      engine.setViewport({ scale: 25, offsetX: 0, offsetY: 0, rotation: 0 });
      focusedTileId = null;
    });

    const debugToggle = document.getElementById('debug-toggle');
    let debugMode = false;
    debugToggle?.addEventListener('click', () => {
      debugMode = !debugMode;
      engine.config.debug = debugMode;
      if (debugToggle) debugToggle.textContent = `Debug: ${debugMode ? 'ON' : 'OFF'}`;
    });
  };

  const cleanup = (): void => {
    if (animationId !== null) cancelAnimationFrame(animationId);
    if (inputHandler) inputHandler.destroy();
    if (engine) engine.unmount();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init as EventListener);
  } else {
    void init();
  }
  window.addEventListener('beforeunload', cleanup);
};


