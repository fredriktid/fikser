import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const crossOriginIsolation = {
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  worker: {
    format: 'es',
  },
  server: { headers: crossOriginIsolation },
  preview: { headers: crossOriginIsolation },
})
