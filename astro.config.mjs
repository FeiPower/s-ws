import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Derive GitHub Pages base and site when building in Actions
const repoSlug = process.env.GITHUB_REPOSITORY || '';
const [owner, repo] = repoSlug.split('/');
const isCI = process.env.GITHUB_ACTIONS === 'true';
const isUserPage = repo && owner && repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
const computedBase = isCI && repo ? (isUserPage ? '/' : `/${repo}`) : '/';
const computedSite = isCI && owner && repo
  ? `https://${owner}.github.io${isUserPage ? '' : `/${repo}`}`
  : 'https://workalogico.com';

export default defineConfig({
  site: computedSite,
  base: computedBase,
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

