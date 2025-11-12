/**
 * GPU Capability Detector
 * Determines optimal renderer based on device capabilities
 */

export type GPUTier = 'low' | 'medium' | 'high';

export interface GPUCapabilities {
  tier: GPUTier;
  webglSupported: boolean;
  webgl2Supported: boolean;
  maxTextureSize: number;
  supportsFloatTextures: boolean;
  supportsInstancing: boolean;
  isMobile: boolean;
  preferCanvas: boolean;
}

const testWebGLContext = (): {
  supported: boolean;
  webgl2: boolean;
  maxTextureSize: number;
  floatTextures: boolean;
  instancing: boolean;
} => {
  try {
    const canvas = document.createElement('canvas');
    
    // Test WebGL2 first
    let gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    const isWebGL2 = !!gl;
    
    // Fallback to WebGL1
    if (!gl) {
      gl = canvas.getContext('webgl') as WebGL2RenderingContext | null;
    }
    
    if (!gl) {
      return {
        supported: false,
        webgl2: false,
        maxTextureSize: 0,
        floatTextures: false,
        instancing: false,
      };
    }
    
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    
    // Check float texture support
    const floatExt = gl.getExtension('OES_texture_float');
    const floatTextures = !!floatExt;
    
    // Check instancing support
    const instancingExt = isWebGL2 || !!gl.getExtension('ANGLE_instanced_arrays');
    
    return {
      supported: true,
      webgl2: isWebGL2,
      maxTextureSize,
      floatTextures,
      instancing: !!instancingExt,
    };
  } catch (e) {
    return {
      supported: false,
      webgl2: false,
      maxTextureSize: 0,
      floatTextures: false,
      instancing: false,
    };
  }
};

const detectGPUTier = (webglInfo: ReturnType<typeof testWebGLContext>): GPUTier => {
  if (!webglInfo.supported) return 'low';
  
  // High-tier: WebGL2, large textures, instancing
  if (
    webglInfo.webgl2 &&
    webglInfo.maxTextureSize >= 8192 &&
    webglInfo.instancing
  ) {
    return 'high';
  }
  
  // Medium-tier: WebGL1 with good extensions or WebGL2 with limitations
  if (
    webglInfo.maxTextureSize >= 4096 &&
    (webglInfo.instancing || webglInfo.floatTextures)
  ) {
    return 'medium';
  }
  
  return 'low';
};

const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const detectGPUCapabilities = (): GPUCapabilities => {
  const webglInfo = testWebGLContext();
  const tier = detectGPUTier(webglInfo);
  const mobile = isMobileDevice();
  
  // Mobile devices: prefer canvas for battery life
  // Low-tier desktop: prefer canvas for stability
  const preferCanvas = mobile || tier === 'low';
  
  return {
    tier,
    webglSupported: webglInfo.supported,
    webgl2Supported: webglInfo.webgl2,
    maxTextureSize: webglInfo.maxTextureSize,
    supportsFloatTextures: webglInfo.floatTextures,
    supportsInstancing: webglInfo.instancing,
    isMobile: mobile,
    preferCanvas,
  };
};

export const shouldUseWebGL = (
  requestedMode: 'canvas' | 'webgl' | 'auto',
  capabilities: GPUCapabilities
): boolean => {
  if (requestedMode === 'canvas') return false;
  if (requestedMode === 'webgl') return capabilities.webglSupported;
  
  // Auto mode: use WebGL only for high-tier desktop
  return (
    capabilities.webglSupported &&
    capabilities.tier === 'high' &&
    !capabilities.isMobile
  );
};

