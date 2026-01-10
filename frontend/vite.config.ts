import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin to ensure _redirects file is copied to dist
    {
      name: 'copy-redirects',
      closeBundle() {
        try {
          copyFileSync(
            path.resolve(__dirname, 'public/_redirects'),
            path.resolve(__dirname, 'dist/_redirects')
          );
          console.log('✓ _redirects file copied to dist');
        } catch (error) {
          console.warn('⚠ Could not copy _redirects file:', error);
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public', // Ensure public directory is copied
});

