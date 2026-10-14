import { cpSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

for (const pkg of ['core', 'core-mt']) {
  const from = join(root, 'node_modules', '@ffmpeg', pkg, 'dist', 'esm')
  const to = join(root, 'public', 'ffmpeg', pkg)
  mkdirSync(to, { recursive: true })
  cpSync(from, to, { recursive: true })
}
