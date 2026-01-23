import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [
    vue(),
    tailwindcss(),
  ],
})
