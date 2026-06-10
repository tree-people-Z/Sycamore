import { readFileSync } from 'fs'
import { join } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'

const katexCss = readFileSync(join(__dirname, 'node_modules/katex/dist/katex.min.css'), 'utf-8')

export default defineConfig({
  resolve: {
    alias: {
      'lucide-react': 'lucide-react/dist/cjs/lucide-react.js',
    },
  },
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          define: { __KATEX_CSS__: JSON.stringify(katexCss) },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload()
        },
      },
    ]),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tiptap: ['@tiptap/react', '@tiptap/starter-kit'],
          mermaid: ['mermaid'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: false,
    target: 'es2020',
  },
})
