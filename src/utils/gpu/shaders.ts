/**
 * GLSL Shaders for WebGL Spiral Renderer
 */

// Spiral vertex shader
export const spiralVertexShader = `
attribute vec2 a_position;
attribute float a_radius;
attribute float a_theta;

uniform mat3 u_matrix;
uniform float u_time;
uniform float u_a;

varying float v_radius;
varying vec3 v_color;

// Phase colors (RGB normalized)
const vec3 PHASE_COLORS[5] = vec3[5](
  vec3(0.376, 0.647, 0.980),  // Overview - Blue
  vec3(0.204, 0.827, 0.600),  // Discovery - Green
  vec3(0.984, 0.573, 0.235),  // Strategy - Orange
  vec3(0.655, 0.545, 0.980),  // Execution - Purple
  vec3(0.984, 0.749, 0.141)   // Scale - Gold
);

const float PHASE_RANGES[6] = float[6](0.0, 50.0, 120.0, 220.0, 360.0, 560.0);

// Compare against normalized radius so bands remain stable when 'a' changes
vec3 getPhaseColor(float normalizedRadius) {
  for (int i = 0; i < 5; i++) {
    if (normalizedRadius >= PHASE_RANGES[i] && normalizedRadius < PHASE_RANGES[i + 1]) {
      return PHASE_COLORS[i];
    }
  }
  return PHASE_COLORS[4]; // Default to gold
}

void main() {
  // Transform position
  vec3 pos = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(pos.xy, 0.0, 1.0);
  
  // Pass radius for coloring
  v_radius = a_radius;
  float rNorm = a_radius / max(u_a, 1e-6);
  v_color = getPhaseColor(rNorm);
}
`;

// Spiral fragment shader with glow
export const spiralFragmentShader = `
precision mediump float;

varying float v_radius;
varying vec3 v_color;

uniform float u_glowIntensity;
uniform float u_time;

void main() {
  vec3 color = v_color;
  
  // Add subtle glow pulse
  float pulse = 0.5 + 0.5 * sin(u_time * 0.001 + v_radius * 0.05);
  float glow = u_glowIntensity * pulse * 0.3;
  
  color += vec3(glow);
  
  gl_FragColor = vec4(color, 1.0);
}
`;

// Particle vertex shader (instanced)
export const particleVertexShader = `
attribute vec2 a_position;        // Quad corner
attribute vec2 a_particlePos;     // Instance: particle center
attribute vec3 a_particleColor;   // Instance: particle color
attribute float a_particleLife;   // Instance: life (0-1)
attribute float a_particleRadius; // Instance: radius

uniform mat3 u_matrix;
uniform vec2 u_resolution;

varying vec3 v_color;
varying float v_life;

void main() {
  // Scale quad by particle radius
  vec2 offset = a_position * a_particleRadius;
  vec2 worldPos = a_particlePos + offset;
  
  // Transform to clip space
  vec3 pos = u_matrix * vec3(worldPos, 1.0);
  gl_Position = vec4(pos.xy, 0.0, 1.0);
  
  v_color = a_particleColor;
  v_life = a_particleLife;
}
`;

// Particle fragment shader
export const particleFragmentShader = `
precision mediump float;

varying vec3 v_color;
varying float v_life;

void main() {
  // Calculate distance from center for circular fade
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  
  if (dist > 0.5) {
    discard;
  }
  
  // Soft edge
  float alpha = (1.0 - dist * 2.0) * v_life * 0.7;
  
  gl_FragColor = vec4(v_color, alpha);
}
`;

// Node (pulse) vertex shader
export const nodeVertexShader = `
attribute vec2 a_center;
attribute float a_radius;
attribute vec3 a_color;
attribute float a_phaseOffset;

uniform mat3 u_matrix;
uniform float u_time;
uniform vec2 u_resolution;

varying vec3 v_color;
varying float v_pulse;

void main() {
  // Calculate pulse
  float timeInSeconds = u_time * 0.001;
  v_pulse = 1.0 + 0.15 * sin(timeInSeconds * 2.0 + a_phaseOffset);
  
  // Transform center to clip space
  vec3 pos = u_matrix * vec3(a_center, 1.0);
  gl_Position = vec4(pos.xy, 0.0, 1.0);
  
  // Set point size based on pulse
  gl_PointSize = a_radius * v_pulse * 2.0;
  
  v_color = a_color;
}
`;

// Node fragment shader
export const nodeFragmentShader = `
precision mediump float;

varying vec3 v_color;
varying float v_pulse;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  
  if (dist > 0.5) {
    discard;
  }
  
  // Inner glow
  float innerGlow = smoothstep(0.5, 0.2, dist);
  float outerRing = smoothstep(0.5, 0.48, dist) - smoothstep(0.52, 0.5, dist);
  
  vec3 color = v_color;
  float alpha = (innerGlow * 0.3) + (outerRing * 0.6);
  
  gl_FragColor = vec4(color, alpha);
}
`;

// Post-processing vertex shader (full-screen quad)
export const postVertexShader = `
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_position * 0.5 + 0.5;
}
`;

// Bloom/Glow fragment shader
export const bloomFragmentShader = `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_intensity;

varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  
  // Simple box blur for glow
  vec2 texelSize = 1.0 / u_resolution;
  vec4 blur = vec4(0.0);
  
  for (float x = -2.0; x <= 2.0; x += 1.0) {
    for (float y = -2.0; y <= 2.0; y += 1.0) {
      vec2 offset = vec2(x, y) * texelSize * 2.0;
      blur += texture2D(u_texture, v_texCoord + offset);
    }
  }
  
  blur /= 25.0;
  
  // Combine original with bloom
  vec3 bloomColor = max(blur.rgb - vec3(0.5), vec3(0.0)) * u_intensity * 2.0;
  vec3 finalColor = color.rgb + bloomColor;
  
  gl_FragColor = vec4(finalColor, color.a);
}
`;

// Utility: compile shader
export const compileShader = (
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

// Utility: create program
export const createProgram = (
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
};

