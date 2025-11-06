import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // O seu pode ser 'plugin-react-ts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redireciona requisições de /api (do frontend)
      // para o seu backend Vercel (que roda em 'vercel dev')
      '/api': {
        // 'vercel dev' geralmente roda na porta 3000
        target: 'http://localhost:3000', 
        changeOrigin: true,
      },
    },
  },
})