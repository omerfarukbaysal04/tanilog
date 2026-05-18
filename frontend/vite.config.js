import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          markdown: ['react-markdown'],
          ui: ['react-icons', 'react-hot-toast'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'cereless-occasionally-chrystal.ngrok-free.dev',
      '.ngrok-free.dev',
      '.trycloudflare.com',
      'frontend',
      'tanilog-frontend',
    ],
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
});
