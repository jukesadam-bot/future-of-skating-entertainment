import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    open: false
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
