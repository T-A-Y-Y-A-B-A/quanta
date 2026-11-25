import { defineConfig } from 'vite'

export default defineConfig({
  // three.js is a lazy chunk loaded after first paint, so its size never blocks rendering.
  build: { chunkSizeWarningLimit: 600 },
})
