import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    // Budujemy bezpośrednio do folderu modułu PrestaShop
    outDir: path.resolve(__dirname, '../ps_slatwall/assets/js'),
    emptyOutDir: false, // Nie czyść folderu, bo mogą tam być inne pliki
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

