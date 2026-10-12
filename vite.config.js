import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API runs on port 4000 in development (npm run dev). Proxying it through Vite keeps the
// browser on one origin, exactly like production, so cookies and the same-origin checks work.
const apiProxy = {
  '/api': { target: 'http://127.0.0.1:4000', changeOrigin: false },
  '/health': { target: 'http://127.0.0.1:4000', changeOrigin: false }
};

export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [react()],
  // Shown in Settings → About.
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10))
  },
  server: {
    port: 5180,
    strictPort: true,
    proxy: apiProxy
  },
  preview: {
    port: 4173,
    proxy: apiProxy
  },
  build: {
    outDir: 'dist',
    // No source maps in production: the published files do not expose the original source code.
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts']
        }
      }
    }
  },
  // Production builds drop debugger statements and console.log/debug/info (warnings and errors stay).
  esbuild: command === 'build'
    ? { drop: ['debugger'], pure: ['console.log', 'console.debug', 'console.info'] }
    : {}
}));
