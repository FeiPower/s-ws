import {
  PHI,
  K,
  THETA_MAX,
  THETA_STEP,
  MAX_ROTATION,
  MIN_SCALE,
  MAX_SCALE,
} from '../utils/spiral/constants';
import {
  calculateRadius,
  clamp,
  normalizeAngle,
} from '../utils/spiral/math';
import { toWorld, toScreen, applyFocalZoom, applyPan } from '../utils/spiral/transforms';
import {
  normalizeScale,
  createNormalizationState,
  type NormalizationState,
} from '../utils/spiral/normalize';
import type {
  SpiralEngineAPI,
  TileSpec,
  TileId,
  ViewportState,
  SpiralConfig,
} from '../utils/tiles/types';
import {
  getPhaseColor,
  hexToRGBA,
  type EffectsConfig,
  DEFAULT_EFFECTS,
} from '../config/graphics';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

/**
 * Canvas-based Spiral Engine Implementation
 * Renders logarithmic Fibonacci spiral with φ-normalization
 * Includes phase-based coloring, particles, pulses, and glow effects
 */
export class SpiralEngineCanvas implements SpiralEngineAPI {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private viewport: ViewportState;
  private normState: NormalizationState;
  private tiles: TileSpec[] = [];
  private focusedTile: TileId | null = null;
  private focusCallbacks: Array<(tileId: TileId | null) => void> = [];
  private animationId: number | null = null;
  private config: SpiralConfig;
  private effects: EffectsConfig;
  private particles: Particle[] = [];
  private lastFrameTime: number = 0;
  private reducedMotion: boolean = false;

  constructor(config: Partial<SpiralConfig> = {}) {
    this.config = {
      a: config.a ?? 1,
      period: config.period ?? PHI,
      renderer: 'canvas',
      debug: config.debug ?? false,
    };

    // Initialize viewport with spiral center at screen center
    this.viewport = {
      scale: 25, // Start zoomed out to see multiple tiles
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    };

    this.normState = createNormalizationState(this.config.a, this.config.period);
    
    // Load effects config from localStorage or use defaults
    this.effects = this.loadEffectsConfig();
    
    // Check for reduced motion preference
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  private loadEffectsConfig(): EffectsConfig {
    try {
      const stored = localStorage.getItem('spiral-effects');
      if (stored) {
        return { ...DEFAULT_EFFECTS, ...JSON.parse(stored) };
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return { ...DEFAULT_EFFECTS };
  }
  
  public setEffects(effects: Partial<EffectsConfig>): void {
    this.effects = { ...this.effects, ...effects };
    try {
      localStorage.setItem('spiral-effects', JSON.stringify(this.effects));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  public getEffects(): EffectsConfig {
    return { ...this.effects };
  }

  mount(el: HTMLElement): void {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.touchAction = 'none'; // Prevent default touch behaviors

    el.appendChild(this.canvas);

    // Get context with alpha for transparency
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Setup resize handling
    this.handleResize();
    window.addEventListener('resize', this.handleResize);

    // Start render loop
    this.startRenderLoop();
  }

  unmount(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    window.removeEventListener('resize', this.handleResize);

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.canvas = null;
    this.ctx = null;
  }

  setTiles(tiles: TileSpec[]): void {
    this.tiles = [...tiles].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  onFocus(cb: (tileId: TileId | null) => void): void {
    this.focusCallbacks.push(cb);
  }

  focusTile(tileId: TileId, animate?: boolean): void {
    const tile = this.tiles.find((t) => t.id === tileId);
    if (!tile) return;

    // Calculate center of tile bbox
    const centerR = (tile.bbox.rMin + tile.bbox.rMax) / 2;
    const centerTheta = (tile.bbox.tMin + tile.bbox.tMax) / 2;
    const worldX = centerR * Math.cos(centerTheta);
    const worldY = centerR * Math.sin(centerTheta);

    // Center viewport on tile
    this.viewport.offsetX = -worldX;
    this.viewport.offsetY = -worldY;

    // Adjust scale to make tile prominent
    const desiredTileSize = 200; // pixels
    const tileRadius = (tile.bbox.rMax - tile.bbox.rMin) / 2;
    this.viewport.scale = desiredTileSize / tileRadius;

    this.setFocusedTile(tileId);
  }

  getViewport(): ViewportState {
    return { ...this.viewport };
  }

  setViewport(state: Partial<ViewportState>, animate?: boolean): void {
    this.viewport = { ...this.viewport, ...state };
    this.normalize();
  }

  private handleResize = (): void => {
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  };

  private normalize(): void {
    const result = normalizeScale(this.viewport, this.normState);
    this.viewport = result.viewport;
    this.normState = result.state;

    // Clamp scale
    this.viewport.scale = clamp(this.viewport.scale, MIN_SCALE, MAX_SCALE);

    // Clamp rotation
    this.viewport.rotation = clamp(
      this.viewport.rotation,
      -MAX_ROTATION,
      MAX_ROTATION
    );
  }

  private startRenderLoop(): void {
    const render = () => {
      this.render();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  private render(): void {
    if (!this.canvas || !this.ctx) return;

    const now = performance.now();
    const deltaTime = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 0;
    this.lastFrameTime = now;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw spiral with phase colors
    this.drawSpiral(now);

    // Draw tile nodes with pulse effect
    if (this.shouldEnableEffect('enablePulse')) {
      this.drawTileNodes(now);
    }

    // Draw feedback paths between related tiles
    if (this.shouldEnableEffect('enableFeedbackPaths')) {
      this.drawFeedbackPaths();
    }

    // Update and draw particles
    if (this.shouldEnableEffect('enableParticles')) {
      this.updateParticles(deltaTime);
      this.drawParticles();
    }

    // Draw debug info if enabled
    if (this.config.debug) {
      this.drawDebugInfo();
    }
  }
  
  private shouldEnableEffect(effect: keyof EffectsConfig): boolean {
    if (this.reducedMotion && this.effects.respectReducedMotion) {
      return false;
    }
    return this.effects[effect] as boolean;
  }

  private drawSpiral(time: number): void {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.ctx.save();

    // Calculate visible range based on viewport
    const corners = [
      toWorld(0, 0, width, height, this.viewport),
      toWorld(width, 0, width, height, this.viewport),
      toWorld(0, height, width, height, this.viewport),
      toWorld(width, height, width, height, this.viewport),
    ];

    const maxDist = Math.max(...corners.map(c => Math.sqrt(c.x * c.x + c.y * c.y)));
    const minDist = 0.1;

    const thetaMax = (Math.PI / 2) * (Math.log(maxDist / this.normState.a) / Math.log(PHI));
    const thetaMin = (Math.PI / 2) * (Math.log(minDist / this.normState.a) / Math.log(PHI));

    const thetaStart = thetaMin - 4 * Math.PI;
    const thetaEnd = thetaMax + 4 * Math.PI;

    const step = THETA_STEP / Math.max(1, this.viewport.scale / 10);

    // Draw spiral with phase-based gradient
    let lastR = 0;
    let lastColor = '';
    
    for (let theta = thetaStart; theta <= thetaEnd; theta += step) {
      const r = this.normState.a * Math.pow(PHI, theta / (Math.PI / 2));
      const worldX = r * Math.cos(theta);
      const worldY = r * Math.sin(theta);
      const screen = toScreen(worldX, worldY, width, height, this.viewport);

      const margin = 100;
      if (screen.x >= -margin && screen.x <= width + margin &&
          screen.y >= -margin && screen.y <= height + margin) {
        
        // Use normalized radius to keep color bands stable across φ-normalization
        const color = getPhaseColor(r, this.normState.a);
        
        // Start new segment when color changes or at first point
        if (color !== lastColor || lastR === 0) {
          if (lastR > 0) {
            // Draw previous segment
            this.ctx.stroke();
          }
          
          this.ctx.beginPath();
          this.ctx.moveTo(screen.x, screen.y);
          
          // Apply glow if enabled
          if (this.shouldEnableEffect('enableGlow')) {
            const glowIntensity = this.effects.glowIntensity;
            this.ctx.shadowBlur = 10 * glowIntensity;
            this.ctx.shadowColor = color;
          }
          
          this.ctx.strokeStyle = color;
          this.ctx.lineWidth = 2;
          lastColor = color;
        } else {
          this.ctx.lineTo(screen.x, screen.y);
        }
        
        lastR = r;
      } else if (lastR > 0) {
        // Finish segment when going off screen
        this.ctx.stroke();
        lastR = 0;
      }
    }
    
    // Finish final segment
    if (lastR > 0) {
      this.ctx.stroke();
    }

    // Reset shadow
    this.ctx.shadowBlur = 0;

    // Draw golden rectangles (visual guides)
    this.drawGoldenRectangles();

    this.ctx.restore();
  }

  private drawGoldenRectangles(): void {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.ctx.save();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;

    // Calculate visible theta range
    const corners = [
      toWorld(0, 0, width, height, this.viewport),
      toWorld(width, 0, width, height, this.viewport),
      toWorld(0, height, width, height, this.viewport),
      toWorld(width, height, width, height, this.viewport),
    ];

    const maxDist = Math.max(...corners.map(c => Math.sqrt(c.x * c.x + c.y * c.y)));
    const thetaMax = (Math.PI / 2) * (Math.log(maxDist / this.normState.a) / Math.log(PHI));
    const thetaMin = thetaMax - 8 * Math.PI;

    // Draw guide points every quarter turn
    for (let theta = thetaMin; theta <= thetaMax; theta += Math.PI / 2) {
      const r = this.normState.a * Math.pow(PHI, theta / (Math.PI / 2));
      const worldX = r * Math.cos(theta);
      const worldY = r * Math.sin(theta);

      const screen = toScreen(worldX, worldY, width, height, this.viewport);

      // Only draw if on screen
      if (screen.x >= 0 && screen.x <= width && screen.y >= 0 && screen.y <= height) {
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, 3, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#6366f1';
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  private drawDebugInfo(): void {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.fillStyle = '#6366f1';
    this.ctx.font = '12px monospace';

    const info = [
      `scale: ${this.viewport.scale.toFixed(4)}`,
      `offset: (${this.viewport.offsetX.toFixed(2)}, ${this.viewport.offsetY.toFixed(2)})`,
      `rotation: ${(this.viewport.rotation * (180 / Math.PI)).toFixed(2)}°`,
      `a: ${this.normState.a.toFixed(4)}`,
      `tiles: ${this.tiles.length}`,
    ];

    info.forEach((line, i) => {
      this.ctx!.fillText(line, 10, 20 + i * 15);
    });

    this.ctx.restore();
  }

  private setFocusedTile(tileId: TileId | null): void {
    if (this.focusedTile === tileId) return;

    this.focusedTile = tileId;
    this.focusCallbacks.forEach((cb) => cb(tileId));
  }

  private drawTileNodes(time: number): void {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const timeInSeconds = time * 0.001;

    this.ctx.save();

    this.tiles.forEach((tile, index) => {
      if (!tile.bbox) return;

      const centerR = (tile.bbox.rMin + tile.bbox.rMax) / 2;
      const centerTheta = (tile.bbox.tMin + tile.bbox.tMax) / 2;
      const worldX = centerR * Math.cos(centerTheta);
      const worldY = centerR * Math.sin(centerTheta);
      const screen = toScreen(worldX, worldY, width, height, this.viewport);

      // Only draw if on or near screen
      const margin = 50;
      if (screen.x < -margin || screen.x > width + margin || 
          screen.y < -margin || screen.y > height + margin) {
        return;
      }

      const normalizedColor = getPhaseColor(centerR, this.normState.a);
      const pulse = 1 + 0.15 * Math.sin(timeInSeconds * 2 + index * 0.7);
      const baseRadius = 6;
      const radius = baseRadius * pulse;

      // Draw outer glow ring
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, radius + 4, 0, Math.PI * 2);
      this.ctx.fillStyle = hexToRGBA(normalizedColor, 0.18);
      this.ctx.fill();

      // Draw main node
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = hexToRGBA(normalizedColor, 0.5);
      this.ctx.fill();
      
      // Draw inner highlight
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, radius * 0.5, 0, Math.PI * 2);
      this.ctx.fillStyle = hexToRGBA(normalizedColor, 0.9);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  private drawFeedbackPaths(): void {
    if (!this.ctx || !this.canvas || this.tiles.length < 2) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.ctx.save();
    this.ctx.setLineDash([3, 6]);
    this.ctx.lineWidth = 1;

    // Connect tiles with same priority or consecutive tiles in same phase
    for (let i = 0; i < this.tiles.length - 1; i++) {
      const tile1 = this.tiles[i];
      const tile2 = this.tiles[i + 1];
      
      if (!tile1.bbox || !tile2.bbox) continue;

      const r1 = (tile1.bbox.rMin + tile1.bbox.rMax) / 2;
      const theta1 = (tile1.bbox.tMin + tile1.bbox.tMax) / 2;
      const r2 = (tile2.bbox.rMin + tile2.bbox.rMax) / 2;
      const theta2 = (tile2.bbox.tMin + tile2.bbox.tMax) / 2;

      // Only connect if in same phase or adjacent priorities
      const phase1 = getPhaseColor(r1, this.normState.a);
      const phase2 = getPhaseColor(r2, this.normState.a);
      const samePriority = tile1.priority === tile2.priority;
      const samePhase = phase1 === phase2;

      if (samePriority || samePhase) {
        const world1 = { x: r1 * Math.cos(theta1), y: r1 * Math.sin(theta1) };
        const world2 = { x: r2 * Math.cos(theta2), y: r2 * Math.sin(theta2) };
        const screen1 = toScreen(world1.x, world1.y, width, height, this.viewport);
        const screen2 = toScreen(world2.x, world2.y, width, height, this.viewport);

        // Only draw if both points are visible
        const margin = 100;
        if (screen1.x >= -margin && screen1.x <= width + margin &&
            screen1.y >= -margin && screen1.y <= height + margin &&
            screen2.x >= -margin && screen2.x <= width + margin &&
            screen2.y >= -margin && screen2.y <= height + margin) {
          
          this.ctx.beginPath();
          this.ctx.moveTo(screen1.x, screen1.y);
          this.ctx.lineTo(screen2.x, screen2.y);
          this.ctx.strokeStyle = hexToRGBA(phase1, 0.3);
          this.ctx.stroke();

          // Draw small arrow at end
          const angle = Math.atan2(screen2.y - screen1.y, screen2.x - screen1.x);
          const arrowSize = 5;
          this.ctx.beginPath();
          this.ctx.moveTo(screen2.x, screen2.y);
          this.ctx.lineTo(
            screen2.x - arrowSize * Math.cos(angle - Math.PI / 6),
            screen2.y - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          this.ctx.moveTo(screen2.x, screen2.y);
          this.ctx.lineTo(
            screen2.x - arrowSize * Math.cos(angle + Math.PI / 6),
            screen2.y - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          this.ctx.stroke();
        }
      }
    }

    this.ctx.restore();
  }

  private emitParticles(count: number, centerX: number, centerY: number): void {
    if (!this.canvas) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      const radius = this.normState.a * Math.pow(PHI, Math.random() * 5);
      const color = getPhaseColor(radius, this.normState.a);

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0 + Math.random() * 0.5,
        radius: 1.5 + Math.random() * 2,
        color,
      });
    }

    // Limit particle count for performance
    const maxParticles = 200 * this.effects.particleDensity;
    if (this.particles.length > maxParticles) {
      this.particles = this.particles.slice(-Math.floor(maxParticles));
    }
  }

  private updateParticles(deltaTime: number): void {
    this.particles = this.particles.filter(p => {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime / p.maxLife;
      return p.life > 0;
    });
  }

  private drawParticles(): void {
    if (!this.ctx) return;

    this.ctx.save();

    this.particles.forEach(p => {
      const alpha = Math.max(0, p.life);
      this.ctx!.beginPath();
      this.ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx!.fillStyle = hexToRGBA(p.color, alpha * 0.7);
      this.ctx!.fill();
    });

    this.ctx.restore();
  }

  // Public methods for input handling (to be called by input manager)
  public handleWheel(deltaY: number, clientX: number, clientY: number): void {
    if (!this.canvas) return;

    const zoomFactor = Math.exp(-deltaY * 0.0015);

    // Always zoom centered on screen, ignore mouse position
    const centerX = this.canvas.clientWidth / 2;
    const centerY = this.canvas.clientHeight / 2;

    this.viewport = applyFocalZoom(
      centerX,
      centerY,
      zoomFactor,
      this.canvas.clientWidth,
      this.canvas.clientHeight,
      this.viewport
    );

    // Subtle rotation tied to scroll
    this.viewport.rotation += deltaY * 0.0003;

    // Keep spiral centered - reset offsets
    this.viewport.offsetX = 0;
    this.viewport.offsetY = 0;

    this.normalize();

    // Emit particles based on scroll intensity
    if (this.shouldEnableEffect('enableParticles')) {
      const particleCount = Math.min(8, Math.abs(deltaY) / 10);
      this.emitParticles(Math.floor(particleCount), centerX, centerY);
    }
  }

  public handlePan(deltaX: number, deltaY: number): void {
    // Panning disabled - spiral remains centered
  }
}

