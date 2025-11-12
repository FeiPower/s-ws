# Development Guide - SpiralNav UI

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:4321
```

## Development Workflow

### 1. File Watching

Astro dev server includes:
- Hot Module Replacement (HMR)
- Auto-reload on file changes
- TypeScript type checking
- Tailwind CSS JIT compilation

### 2. Browser DevTools

#### Debug Mode

Enable in-app debug overlay:

```javascript
// In browser console
window.spiralEngine.config.debug = true;
```

Shows:
- Current scale, offset, rotation
- Parameter 'a' value
- Tile count
- FPS counter (if implemented)

#### Performance Profiling

```javascript
// Chrome DevTools > Performance tab
1. Click Record
2. Navigate the spiral
3. Stop recording
4. Analyze frame timing, GC events
```

### 3. Testing Normalization

**Manual Test:**

```javascript
// In console
const engine = window.spiralEngine;

// Get initial state
const before = {
  scale: engine.getViewport().scale,
  a: engine.normState?.a || 'N/A'
};

// Force zoom to trigger normalization
for (let i = 0; i < 10; i++) {
  engine.handleWheel(-100, 400, 300);
}

// Check after
const after = {
  scale: engine.getViewport().scale,
  a: engine.normState?.a || 'N/A'
};

console.log('Before:', before, 'After:', after);
// Visual appearance should be identical!
```

### 4. Content Development

#### Adding New Sections

1. Create file: `src/content/sections/my-section.md`

```markdown
---
title: "My New Section"
description: "A brief description"
pubDate: 2024-01-15
priority: 8
bbox:
  rMin: 400
  rMax: 647
  tMin: 3.14
  tMax: 4.19
---

# Content here

Your markdown content...
```

2. Content automatically available at:
   - Spiral: as a tile (if bbox specified)
   - Linear: `/linear`
   - Direct: `/sections/my-section`

#### Tile Positioning

Use the helper to calculate bbox:

```typescript
import { generatePolarBBox } from '../utils/tiles/placement';

// Generate bbox for arc index 5
const bbox = generatePolarBBox(5);
console.log(bbox);
// { rMin: X, rMax: Y, tMin: A, tMax: B }
```

### 5. Renderer Development

#### Canvas Engine

Located: `src/components/SpiralEngineCanvas.ts`

Key methods:
- `render()`: Main draw loop
- `drawSpiral()`: Path rendering
- `normalize()`: φ-normalization
- `handleWheel()`, `handlePan()`: Input

**Adding Features:**

```typescript
// In SpiralEngineCanvas
private drawSpiral(): void {
  // ... existing code ...
  
  // Add your custom drawing:
  this.ctx.beginPath();
  this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  this.ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
  this.ctx.fill();
}
```

#### WebGL Engine

Located: `src/components/SpiralEngineGL.ts`

**Modifying Shader:**

Edit `FRAGMENT_SHADER` constant:

```glsl
// Change spiral appearance
float f = (log(max(r, 1e-6)) - uLogA) - uK * theta;

// Try different band patterns:
float g = abs(fract(f * 12.0) - 0.5);  // More bands
float g = abs(sin(f * 6.0));           // Sinusoidal
```

**Performance Tip:** Keep fragment shader simple - it runs millions of times per frame.

### 6. Input Handling

Located: `src/utils/input/unifiedInput.ts`

**Adding Custom Keyboard Shortcuts:**

```typescript
// In handleKeyDown method
case 'r':
case 'R':
  e.preventDefault();
  // Rotate 90 degrees
  if (this.callbacks.onRotate) {
    this.callbacks.onRotate(Math.PI / 2);
  }
  break;
```

Then implement callback in engine.

### 7. UI Components

#### Creating New Components

```astro
---
// src/components/MyComponent.astro
interface Props {
  visible?: boolean;
  data: string;
}

const { visible = false, data } = Astro.props;
---

<div class:list={['my-component', visible && 'visible']}>
  <p>{data}</p>
</div>

<style>
  .my-component {
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .my-component.visible {
    opacity: 1;
  }
</style>

<script>
  // Client-side interactivity
  const component = document.querySelector('.my-component');
  component?.addEventListener('click', () => {
    console.log('Clicked!');
  });
</script>
```

#### Using in Island

```astro
---
// src/islands/SpiralEngineIsland.astro
import MyComponent from '../components/MyComponent.astro';
---

<MyComponent visible={true} data="Hello" />
```

### 8. Styling

#### Tailwind Custom Classes

Edit `tailwind.config.cjs`:

```javascript
theme: {
  extend: {
    colors: {
      'my-color': '#123456',
    },
    animation: {
      'my-animation': 'spin 3s ease-in-out infinite',
    },
  },
},
```

Use: `class="bg-my-color animate-my-animation"`

#### Global Styles

Edit `src/styles/global.css`:

```css
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-spiral-accent text-white rounded;
    @apply hover:bg-spiral-accent/80 transition-colors;
  }
}
```

### 9. TypeScript

#### Adding Types

`src/utils/tiles/types.ts`:

```typescript
export interface MyNewType {
  id: string;
  value: number;
}

export type MyUnion = 'option1' | 'option2';
```

#### Type Checking

```bash
# Check all files
npm run astro check

# Watch mode
npm run astro check -- --watch
```

### 10. Environment Variables

#### Local Development

Create `.env`:

```env
PUBLIC_RENDERER=webgl
PUBLIC_FORM_ENDPOINT=http://localhost:3000/form
PUBLIC_DEBUG_MODE=true
```

Access in code:

```typescript
const debugMode = import.meta.env.PUBLIC_DEBUG_MODE === 'true';
```

### 11. Debugging Common Issues

#### Issue: Canvas Blank

**Check:**
1. Canvas created and mounted
2. Context acquired (`getContext('2d')`)
3. Canvas dimensions set
4. No JavaScript errors in console

**Fix:**
```typescript
console.log('Canvas:', this.canvas);
console.log('Context:', this.ctx);
console.log('Width:', this.canvas.width, 'Height:', this.canvas.height);
```

#### Issue: Normalization Not Working

**Check:**
1. `normalize()` called every frame
2. Scale actually crossing φ threshold
3. 'a' parameter updating correctly

**Fix:**
```typescript
console.log('Before normalize:', this.viewport.scale, this.normState.a);
this.normalize();
console.log('After normalize:', this.viewport.scale, this.normState.a);
```

#### Issue: Input Not Responding

**Check:**
1. Event listeners attached
2. Element has `touch-action: none`
3. No event.preventDefault() blocking

**Fix:**
```typescript
// Log all input events
onWheel: (deltaY, x, y) => {
  console.log('Wheel:', deltaY, x, y);
  // ...
}
```

#### Issue: Poor Performance

**Profile:**
1. Open Chrome DevTools > Performance
2. Record 3-5 seconds of navigation
3. Look for:
   - Long frames (>16ms)
   - Forced reflows
   - Excessive GC

**Common Fixes:**
- Reduce spiral detail (increase THETA_STEP)
- Implement culling (don't draw off-screen)
- Use `will-change` CSS sparingly
- Avoid allocations in render loop

### 12. Build and Preview

```bash
# Production build
npm run build

# Check output
ls -lh dist/

# Preview locally
npm run preview
# Open http://localhost:4321
```

### 13. Code Style

#### Naming Conventions

```typescript
// Constants: SCREAMING_SNAKE_CASE
const MAX_SCALE = 100;

// Types/Interfaces: PascalCase
interface ViewportState { }

// Functions/Variables: camelCase
const calculateRadius = () => {};

// Private class members: camelCase with 'private'
private viewport: ViewportState;

// Event handlers: handle prefix
const handleWheel = (e: WheelEvent) => {};
```

#### File Organization

```
- One component per file
- Colocate types with implementation
- Shared types in utils/tiles/types.ts
- Keep files < 500 lines (split if larger)
```

### 14. Git Workflow

```bash
# Feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: add my feature"

# Push
git push origin feature/my-feature

# Open PR on GitHub
```

#### Commit Message Format

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- perf: Performance improvement
- test: Tests
- chore: Maintenance
```

### 15. Useful Commands

```bash
# Format code
npx prettier --write src/

# Lint
npx eslint src/

# Type check
npx tsc --noEmit

# Bundle analysis
npm run build -- --stats
# Upload dist/stats.json to bundlephobia.com

# Find TODOs
grep -r "TODO" src/

# Count lines of code
find src -name "*.ts" -o -name "*.astro" | xargs wc -l
```

### 16. Resources

- [Astro Docs](https://docs.astro.build/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [MDN WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)

---

Happy coding! 🌀

