import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    // 개발 시 API(8787)로 프록시 — CORS 없이 /api 호출
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
