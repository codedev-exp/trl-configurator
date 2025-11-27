import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Budujemy do folderu 'dist'
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        // Wymuszamy stałą nazwę pliku (bez losowych hashów)
        entryFileNames: 'build.js',
        assetFileNames: 'assets/[name].[ext]',
        format: 'iife', // Format "samowykonywalny", idealny do wklejenia w <script>
        name: 'SlatwallApp'
      }
    }
  },
  // To zapobiega problemom ze ścieżkami na produkcji
  base: './'
})

