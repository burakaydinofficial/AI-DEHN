import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 8091 },
  define: {
    'import.meta.env.VITE_ADMIN_API_BASE': JSON.stringify(process.env.VITE_ADMIN_API_BASE || 'http://localhost:3091/api')
  }
})
