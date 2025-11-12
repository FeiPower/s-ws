import {
  PHI,
  K,
  MAX_ROTATION,
  MIN_SCALE,
  MAX_SCALE,
} from '../utils/spiral/constants';
import { clamp } from '../utils/spiral/math';
import { applyFocalZoom, toScreen, toWorld } from '../utils/spiral/transforms';
import { normalizeScaleGL } from '../utils/spiral/normalize';
import type {
  SpiralEngineAPI,
  TileSpec,
  TileId,
  ViewportState,
  SpiralConfig,
} from '../utils/tiles/types';
import {
  type EffectsConfig,
  DEFAULT_EFFECTS,
  getPhaseColor,
  getPhaseRGB,
} from '../config/graphics';
import {
  spiralVertexShader,
  spiralFragmentShader,
  particleVertexShader,
  particleFragmentShader,
  nodeVertexShader,
  nodeFragmentShader,
  createProgram,
} from '../utils/gpu/shaders';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: [number, number, number];
}

interface WebGLResources {
  spiralProgram: WebGLProgram;
  particleProgram: WebGLProgram;
  nodeProgram: WebGLProgram;
  spiralBuffer: WebGLBuffer;
  particleBuffer: WebGLBuffer;
  nodeBuffer: WebGLBuffer;
}

/**
 * WebGL-based Spiral Engine Implementation
 * GPU-accelerated rendering with phase colors, particles, and effects
 */
export class SpiralEngineGL implements SpiralEngineAPI {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  private resources: WebGLResources | null = null;
  private viewport: ViewportState;
  private logA: number;
  private tiles: TileSpec[] = [];
  private focusedTile: TileId | null = null;
  private focusCallbacks: Array<(tileId: TileId | null) => void> = [];
  private animationId: number | null = null;
  private config: SpiralConfig;
  private effects: EffectsConfig;
  private particles: Particle[] = [];
  private lastFrameTime: number = 0;
  private reducedMotion: boolean = false;
  private isWebGL2: boolean = false;

  constructor(config: Partial<SpiralConfig> = {}) {
    this.config = {
      a: config.a ?? 1,
      period: config.period ?? PHI,
      renderer: 'webgl',
      debug: config.debug ?? false,
    };

    this.viewport = {
      scale: 25,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    };

    this.logA = Math.log(this.config.a);
    this.effects = this.loadEffectsConfig();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private loadEffectsConfig(): EffectsConfig {
    try {
      const stored = localStorage.getItem('spiral-effects');
      if (stored) {
        return { ...DEFAULT_EFFECTS, ...JSON.parse(stored) };
      }
    } catch (e) {
      // Ignore
    }
    return { ...DEFAULT_EFFECTS };
  }

  public setEffects(effects: Partial<EffectsConfig>): void {
    this.effects = { ...this.effects, ...effects };
    try {
      localStorage.setItem('spiral-effects', JSON.stringify(this.effects));
    } catch (e) {
      // Ignore
    }
  }

  public getEffects(): EffectsConfig {
    return { ...this.effects };
  }

  mount(el: HTMLElement): void {
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.touchAction = 'none';

    el.appendChild(this.canvas);

    // Try WebGL2 first, fallback to WebGL1
    this.gl = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    }) as WebGL2RenderingContext | null;

    if (this.gl) {
      this.isWebGL2 = true;
    } else {
      this.gl = this.canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      }) as WebGLRenderingContext | null;
    }

    if (!this.gl) {
      throw new Error('WebGL not supported');
    }

    this.setupWebGL();
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    this.startRenderLoop();
  }

  unmount(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    window.removeEventListener('resize', this.handleResize);

    if (this.gl && this.resources) {
      this.gl.deleteProgram(this.resources.spiralProgram);
      this.gl.deleteProgram(this.resources.particleProgram);
      this.gl.deleteProgram(this.resources.nodeProgram);
      this.gl.deleteBuffer(this.resources.spiralBuffer);
      this.gl.deleteBuffer(this.resources.particleBuffer);
      this.gl.deleteBuffer(this.resources.nodeBuffer);
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.canvas = null;
    this.gl = null;
  }

  setTiles(tiles: TileSpec[]): void {
    this.tiles = [...tiles].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  onFocus(cb: (tileId: TileId | null) => void): void {
    this.focusCallbacks.push(cb);
  }

  focusTile(tileId: TileId, animate?: boolean): void {
    const tile = this.tiles.find((t) => t.id === tileId);
    if (!tile || !tile.bbox) return;

    const centerR = (tile.bbox.rMin + tile.bbox.rMax) / 2;
    const centerTheta = (tile.bbox.tMin + tile.bbox.tMax) / 2;
    const worldX = centerR * Math.cos(centerTheta);
    const worldY = centerR * Math.sin(centerTheta);

    this.viewport.offsetX = -worldX;
    this.viewport.offsetY = -worldY;

    const desiredTileSize = 200;
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

  private setupWebGL(): void {
    if (!this.gl) return;

    const gl = this.gl;

    // Create programs
    const spiralProgram = createProgram(gl, spiralVertexShader, spiralFragmentShader);
    const particleProgram = createProgram(gl, particleVertexShader, particleFragmentShader);
    const nodeProgram = createProgram(gl, nodeVertexShader, nodeFragmentShader);

    if (!spiralProgram || !particleProgram || !nodeProgram) {
      throw new Error('Failed to create shader programs');
    }

    // Create buffers
    const spiralBuffer = gl.createBuffer();
    const particleBuffer = gl.createBuffer();
    const nodeBuffer = gl.createBuffer();

    if (!spiralBuffer || !particleBuffer || !nodeBuffer) {
      throw new Error('Failed to create buffers');
    }

    this.resources = {
      spiralProgram,
      particleProgram,
      nodeProgram,
      spiralBuffer,
      particleBuffer,
      nodeBuffer,
    };

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private handleResize = (): void => {
    if (!this.canvas || !this.gl) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  };

  private normalize(): void {
    const result = normalizeScaleGL(this.viewport.scale, this.logA, this.config.period);
    this.viewport.scale = result.scale;
    this.logA = result.logA;

    this.viewport.scale = clamp(this.viewport.scale, MIN_SCALE, MAX_SCALE);
    this.viewport.rotation = clamp(this.viewport.rotation, -MAX_ROTATION, MAX_ROTATION);
  }

  private startRenderLoop(): void {
    const render = () => {
      this.render();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  private render(): void {
    if (!this.gl || !this.canvas || !this.resources) return;

    const now = performance.now();
    const deltaTime = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 0;
    this.lastFrameTime = now;

    const gl = this.gl;

    // Clear
    gl.clearColor(0.04, 0.04, 0.04, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw spiral
    this.drawSpiral(now);

    // Draw tile nodes
    if (this.shouldEnableEffect('enablePulse')) {
      this.drawTileNodes(now);
    }

    // Update and draw particles
    if (this.shouldEnableEffect('enableParticles')) {
      this.updateParticles(deltaTime);
      this.drawParticles();
    }
  }

  private shouldEnableEffect(effect: keyof EffectsConfig): boolean {
    if (this.reducedMotion && this.effects.respectReducedMotion) {
      return false;
    }
    return this.effects[effect] as boolean;
  }

  private drawSpiral(time: number): void {
    if (!this.gl || !this.canvas || !this.resources) return;

    const gl = this.gl;
    const program = this.resources.spiralProgram;

    gl.useProgram(program);

    // Build transformation matrix (viewport to clip space)
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const aspect = width / height;

    // Generate spiral curve points
    const points: number[] = [];
    const thetaMin = 0;
    const thetaMax = Math.PI * 8; // 4 full rotations
    const step = 0.1;

    for (let theta = thetaMin; theta <= thetaMax; theta += step) {
      const r = this.config.a * Math.pow(PHI, theta / (Math.PI / 2));
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);

      // Transform to screen space
      const screen = toScreen(x, y, width, height, this.viewport);

      // Normalize to clip space [-1, 1]
      const clipX = (screen.x / width) * 2 - 1;
      const clipY = -(screen.y / height) * 2 + 1;

      points.push(clipX, clipY, r);
    }

    // Upload to GPU
    const buffer = this.resources.spiralBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW);

    // Set attributes
    const aPosition = gl.getAttribLocation(program, 'a_position');
    const aRadius = gl.getAttribLocation(program, 'a_radius');

    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 12, 0);

    gl.enableVertexAttribArray(aRadius);
    gl.vertexAttribPointer(aRadius, 1, gl.FLOAT, false, 12, 8);

    // Set uniforms
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uGlowIntensity = gl.getUniformLocation(program, 'u_glowIntensity');
    const uA = gl.getUniformLocation(program, 'u_a');

    gl.uniform1f(uTime, time);
    gl.uniform1f(uGlowIntensity, this.effects.glowIntensity);
    // Current normalization factor a = e^{logA}
    gl.uniform1f(uA, Math.exp(this.logA));

    // Draw
    gl.lineWidth(2);
    gl.drawArrays(gl.LINE_STRIP, 0, points.length / 3);
  }

  private drawTileNodes(time: number): void {
    if (!this.gl || !this.canvas || !this.resources) return;
    if (this.tiles.length === 0) return;

    const gl = this.gl;
    const program = this.resources.nodeProgram;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    gl.useProgram(program);

    const points: number[] = [];

    this.tiles.forEach((tile, index) => {
      if (!tile.bbox) return;

      const centerR = (tile.bbox.rMin + tile.bbox.rMax) / 2;
      const centerTheta = (tile.bbox.tMin + tile.bbox.tMax) / 2;
      const worldX = centerR * Math.cos(centerTheta);
      const worldY = centerR * Math.sin(centerTheta);
      const screen = toScreen(worldX, worldY, width, height, this.viewport);

      const clipX = (screen.x / width) * 2 - 1;
      const clipY = -(screen.y / height) * 2 + 1;

      const rgb = getPhaseRGB(centerR, Math.exp(this.logA));
      const phaseOffset = index * 0.7;

      points.push(
        clipX, clipY,
        12, // radius in pixels
        rgb[0] / 255, rgb[1] / 255, rgb[2] / 255,
        phaseOffset
      );
    });

    if (points.length === 0) return;

    const buffer = this.resources.nodeBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW);

    const aCenter = gl.getAttribLocation(program, 'a_center');
    const aRadius = gl.getAttribLocation(program, 'a_radius');
    const aColor = gl.getAttribLocation(program, 'a_color');
    const aPhaseOffset = gl.getAttribLocation(program, 'a_phaseOffset');

    gl.enableVertexAttribArray(aCenter);
    gl.vertexAttribPointer(aCenter, 2, gl.FLOAT, false, 28, 0);

    gl.enableVertexAttribArray(aRadius);
    gl.vertexAttribPointer(aRadius, 1, gl.FLOAT, false, 28, 8);

    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 28, 12);

    gl.enableVertexAttribArray(aPhaseOffset);
    gl.vertexAttribPointer(aPhaseOffset, 1, gl.FLOAT, false, 28, 24);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uResolution = gl.getUniformLocation(program, 'u_resolution');

    gl.uniform1f(uTime, time);
    gl.uniform2f(uResolution, width, height);

    gl.enable(gl.BLEND);
    gl.drawArrays(gl.POINTS, 0, points.length / 7);
  }

  private emitParticles(count: number, centerX: number, centerY: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      const radius = this.config.a * Math.pow(PHI, Math.random() * 5);
      const rgb = getPhaseRGB(radius, Math.exp(this.logA));

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0 + Math.random() * 0.5,
        radius: 2 + Math.random() * 3,
        color: [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255],
      });
    }

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
    if (!this.gl || !this.canvas || !this.resources) return;
    if (this.particles.length === 0) return;

    const gl = this.gl;
    const program = this.resources.particleProgram;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    gl.useProgram(program);

    const data: number[] = [];

    this.particles.forEach(p => {
      const clipX = (p.x / width) * 2 - 1;
      const clipY = -(p.y / height) * 2 + 1;

      data.push(
        clipX, clipY,
        p.color[0], p.color[1], p.color[2],
        p.life,
        p.radius
      );
    });

    const buffer = this.resources.particleBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);

    const aParticlePos = gl.getAttribLocation(program, 'a_particlePos');
    const aParticleColor = gl.getAttribLocation(program, 'a_particleColor');
    const aParticleLife = gl.getAttribLocation(program, 'a_particleLife');
    const aParticleRadius = gl.getAttribLocation(program, 'a_particleRadius');

    gl.enableVertexAttribArray(aParticlePos);
    gl.vertexAttribPointer(aParticlePos, 2, gl.FLOAT, false, 28, 0);

    gl.enableVertexAttribArray(aParticleColor);
    gl.vertexAttribPointer(aParticleColor, 3, gl.FLOAT, false, 28, 8);

    gl.enableVertexAttribArray(aParticleLife);
    gl.vertexAttribPointer(aParticleLife, 1, gl.FLOAT, false, 28, 20);

    gl.enableVertexAttribArray(aParticleRadius);
    gl.vertexAttribPointer(aParticleRadius, 1, gl.FLOAT, false, 28, 24);

    gl.enable(gl.BLEND);
    gl.drawArrays(gl.POINTS, 0, this.particles.length);
  }

  private setFocusedTile(tileId: TileId | null): void {
    if (this.focusedTile === tileId) return;

    this.focusedTile = tileId;
    this.focusCallbacks.forEach((cb) => cb(tileId));
  }

  public handleWheel(deltaY: number, clientX: number, clientY: number): void {
    if (!this.canvas) return;

    const zoomFactor = Math.exp(-deltaY * 0.0015);
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

    this.viewport.rotation += deltaY * 0.0003;
    this.viewport.offsetX = 0;
    this.viewport.offsetY = 0;

    this.normalize();

    if (this.shouldEnableEffect('enableParticles')) {
      const particleCount = Math.min(8, Math.abs(deltaY) / 10);
      this.emitParticles(Math.floor(particleCount), centerX, centerY);
    }
  }

  public handlePan(deltaX: number, deltaY: number): void {
    // Panning disabled
  }
}
