import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/vehicles': 'http://localhost:8000',
      '/drivers': 'http://localhost:8000',
      '/deliveries': 'http://localhost:8000',
      '/logs': 'http://localhost:8000',
    }
  }
})