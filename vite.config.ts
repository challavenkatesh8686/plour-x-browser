import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }

export default defineConfig({
  plugins: [react()],
  // Lets the About settings page show the real build version without a
  // runtime fetch -- baked in at build time, same as any other constant.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    // Fixed and strict so electron/main.cjs's hardcoded dev URL (see
    // scripts/desktop-dev.mjs) always points at the right port instead of
    // silently loading nothing if 5173 happened to be taken.
    port: 5173,
    strictPort: true,
  },
})
