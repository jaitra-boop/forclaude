import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Used by `npm run browser:dev` — serves the renderer standalone in a browser.
export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 3000
  }
})
