
// rebuild 2026-08-07
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/celex-lessonplans-sis/',
})
