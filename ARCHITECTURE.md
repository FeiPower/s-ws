# SpiralNav UI - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Astro Page (SSG)                    │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         SpiralEngineIsland (Hydrated)           │  │  │
│  │  │  ┌───────────────┐   ┌────────────────────┐    │  │  │
│  │  │  │ Canvas/WebGL  │   │  UnifiedInput      │    │  │  │
│  │  │  │   Renderer    │◄──│   Handler          │    │  │  │
│  │  │  └───────┬───────┘   └──────┬─────────────┘    │  │  │
│  │  │          │                   │                   │  │  │
│  │  │          ▼                   ▼                   │  │  │
│  │  │  ┌──────────────────────────────────────┐       │  │  │
│  │  │  │        Viewport State                │       │  │  │
│  │  │  │  • scale, offsetX, offsetY, rotation │       │  │  │
│  │  │  │  • φ-normalization state (a, period) │       │  │  │
│  │  │  └──────────────────────────────────────┘       │  │  │
│  │  │          │                                       │  │  │
│  │  │          ▼                                       │  │  │
│  │  │  ┌──────────────────────────────────────┐       │  │  │
│  │  │  │     Coordinate Transforms            │       │  │  │
│  │  │  │  • toWorld() / toScreen()            │       │  │  │
│  │  │  │  • Focal zoom calculations           │       │  │  │
│  │  │  └──────────────────────────────────────┘       │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │          UI Overlays (Astro Components)         │  │  │
│  │  │  • TileCard • MenuRadial • ModalForm            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Input Processing

```
User Input (mouse/touch/keyboard)
    │
    ▼
UnifiedInputHandler
    │
    ├──► onWheel(deltaY, clientX, clientY)
    │        │
    │        ▼
    │    applyFocalZoom()
    │        │
    │        ▼
    │    Update viewport.scale
    │    Adjust offset to keep focal point stable
    │
    ├──► onPan(deltaX, deltaY)
    │        │
    │        ▼
    │    Update viewport.offsetX/Y
    │
    └──► onKeyDown(key, event)
             │
             ▼
         Handle menu/navigation actions
```

### Rendering Pipeline

```
requestAnimationFrame
    │
    ▼
Engine.render()
    │
    ├──► Canvas 2D Path
    │        │
    │        ├─► Clear canvas
    │        ├─► Begin path
    │        ├─► For θ in [-THETA_MAX, THETA_MAX]:
    │        │       r = a * φ^(θ/(π/2))
    │        │       (x, y) = (r·cos(θ), r·sin(θ))
    │        │       (sx, sy) = toScreen(x, y)
    │        │       lineTo(sx, sy)
    │        ├─► Stroke path
    │        └─► Draw debug info
    │
    └──► WebGL Fragment Shader
             │
             ├─► Set uniforms (scale, rotation, logA, K, offset)
             ├─► Draw fullscreen quad
             └─► Shader calculates spiral in fragment:
                     uv = normalized screen coords
                     p = rotate(uv)
                     w = p / scale - offset
                     θ = atan(w.y, w.x)
                     r = length(w)
                     f = log(r) - logA - K·θ
                     bands = fract(f * frequency)
                     color = mix based on bands
```

### φ-Normalization Flow

```
Every frame:
    │
    ▼
Check viewport.scale
    │
    ├──► If scale >= φ:
    │        scale = scale / φ
    │        a = a * φ           (Canvas)
    │        logA = logA + ln(φ)  (WebGL)
    │
    └──► If scale < 1.0:
             scale = scale * φ
             a = a / φ            (Canvas)
             logA = logA - ln(φ)   (WebGL)

Visual appearance remains unchanged!
```

## State Management

### Viewport State

```typescript
interface ViewportState {
  scale: number;      // Current zoom level
  offsetX: number;    // World offset X
  offsetY: number;    // World offset Y
  rotation: number;   // Rotation angle (radians)
}

// Clamped ranges:
// scale ∈ [MIN_SCALE, MAX_SCALE] = [0.01, 100]
// rotation ∈ [-MAX_ROTATION, MAX_ROTATION] = [-π/6, π/6]
```

### Normalization State

```typescript
interface NormalizationState {
  a: number;       // Scale parameter for r = a * φ^(θ/(π/2))
  period: number;  // Normalization period (typically φ)
}

// For WebGL: store logA instead of a
logA = Math.log(a)
```

## Coordinate System

### World Coordinates

Origin at center of spiral. Units are arbitrary but consistent.

```
        +Y
         │
         │
    ─────┼─────  +X
         │
         │
```

### Polar Coordinates

```typescript
r = Math.sqrt(x² + y²)
θ = Math.atan2(y, x)

// Spiral equation:
r(θ) = a * φ^(θ/(π/2))
```

### Screen Coordinates

Top-left origin, Y increases downward.

```
(0,0) ────────► +X
  │
  │
  ▼
 +Y
```

### Transform Mathematics

**World → Screen:**

```typescript
1. Apply world offset: (wx + offsetX, wy + offsetY)
2. Apply rotation matrix:
   x' = x·cos(θ) - y·sin(θ)
   y' = x·sin(θ) + y·cos(θ)
3. Scale: (x'·scale, y'·scale)
4. Center: (sx + cw/2, sy + ch/2)
```

**Screen → World:**

```typescript
1. De-center: (sx - cw/2, sy - ch/2)
2. Inverse rotation:
   x' = x·cos(-θ) - y·sin(-θ)
   y' = x·sin(-θ) + y·cos(-θ)
3. Inverse scale: (x'/scale, y'/scale)
4. Remove offset: (x - offsetX, y - offsetY)
```

## Tile Positioning

### Polar Bounding Box

```typescript
interface PolarBBox {
  rMin: number;  // Inner radius
  rMax: number;  // Outer radius
  tMin: number;  // Start angle (radians)
  tMax: number;  // End angle (radians)
}
```

### Placement Strategy

```
Arc 0: r ∈ [100, 161.8], θ ∈ [0, π/3]
Arc 1: r ∈ [161.8, 261.8], θ ∈ [π/3, 2π/3]
Arc 2: r ∈ [261.8, 423.6], θ ∈ [2π/3, π]
...

Each arc grows by factor of φ in radius
Angular spacing follows golden angle: 2π/φ² ≈ 137.5°
```

### Visibility Calculation

```typescript
1. Get tile center in world coords:
   rCenter = (rMin + rMax) / 2
   θCenter = (tMin + tMax) / 2
   (wx, wy) = (rCenter·cos(θCenter), rCenter·sin(θCenter))

2. Transform to screen:
   (sx, sy) = toScreen(wx, wy)

3. Check if on screen:
   visible = sx ∈ [-margin, width+margin] &&
             sy ∈ [-margin, height+margin]
```

## Event System

### Custom Events

```typescript
// Menu action
window.dispatchEvent(
  new CustomEvent('spiralMenuAction', {
    detail: { action: 'goHome' | 'showSections' | 'openSearch' | 'openContact' }
  })
);

// Tile focus
engine.onFocus((tileId: TileId | null) => {
  // Update UI to highlight focused tile
});
```

## Performance Optimizations

### Rendering

1. **RAF Scheduling**: Use `requestAnimationFrame` for smooth 60fps
2. **Canvas Culling**: Only draw visible portions of spiral
3. **Path2D Caching**: Reuse path objects when possible
4. **DPR Handling**: Scale canvas for HiDPI displays

### Input

1. **Passive Listeners**: Mark scroll/touch listeners as passive
2. **Throttle/Debounce**: Limit normalization checks
3. **Touch Optimization**: Track only active touches

### Memory

1. **Object Pooling**: Reuse coordinate objects
2. **Minimize GC**: Avoid allocations in render loop
3. **Cleanup**: Proper unmount/destroy handlers

## Accessibility Architecture

### Keyboard Navigation Flow

```
Space/M pressed
    │
    ▼
Show radial menu
    │
    ├──► Tab/Arrow: cycle menu items
    ├──► Enter: activate item
    └──► Escape: close menu

Menu action: openContact
    │
    ▼
Show modal form
    │
    ├──► Tab: cycle form fields
    ├──► Enter: submit
    └──► Escape: close modal
```

### ARIA Landmarks

```html
<main role="main">
  <div role="application" aria-label="Spiral navigation">
    <!-- Canvas here -->
  </div>
</main>

<div role="menu" aria-label="Navigation menu">
  <button role="menuitem">...</button>
</div>

<div role="dialog" aria-modal="true">
  <form>...</form>
</div>
```

### SEO Strategy

```
Primary Experience (/)
    │
    ├──► Canvas/WebGL spiral (JavaScript required)
    └──► <noscript> → Redirect to /linear

Mirror Routes
    │
    ├──► /linear → List all sections
    ├──► /sections/section-1 → Static HTML content
    └──► /sections/section-2 → Static HTML content

All content indexed by search engines
All routes accessible without JavaScript
```

## Testing Strategy

### Visual Invariance (CA1)

```
Test: φ-normalization doesn't cause visual jumps

1. Capture frame at scale = 1.0
2. Zoom to scale = φ (trigger normalization)
3. Capture frame after normalization
4. Compare pixel-by-pixel
5. Assert: difference < epsilon (accounting for float precision)
```

### Performance (CA2)

```
Target: 55-60 FPS desktop, 45+ FPS mobile

1. Start performance monitoring
2. Navigate spiral for 30 seconds
3. Record FPS samples
4. Calculate: min, max, average, p95
5. Assert: average >= target, p95 >= target * 0.9
```

### Accessibility (CA3)

```
Test: Full keyboard navigation

1. Focus spiral container
2. Press Space → menu opens
3. Tab → focus cycles through items
4. Enter → action executes
5. Escape → menu closes
6. Assert: all actions reachable without mouse
```

### SEO (CA4)

```
Test: Lighthouse scores

1. Run Lighthouse on /
2. Run Lighthouse on /linear
3. Run Lighthouse on /sections/section-1
4. Assert: SEO score >= 90, A11y score >= 90
```

## Browser Compatibility

### Required Features

- Canvas 2D Context (all modern browsers)
- WebGL (optional, for WebGL renderer)
- ES2020+ JavaScript
- CSS Grid & Flexbox
- Touch Events API
- Pointer Events API

### Fallback Strategy

```
1. Attempt WebGL (if PUBLIC_RENDERER=webgl)
   └─► Fail → Fall back to Canvas

2. Attempt Canvas
   └─► Fail → Show static SVG + message

3. JavaScript disabled
   └─► <noscript> redirect to /linear
```

## Security Considerations

1. **Form Submission**: Client-side validation + external endpoint
2. **XSS Prevention**: Sanitize all user input (form data)
3. **CSP Headers**: Configure in deployment
4. **HTTPS**: Required for production

## Deployment Checklist

- [ ] Set `site` in `astro.config.mjs`
- [ ] Configure `PUBLIC_FORM_ENDPOINT`
- [ ] Replace placeholder OG image
- [ ] Update `robots.txt` with actual domain
- [ ] Test on target devices
- [ ] Run Lighthouse audits
- [ ] Verify analytics/monitoring
- [ ] Enable CDN caching
- [ ] Configure cache headers

## Future Enhancements

1. **Search**: Full-text search across tiles
2. **Animations**: Smooth transitions when focusing tiles
3. **Themes**: Light/dark mode toggle
4. **i18n**: Multi-language support
5. **Analytics**: Track navigation patterns
6. **WebXR**: VR/AR spiral navigation
7. **Audio**: Subtle sound effects for interactions
8. **Collaborative**: Multi-user exploration

---

For implementation details, see README.md and inline code comments.

