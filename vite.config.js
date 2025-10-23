import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // Proxy /api requests to your Vercel deployment
      '/api': {
        target: 'https://pathfinder-rowboat.vercel.app', // <-- URL Vercel deployment của bạn
        changeOrigin: true, // Bắt buộc phải có cho Vercel
        secure: false,      // Tắt kiểm tra SSL certificate khi chạy local
        // Không cần 'rewrite' vì Vercel functions nằm ở /api/...
      }
    }
  }
})

