import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://workalogico.com',
  integrations: [tailwind()],
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'spiral-engine': ['./src/components/SpiralEngineCanvas.ts', './src/components/SpiralEngineGL.ts'],
          },
        },
      },
    },
  },
});

