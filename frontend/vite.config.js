import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api and /media are proxied to the Django server so you don't need CORS.
const backend = process.env.VITE_BACKEND || 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: backend, changeOrigin: false },
      '/media': { target: backend, changeOrigin: false },
    },
  },
});
