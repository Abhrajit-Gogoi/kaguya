import { defineConfig } from 'vite';

export default defineConfig({
  base: '/kaguya/',
  build: {
    target: 'esnext'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
  worker: {
    format: 'es'
  }
});