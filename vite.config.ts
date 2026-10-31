import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project site: served from https://lrbachtiar.github.io/resume/
export default defineConfig({
  base: '/resume/',
  plugins: [react()],
})
