import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Test Configuration
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true
  },
  
  // CSS Configuration - IMPORTANTE para o Tailwind funcionar
  css: {
    postcss: './postcss.config.js',
  },

  // Server Configuration
  server: {
    port: 3000,
    host: true, // Permite acesso externo
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  // Build Configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Otimização para produção
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        }
      }
    }
  },

  // Resolve Configuration - Sem usar path module
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@hooks': '/src/hooks',
      '@context': '/src/context',
      '@styles': '/src/styles',
    }
  },

  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-hook-form',
      'axios',
      'date-fns',
      'lucide-react',
      'react-toastify'
    ]
  },
})