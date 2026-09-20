import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts (same reasoning as plour-x-dialer's):
// vitest bundles its own nested `vite`, which can structurally conflict
// with @vitejs/plugin-react's types if combined in one config.
export default defineConfig({
  test: {
    environment: 'jsdom',
  },
});
