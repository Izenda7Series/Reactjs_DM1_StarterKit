import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import izendaTokenPlugin from './vite-plugin-izenda-token.js';

export default defineConfig({
  plugins: [
    react(),
    izendaTokenPlugin()
  ],
  server: {
    // 1. Host Configuration (Defaults to '0.0.0.0' to allow external traffic)
    host: process.env.VITE_HOST || '0.0.0.0',
    
    // 2. Port Configuration (Converts string to integer, defaults to 5000)
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT, 10) : 5000,
    
    // 3. Allowed Hosts Configuration (Splits comma-separated list, defaults to localhost)
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',').map(host => host.trim())
      : ['<hosting_server_name>', '127.0.0.1']
  },
  preview: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT, 10) : 5000,
    host: process.env.VITE_HOST || '0.0.0.0',
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',').map(host => host.trim())
      : ['<hosting_server_name>', '127.0.0.1'],
    proxy: {
      '/user': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
