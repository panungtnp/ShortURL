import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy forwards /api to the backend so no CORS setup is needed locally.
// Short links + QR codes always use the backend BASE_URL returned by the API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
});
