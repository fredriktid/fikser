import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const crossOriginIsolation = {
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

const coreVersion = JSON.parse(readFileSync('node_modules/@ffmpeg/core-mt/package.json', 'utf8')).version

export default defineConfig({
  plugins: [vue()],
  define: {
    __FFMPEG_CORE_VERSION__: JSON.stringify(coreVersion),
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  worker: {
    format: 'es',
  },
  server: { headers: crossOriginIsolation },
  preview: { headers: crossOriginIsolation },
})
