import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Rutas relativas: el mismo build funciona en la raíz de un dominio
  // y en un subdirectorio de GitHub Pages sin recompilar.
  base: './',
  plugins: [react(), tailwindcss()],
})
