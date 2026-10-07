/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Served from https://<user>.github.io/poop-scoopin-boogie/
// `npm run build:demo` makes one self-contained HTML file with sample data.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'demo' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'demo' ? { outDir: 'dist-demo' } : {},
  test: { include: ['src/**/*.test.ts'] },
}))
