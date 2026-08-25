import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Consome o pacote compartilhado direto do fonte. O dist/ de
      // packages/shared é CommonJS (o NestJS precisa dele assim), formato que o
      // Vite não importa como ESM em dev — e assim o frontend também não
      // depende de buildar o pacote antes de rodar.
      '@kpmg/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
    },
  },
})
