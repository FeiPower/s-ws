# SpiralNav UI - Fibonacci Spiral Navigation

Una experiencia web inmersiva con navegación espiral de zoom infinito basada en la proporción áurea (φ ≈ 1.618). Construida con Astro, TypeScript y Tailwind CSS.

## Características

- 🌀 **Zoom Infinito**: Zoom fluido con normalización φ para prevenir saltos visuales
- 🎯 **Navegación Focal**: El punto bajo el cursor permanece fijo durante el zoom
- 🖱️ **Input Unificado**: Soporte para mouse, touch y teclado
- ♿ **Accesible**: Cumple con ARIA, navegación por teclado y rutas espejo para SEO
- 🎨 **Renderizado Dual**: Canvas 2D (default) o WebGL con fragment shaders
- 📱 **Responsive**: Funciona en desktop, tablet y móvil
- 🎨 **UI Moderna**: Diseño dark mode con overlays glassmorphism y menú radial contextual

## Project Structure

```plaintext
spiral-site/
├── src/
│   ├── components/
│   │   ├── SpiralEngineCanvas.ts    # Canvas 2D renderer
│   │   ├── SpiralEngineGL.ts        # WebGL shader renderer
│   │   ├── TileCard.astro           # Content tile component
│   │   ├── FocusOverlay.astro       # Focus indicator
│   │   ├── MenuRadial.astro         # Radial menu
│   │   └── ModalForm.astro          # Contact/subscribe form
│   ├── islands/
│   │   └── SpiralEngineIsland.astro # Main interactive island
│   ├── layouts/
│   │   └── BaseLayout.astro         # Base HTML layout
│   ├── pages/
│   │   ├── index.astro              # Main spiral experience
│   │   ├── linear/index.astro       # Linear fallback
│   │   └── sections/[...slug].astro # SEO mirror routes
│   ├── utils/
│   │   ├── spiral/
│   │   │   ├── constants.ts         # PHI, K, and other constants
│   │   │   ├── math.ts              # Spiral math functions
│   │   │   ├── transforms.ts        # World ↔ Screen transforms
│   │   │   └── normalize.ts         # φ-normalization logic
│   │   ├── input/
│   │   │   └── unifiedInput.ts      # Input abstraction layer
│   │   └── tiles/
│   │       ├── types.ts             # TypeScript interfaces
│   │       └── placement.ts         # Tile positioning
│   ├── content/
│   │   ├── config.ts                # Content collections config
│   │   └── sections/                # Markdown content files
│   ├── config/
│   │   └── graphics.ts              # Renderer & env config
│   └── styles/
│       └── global.css               # Global styles
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── og-default.jpg
├── astro.config.mjs
├── tailwind.config.cjs
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Navigate to project directory
cd spiral-site

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env to configure:
# - PUBLIC_RENDERER=canvas|webgl
# - PUBLIC_FORM_ENDPOINT=your-form-endpoint
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Renderer mode: 'canvas' (default) or 'webgl'
PUBLIC_RENDERER=canvas

# External form endpoint (Formspree, Netlify Forms, etc.)
PUBLIC_FORM_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID
```

### Renderer Selection

**Canvas 2D** (Default)

- Simpler implementation
- Good performance on most devices
- Lower GPU requirements
- Easier debugging

**WebGL**

- Fragment shader-based rendering
- Higher visual quality with AA
- Better for complex effects
- Requires GPU support

## Mathematics

### Logarithmic Spiral Equation

The Fibonacci spiral follows:

```plaintext
r = a · φ^(θ / (π/2))
```

Where:

- `r` = radius at angle θ
- `a` = initial scale parameter
- `φ` = golden ratio (1.6180339887...)
- `θ` = angle in radians

### φ-Normalization

To maintain numerical stability at extreme zoom levels, we normalize by the period φ:

```typescript
// When scale >= φ
scale = scale / φ
a = a * φ

// When scale < 1
scale = scale * φ
a = a / φ
```

This ensures the visual appearance remains invariant across scale transitions.

### Coordinate Transforms

**World to Screen:**

```typescript
screen = (world + offset) · rotation · scale + center
```

**Screen to World:**

```typescript
world = (screen - center) · inverse(rotation) / scale - offset
```

## Experiencia de Usuario (UX/UI)

### Sistema Visual

**Esquema de Color:**

- **Dark Mode**: Fondo `#0a0a0a` (spiral-dark) con texto claro `#f5f5f5` (spiral-light)
- **Accent Color**: Índigo vibrante `#6366f1` para elementos interactivos
- **Glassmorphism**: Overlays con `backdrop-blur-sm` y transparencias graduales

**Componentes de Interfaz:**

1. **Spiral Canvas**: Lienzo a pantalla completa con renderizado continuo de la espiral logarítmica
2. **Instructions Overlay**: Panel flotante (top-left) con guía de navegación y backdrop blur
3. **Radial Menu**: Menú contextual circular con 4 acciones principales y animaciones suaves
4. **Focus Overlay**: Gradiente radial con anillo pulsante para enfatizar tiles en foco
5. **Modal Forms**: Formularios con validación client-side, backdrop oscurecido y manejo de accesibilidad
6. **Debug Toggle**: Botón (bottom-right) para activar información de desarrollo
7. **Loading Screen**: Spinner con animación mientras se inicializa el motor

### Navegación

**Mouse/Trackpad:**

- **Scroll**: Zoom in/out con focal point bajo el cursor
- **Click + Drag**: Pan para reposicionar el viewport
- **Pinch** (touch): Zoom en dispositivos táctiles

**Teclado:**

- **Arrow keys / WASD**: Pan direccional
- **+ / -**: Zoom in/out incremental
- **Space / M**: Abrir menú radial en el centro de la pantalla
- **H / Home**: Reset a posición inicial (scale=1, offset=0)
- **Escape**: Cerrar menú o modal activo
- **Tab**: Navegar entre items del menú radial
- **Enter**: Activar acción del item enfocado

### Menú Radial (4 Acciones)

Activado con `Space`, `M` o click prolongado:

- **🏠 Home** (`goHome`): Reset viewport a estado inicial
- **📑 Sections** (`showSections`): Navegar entre secciones de contenido
- **🔍 Search** (`openSearch`): Búsqueda de contenido (funcionalidad pendiente)
- **✉️ Contact** (`openContact`): Abre modal de contacto con formulario

**Interacción:**

- Navegar con `Tab` / `Shift+Tab` o flechas
- Activar con `Enter` o click
- Cerrar con `Escape` o botón central ✕
- Animaciones: scale, opacity y blur transitions de 300ms

### Formularios Modales

**Formulario de Contacto:**

- Campos: Name, Email, Message (todos requeridos)
- Validación en tiempo real con mensajes de error específicos
- Validación de formato email con regex
- Submit asíncrono a endpoint configurable (`PUBLIC_FORM_ENDPOINT`)
- Estados: idle, submitting, success, error
- Manejo de focus trap mientras está activo
- Cierre con `Escape`, click en backdrop o botón close

**Estados Visuales:**

- Inputs con border accent en focus
- Error states con border rojo y mensaje debajo del campo
- Success message verde con auto-close en 2 segundos
- Disabled state durante submit

## Accesibilidad (A11y)

### Implementación ARIA

**Landmarks y Roles:**

- `<main role="main">` para contenido principal
- `role="menu"` en MenuRadial con `aria-label="Radial navigation menu"`
- `role="dialog"` y `aria-modal="true"` en ModalForm
- `role="presentation"` para overlays decorativos

**Gestión de Focus:**

- Skip link visible en `:focus` para saltar al contenido principal
- Focus trap en modales activos (auto-focus primer input al abrir)
- Indicadores de focus visibles con `outline-spiral-accent`
- `tabindex` dinámico: `0` cuando visible, `-1` cuando oculto

**Screen Readers:**

- `aria-hidden` sincronizado con visibilidad de componentes
- `aria-label` descriptivos en todos los botones interactivos
- Estados de formulario anunciados con mensajes de error/éxito

### Navegación por Teclado

Completamente funcional sin mouse:

- Navegación espacial con flechas/WASD
- Atajos globales: `Space`, `M`, `H`, `Escape`
- Tab navigation en menús y formularios
- Enter/Escape para confirmar/cancelar acciones

### Rutas Espejo para SEO

Contenido accesible sin JavaScript:

- `/linear` - Navegación lineal alternativa
- `/sections/[slug]` - Páginas estáticas por sección
- `robots.txt` y meta tags configurados
- Open Graph tags para redes sociales

### Reduced Motion

Respeta preferencias del usuario:

```css
@media (prefers-reduced-motion: reduce) {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

## Rendimiento (Performance)

### Técnicas de Optimización Implementadas

1. **RequestAnimationFrame Loop**: Render sincronizado con refresh rate del navegador
2. **Passive Event Listeners**: Para scroll/touch, mejora scrolling performance
3. **Dynamic Imports**: Los engines (Canvas/WebGL) se cargan bajo demanda
4. **Islands Architecture**: Hidratación selectiva solo de componentes interactivos
5. **Throttled Normalization**: Checks periódicos solo cuando scale cruza umbrales φ
6. **CSS will-change**: En elementos animados para optimizar compositing
7. **Minimal Reflows**: Posicionamiento con `transform` en lugar de `top/left`

### Métricas Objetivo

- **LCP (Largest Contentful Paint)**: < 2.5s en conexión 4G
- **FPS**: 55-60 fps (desktop), 45+ fps (móvil)
- **Lighthouse Scores**: SEO ≥ 90, Accessibility ≥ 90
- **Bundle Size**: Core < 50KB (gzip), total inicial < 150KB
- **Time to Interactive**: < 3.5s en dispositivos gama media

### Estrategias de Hidratación

**Islands Pattern con Astro:**

- `SpiralEngineIsland`: Hidratación inmediata (crítico)
- `MenuRadial`: Hidratación on-idle
- `ModalForm`: Hidratación on-demand al abrir
- `FocusOverlay`: CSS-only, sin JavaScript

## Testing y Validación

### Test de Invariancia Visual (CA1)

Verificar que la normalización φ funciona correctamente:

1. Abrir DevTools Console
2. Activar modo debug con el botón "Debug: OFF/ON" (bottom-right)
3. Tomar screenshot en scale = 1.0
4. Hacer zoom hasta cruzar umbral de normalización (scale ≥ φ o < 1)
5. Tomar otro screenshot
6. Comparar: la apariencia visual debe ser idéntica

### Monitoreo de Performance

**En Browser Console:**

```javascript
// Verificar FPS actual
let lastTime = performance.now();
const checkFPS = () => {
  const now = performance.now();
  const fps = 1000 / (now - lastTime);
  console.log(`FPS: ${fps.toFixed(1)}`);
  lastTime = now;
  requestAnimationFrame(checkFPS);
};
checkFPS();

// Medir tiempo de render
performance.mark('render-start');
// ... zoom/pan operations ...
performance.mark('render-end');
performance.measure('render', 'render-start', 'render-end');
console.table(performance.getEntriesByType('measure'));
```

### Pruebas de Accesibilidad

**Checklist Manual:**

- [ ] Navegación completa con Tab (sin mouse)
- [ ] Skip link funcional con Tab inicial
- [ ] Menú radial abre con Space/M
- [ ] Formulario valida y muestra errores
- [ ] Escape cierra menú/modal
- [ ] Focus visible en todos los elementos
- [ ] Screen reader lee contenido correctamente

**Herramientas Automatizadas:**

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:4321

# axe-core DevTools extension
# (Manual: instalar extensión y ejecutar en página)
```

### Tests de Compatibilidad

**Navegadores Soportados:**

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Android (últimas 2 versiones)

**Dispositivos de Prueba:**

- Desktop: 1920x1080, 2560x1440
- Tablet: iPad (1024x768), Android tablet
- Mobile: iPhone 12/13/14, Pixel 5/6

## Deployment

### Build y Despliegue

**Compilación Estática:**

```bash
# Verificar sintaxis y tipos
npm run build
# Output: dist/

# Preview local del build
npm run preview
```

**Plataformas Soportadas:**

| Plataforma | Configuración | Comando Build |
|------------|---------------|---------------|
| **Netlify** | Auto-detect Astro | `npm run build` |
| **Vercel** | Zero-config | `npm run build` |
| **GitHub Pages** | Manual setup | `npm run build` |
| **Cloudflare Pages** | Auto-detect | `npm run build` |

### Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# Renderer mode: 'canvas' (default) o 'webgl'
PUBLIC_RENDERER=canvas

# Form endpoint (Formspree, Netlify Forms, etc.)
PUBLIC_FORM_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID
```

**Configurar en Hosting Platform:**

```toml
# Netlify (netlify.toml)
[build.environment]
  PUBLIC_RENDERER = "canvas"
  PUBLIC_FORM_ENDPOINT = "https://formspree.io/f/xxxxx"
```

```json
# Vercel (vercel.json o dashboard)
{
  "env": {
    "PUBLIC_RENDERER": "canvas",
    "PUBLIC_FORM_ENDPOINT": "https://formspree.io/f/xxxxx"
  }
}
```

### Opciones de Form Endpoints

**Formspree (Recomendado):**

```bash
# 1. Crear cuenta en formspree.io
# 2. Crear nuevo form
# 3. Copiar endpoint: https://formspree.io/f/{form-id}
# 4. Configurar en .env
```

**Netlify Forms:**

```html
<!-- Agregar atributo netlify al form -->
<form netlify name="contact">
  <!-- Ya manejado en ModalForm.astro -->
</form>
```

## Troubleshooting

### Canvas No Renderiza

**Síntomas:** Pantalla negra, spinner infinito

**Soluciones:**

1. Abrir DevTools Console y buscar errores
2. Verificar que canvas context se crea correctamente
3. Comprobar manejo de DPR en displays HiDPI
4. Verificar que módulos se cargan: `SpiralEngineCanvas.ts` o `SpiralEngineGL.ts`

```javascript
// En console, verificar que engine existe
console.log(window.spiralEngine); // Debe tener métodos mount, setTiles, etc.
```

### WebGL No Funciona

**Síntomas:** Error al inicializar WebGL, fallback a canvas

**Causas Comunes:**

- Navegador no soporta WebGL
- Drivers GPU desactualizados
- WebGL deshabilitado en configuración del navegador

**Solución:**

```env
# Cambiar a Canvas renderer
PUBLIC_RENDERER=canvas
```

### Inestabilidad Numérica

**Síntomas:** Jumps visuales durante zoom, coordenadas erráticas

**Verificación:**

1. Activar modo debug (botón bottom-right)
2. Observar valores de `scale` y `a` en consola
3. Verificar que normalización se activa al cruzar φ

**Solución:**

- Verificar constantes en `src/utils/spiral/constants.ts`
- Confirmar que `normalize()` se llama en cada frame
- Ajustar `MIN_SCALE` y `MAX_SCALE` si es necesario

### Problemas de Performance

**Síntomas:** < 30 FPS, lag en interacciones, stuttering

**Diagnóstico:**

```javascript
// Activar profiling en DevTools
// Performance tab > Record > Interactuar > Stop

// O medir FPS en consola
let frames = 0, lastCheck = Date.now();
const measureFPS = () => {
  frames++;
  const now = Date.now();
  if (now - lastCheck >= 1000) {
    console.log(`FPS: ${frames}`);
    frames = 0;
    lastCheck = now;
  }
  requestAnimationFrame(measureFPS);
};
measureFPS();
```

**Soluciones:**

1. Cambiar a Canvas renderer (más ligero que WebGL)
2. Reducir número de tiles en `generateSpiralLayout(count, ...)`
3. Verificar extensiones del navegador (ad-blockers pueden interferir)
4. Cerrar otros tabs que consumen GPU

### Menú Radial No Abre

**Síntomas:** Space/M no activa el menú

**Verificación:**

1. Comprobar que script de MenuRadial se cargó
2. Verificar en console: `window.spiralMenu.show()`
3. Revisar conflictos con otros event listeners

**Solución:**

```javascript
// Forzar apertura manual
window.spiralMenu.show(window.innerWidth / 2, window.innerHeight / 2);
```

### Formulario No Envía

**Síntomas:** Submit no funciona, timeout

**Causas:**

- `PUBLIC_FORM_ENDPOINT` no configurado
- CORS bloqueado por endpoint
- Validación falla silenciosamente

**Solución:**

```javascript
// Verificar endpoint configurado
console.log(import.meta.env.PUBLIC_FORM_ENDPOINT);

// Test manual
const testSubmit = async () => {
  const response = await fetch('YOUR_ENDPOINT', {
    method: 'POST',
    body: new FormData(document.getElementById('spiral-form')),
    headers: { 'Accept': 'application/json' }
  });
  console.log(response.status, await response.text());
};
```

## Arquitectura Técnica

### Stack Tecnológico

**Core Framework:**

- **Astro 4.16+**: SSG con Islands Architecture
- **TypeScript 5.6+**: Type safety y mejor DX
- **Tailwind CSS 3.4+**: Utility-first styling

**Dependencias de Desarrollo:**

- `@astrojs/check`: Validación de tipos en build
- `@astrojs/tailwind`: Integración Tailwind con Astro

### Estructura de Carpetas

```plaintext
src/
├── components/          # Componentes sin hidratación
│   ├── SpiralEngineCanvas.ts   # Renderer Canvas 2D
│   ├── SpiralEngineGL.ts       # Renderer WebGL/GLSL
│   ├── TileCard.astro          # Tarjetas de contenido
│   ├── FocusOverlay.astro      # Overlay de enfoque
│   ├── MenuRadial.astro        # Menú contextual
│   └── ModalForm.astro         # Formularios modales
├── islands/             # Componentes con hidratación
│   └── SpiralEngineIsland.astro
├── layouts/             # Layouts base
│   └── BaseLayout.astro
├── pages/              # Rutas del sitio
│   ├── index.astro             # Experiencia principal
│   ├── linear/index.astro      # Fallback lineal
│   └── sections/[...slug].astro # Páginas estáticas
├── utils/              # Utilidades puras
│   ├── spiral/                 # Matemáticas de espiral
│   │   ├── constants.ts        # PHI, K, etc.
│   │   ├── math.ts            # Funciones logarítmicas
│   │   ├── transforms.ts      # World ↔ Screen
│   │   └── normalize.ts       # Normalización φ
│   ├── input/
│   │   └── unifiedInput.ts    # Abstracción de eventos
│   └── tiles/
│       ├── types.ts           # Interfaces TS
│       └── placement.ts       # Layout de tiles
├── content/            # Colecciones de contenido
│   ├── config.ts
│   └── sections/*.md
├── config/             # Configuración runtime
│   └── graphics.ts            # Renderer y env vars
└── styles/
    └── global.css             # Estilos globales
```

### Flujo de Renderizado

1. **Build Time (SSG):**
   - Astro genera HTML estático para todas las rutas
   - Content collections compilan Markdown a datos
   - Tailwind procesa utilities a CSS optimizado

2. **Load Time:**
   - HTML estático se carga instantáneamente
   - Loading screen visible mientras se hidrata island
   - Dynamic import del engine (Canvas o WebGL)

3. **Runtime:**
   - Engine monta canvas y comienza render loop
   - UnifiedInputHandler escucha eventos
   - State updates → transform recalc → redraw
   - Normalización φ cada N frames si scale cruza umbral

## Roadmap y Estado Actual

### ✅ Implementado (MVP)

- [x] Motor de renderizado dual (Canvas/WebGL)
- [x] Zoom focal con normalización φ
- [x] Sistema de coordenadas world/screen
- [x] Input unificado (mouse, touch, keyboard)
- [x] Menú radial con 4 acciones
- [x] Formulario de contacto con validación
- [x] Focus overlay y loading screen
- [x] Accesibilidad básica (ARIA, keyboard nav)
- [x] Rutas espejo estáticas
- [x] Debug mode toggle

### 🚧 En Desarrollo

- [ ] Sistema de tiles con contenido real
- [ ] Transiciones animadas entre tiles
- [ ] Búsqueda de contenido (action `openSearch`)
- [ ] Navegación por secciones (action `showSections`)
- [ ] Tests automatizados (Vitest + Playwright)

### 🎯 Planificado (Futuro)

- [ ] Rotación sutil atada al scroll
- [ ] Efectos de partículas en espiral
- [ ] Tema claro/oscuro switcheable
- [ ] PWA con offline support
- [ ] Analytics de interacción
- [ ] Multi-idioma (i18n)

## Créditos y Agradecimientos

**Construido con:**

- [Astro](https://astro.build/) - Framework SSG con Islands
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

**Inspirado por:**

- La belleza matemática de la proporción áurea φ
- Visualizaciones interactivas de datos
- Experiencias web inmersivas y artísticas
- El trabajo de Mario Klingemann en arte generativo

**Desarrollado por:**

- **STRTGY** - Consultoría estratégica especializada en IA y transformación digital

---

## Licencia

MIT License - Libre para usar en proyectos personales y comerciales.

## Contacto

Para consultas, issues o feedback:

- 📧 Usa el formulario de contacto en la app
- 🐛 Abre un issue en GitHub
- 💼 Visita [strtgy.com](https://strtgy.com) para consultoría

---

**Nota**: Este es un proyecto de demostración que muestra técnicas web avanzadas. El rendimiento y comportamiento puede variar entre dispositivos y navegadores.
