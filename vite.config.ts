import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Fixed and strict so electron/main.cjs's hardcoded dev URL (see
    // scripts/desktop-dev.mjs) always points at the right port instead of
    // silently loading nothing if 5173 happened to be taken.
    port: 5173,
    strictPort: true,
  },
})
