import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project sites serve from /<repo>/ — the deploy workflow sets
  // VITE_BASE to that subpath; locally and at a domain root it stays '/'.
  base: process.env.VITE_BASE || '/',
  plugins: [svelte(), svelteTesting()],
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'] },
})
