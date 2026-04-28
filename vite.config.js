import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://tgs-backend-ifpp.onrender.com',
        changeOrigin: true,
      }
    }
  }
})
