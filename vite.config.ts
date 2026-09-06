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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/](codemirror|@codemirror|@lezer)[\\/]/.test(id)) return 'codemirror'
            if (/[\\/](@tiptap|prosemirror)[\\/]/.test(id)) return 'tiptap'
            if (/[\\/]mermaid[\\/]/.test(id)) return 'mermaid'
            if (/[\\/](react|react-dom|react-refresh|scheduler)[\\/]/.test(id)) return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: false,
    target: 'es2020',
  },
})
