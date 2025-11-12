export type RendererMode = 'canvas' | 'webgl' | 'auto';

export const RENDERER: RendererMode = 
  (import.meta.env.PUBLIC_RENDERER as RendererMode) ?? 'auto';

export const FORM_ENDPOINT: string = 
  import.meta.env.PUBLIC_FORM_ENDPOINT ?? '';

// Phase color system aligned with Fibonacci growth phases
export interface PhaseDefinition {
  id: string;
  label: string;
  rMin: number;
  rMax: number;
  color: string;
  colorRGB: [number, number, number];
}

export const PHASES: PhaseDefinition[] = [
  { 
    id: 'overview', 
    label: 'Vista General',
    rMin: 0, 
    rMax: 50, 
    color: '#60a5fa',
    colorRGB: [96, 165, 250]
  },
  { 
    id: 'discovery', 
    label: 'Descubrimiento',
    rMin: 50, 
    rMax: 120, 
    color: '#34d399',
    colorRGB: [52, 211, 153]
  },
  { 
    id: 'strategy', 
    label: 'Estrategia',
    rMin: 120, 
    rMax: 220, 
    color: '#fb923c',
    colorRGB: [251, 146, 60]
  },
  { 
    id: 'execution', 
    label: 'Ejecución',
    rMin: 220, 
    rMax: 360, 
    color: '#a78bfa',
    colorRGB: [167, 139, 250]
  },
  { 
    id: 'scale', 
    label: 'Escala',
    rMin: 360, 
    rMax: 560, 
    color: '#fbbf24',
    colorRGB: [251, 191, 36]
  },
];

// Normalized-color helpers:
// The PHASES rMin/rMax are interpreted in a-normalized radius units.
// Given a world-space radius r and the current normalization factor a,
// use rNormalized = r / a to ensure color bands remain stable across φ-normalization.
export const getPhaseColorNormalized = (rNormalized: number): string => {
  const phase = PHASES.find(p => rNormalized >= p.rMin && rNormalized < p.rMax);
  return phase?.color ?? '#fbbf24';
};

export const getPhaseRGBNormalized = (rNormalized: number): [number, number, number] => {
  const phase = PHASES.find(p => rNormalized >= p.rMin && rNormalized < p.rMax);
  return phase?.colorRGB ?? [251, 191, 36];
};

// Backward-compatible APIs with optional 'a' (defaults to 1).
export const getPhaseColor = (radius: number, a: number = 1): string => {
  return getPhaseColorNormalized(radius / Math.max(a, 1e-8));
};

export const getPhaseRGB = (radius: number, a: number = 1): [number, number, number] => {
  return getPhaseRGBNormalized(radius / Math.max(a, 1e-8));
};

export const getPhase = (radius: number): PhaseDefinition => {
  return PHASES.find(p => radius >= p.rMin && radius < p.rMax) ?? PHASES[PHASES.length - 1];
};

export const withAlpha = (hex: string, alpha: number): string => {
  const alphaHex = Math.round(Math.min(255, Math.max(0, alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alphaHex}`;
};

export const hexToRGBA = (hex: string, alpha: number = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Visual effects configuration
export interface EffectsConfig {
  enableParticles: boolean;
  enablePulse: boolean;
  enableGlow: boolean;
  enableFeedbackPaths: boolean;
  particleDensity: number; // 0-1
  glowIntensity: number; // 0-1
  respectReducedMotion: boolean;
}

export const DEFAULT_EFFECTS: EffectsConfig = {
  enableParticles: true,
  enablePulse: true,
  enableGlow: true,
  enableFeedbackPaths: true,
  particleDensity: 0.6,
  glowIntensity: 0.4,
  respectReducedMotion: true,
};

