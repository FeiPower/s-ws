# Getting Started with SpiralNav UI

A quick-start guide to get the Fibonacci spiral navigation up and running in minutes.

## Prerequisites

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **pnpm**
- A modern web browser
- Basic familiarity with terminal/command line

## Installation

### Step 1: Navigate to Project

```bash
cd spiral-site
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Astro framework
- TypeScript compiler
- Tailwind CSS
- All required dependencies

**Note**: Installation may take 2-3 minutes on first run.

### Step 3: Configure Environment

Copy the example environment file:

```bash
# macOS/Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# Windows (CMD)
copy .env.example .env
```

Edit `.env` file:

```env
# Choose renderer: 'canvas' (default) or 'webgl'
PUBLIC_RENDERER=canvas

# Form endpoint (get from Formspree.io or use your own)
PUBLIC_FORM_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID
```

**Canvas vs WebGL:**
- **Canvas** (Recommended): Works everywhere, good performance
- **WebGL**: Better visuals, requires GPU, may not work on older devices

## Running the Development Server

### Start Development Mode

```bash
npm run dev
```

You should see:

```
🚀 astro  v4.x.x started in XXXms

  ┃ Local    http://localhost:4321/
  ┃ Network  use --host to expose
```

### Open in Browser

Navigate to: [http://localhost:4321](http://localhost:4321)

You should see:
1. Loading spinner (briefly)
2. The spiral rendering
3. Navigation instructions overlay (top-left)

## First Interaction

### Try These Actions

1. **Zoom In**: Scroll wheel down (or pinch in on touch)
2. **Zoom Out**: Scroll wheel up (or pinch out on touch)
3. **Pan**: Click and drag with mouse
4. **Open Menu**: Press Space or M key
5. **Navigate**: Use arrow keys or WASD
6. **Reset**: Press H or Home key

### What to Observe

- Smooth zooming with the point under your cursor staying fixed
- Subtle rotation as you scroll
- The spiral maintains its appearance even at extreme zoom levels
- No visual "jumps" or discontinuities

## Project Structure Overview

```
spiral-site/
├── src/
│   ├── pages/
│   │   └── index.astro          ← Main page (start here)
│   ├── components/
│   │   ├── SpiralEngineCanvas.ts ← Canvas renderer
│   │   └── SpiralEngineGL.ts    ← WebGL renderer
│   ├── islands/
│   │   └── SpiralEngineIsland.astro ← Interactive component
│   └── content/
│       └── sections/             ← Add your content here
├── public/
│   ├── favicon.svg
│   └── robots.txt
└── package.json
```

## Adding Your First Content Section

### Step 1: Create Markdown File

Create `src/content/sections/my-section.md`:

```markdown
---
title: "My First Section"
description: "This is my custom content"
pubDate: 2024-01-20
priority: 10
bbox:
  rMin: 100
  rMax: 161.8
  tMin: 0
  tMax: 1.047
---

# Welcome to My Section

This content will appear both:
- As a tile in the spiral
- At `/sections/my-section`
- In the linear navigation at `/linear`

## Features

You can use all markdown features:

- Lists
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Code blocks

```typescript
const greeting = "Hello, Spiral!";
```

Happy spiraling!
```

### Step 2: View Your Content

Your content is now available at:
- **Spiral**: Navigate to the tile position
- **Direct URL**: [http://localhost:4321/sections/my-section](http://localhost:4321/sections/my-section)
- **Linear Nav**: [http://localhost:4321/linear](http://localhost:4321/linear)

## Customization

### Change Theme Colors

Edit `tailwind.config.cjs`:

```javascript
theme: {
  extend: {
    colors: {
      'spiral-dark': '#0a0a0a',    // Background
      'spiral-light': '#f5f5f5',   // Text
      'spiral-accent': '#6366f1',  // Accent color
    },
  },
},
```

### Modify Spiral Appearance

**Canvas Version** (`src/components/SpiralEngineCanvas.ts`):

```typescript
// Line 207: Change stroke color
this.ctx.strokeStyle = '#444';  // Change to '#ff0000' for red

// Line 208: Change line width
this.ctx.lineWidth = 2;  // Change to 4 for thicker lines
```

**WebGL Version** (`src/components/SpiralEngineGL.ts`):

```glsl
// Line 49: Change background color
vec3 bgColor = vec3(0.04, 0.04, 0.04);

// Line 50: Change line color
vec3 lineColor = vec3(0.26, 0.27, 0.29);
```

### Adjust Navigation Sensitivity

Edit `src/utils/spiral/constants.ts`:

```typescript
// Line 36: Zoom speed
export const ZOOM_SENSITIVITY = 0.0015;  // Lower = slower zoom

// Line 41: Rotation amount
export const ROTATION_SENSITIVITY = 0.0003;  // Lower = less rotation
```

## Building for Production

### Step 1: Build

```bash
npm run build
```

Output appears in `dist/` folder.

### Step 2: Preview

```bash
npm run preview
```

Opens production build at [http://localhost:4321](http://localhost:4321)

### Step 3: Deploy

Upload `dist/` folder to any static host:

**Netlify (Recommended)**:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Vercel**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Other Options**:
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront
- Any CDN

## Troubleshooting

### Issue: Dependencies Won't Install

**Solution**:
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install --force
```

### Issue: Canvas is Blank

**Check**:
1. Open browser DevTools (F12)
2. Look for JavaScript errors in Console
3. Enable debug mode: Press F12, type `window.spiralEngine.config.debug = true`

### Issue: Poor Performance

**Try**:
1. Switch to Canvas renderer: Set `PUBLIC_RENDERER=canvas` in `.env`
2. Close other browser tabs
3. Check browser extensions aren't interfering
4. Try a different browser (Chrome recommended)

### Issue: Touch Not Working

**Check**:
1. Browser supports touch events
2. Element has `touch-action: none` (should be automatic)
3. Try two-finger pinch for zoom

### Issue: Menu Won't Open

**Try**:
1. Press Space or M key
2. Check keyboard focus is on the page (click canvas first)
3. Check browser console for JavaScript errors

## Common Questions

### Q: Can I use this commercially?

**A**: Yes! MIT license allows commercial use. See LICENSE file.

### Q: Does this work on mobile?

**A**: Yes, fully responsive with touch support. Test on actual devices.

### Q: Can I change the spiral equation?

**A**: Yes! Edit `src/utils/spiral/math.ts` and the render methods in the engines.

### Q: How do I add more tiles?

**A**: Create markdown files in `src/content/sections/`. They auto-generate tiles and routes.

### Q: Can I use a different framework?

**A**: The spiral engines are pure TypeScript and can be extracted for use in React, Vue, Svelte, etc.

### Q: Where do forms submit to?

**A**: External endpoint (Formspree, Netlify Forms, etc.). Set in `PUBLIC_FORM_ENDPOINT`.

## Next Steps

Now that you're up and running:

1. **Read the docs**: Check out `README.md` for full feature list
2. **Explore code**: Look at `DEVELOPMENT.md` for development guide
3. **Customize**: Make it your own! Change colors, content, spiral equation
4. **Deploy**: Share your creation with the world
5. **Contribute**: Found a bug? Have an idea? Open an issue on GitHub

## Getting Help

- **Documentation**: `README.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`
- **Issues**: Check existing issues on GitHub
- **Community**: Ask questions via GitHub Discussions
- **Contact**: Use the contact form in the app

## Quick Reference

### Development Commands

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run astro     # Run Astro CLI
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Scroll | Zoom in/out |
| Click + Drag | Pan |
| Arrow Keys / WASD | Navigate |
| + / - | Zoom in/out |
| Space / M | Open menu |
| H / Home | Reset view |
| Escape | Close menu/modal |
| Tab | Navigate UI |

### File Locations

| What | Where |
|------|-------|
| Add content | `src/content/sections/*.md` |
| Change colors | `tailwind.config.cjs` |
| Edit spiral | `src/components/SpiralEngine*.ts` |
| Configure env | `.env` |
| Global styles | `src/styles/global.css` |

## Resources

- [Astro Documentation](https://docs.astro.build/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Canvas API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [WebGL Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial)

---

**Enjoy building with SpiralNav UI!** 🌀

For detailed technical information, see `README.md` and `ARCHITECTURE.md`.

