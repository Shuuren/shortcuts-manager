import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build optimizations
  build: {
    // Enable minification
    minify: 'esbuild',
    
    // Target modern browsers for smaller bundle
    target: 'esnext',
    
    // Code splitting configuration
    rollupOptions: {
      output: {
        // Chunk splitting for better caching
        manualChunks: {
          // Separate React into its own chunk
          'react-vendor': ['react', 'react-dom'],
          // Separate animations (heavy library)
          'framer': ['framer-motion'],
          // UI utilities
          'ui-utils': ['lucide-react', 'clsx', 'tailwind-merge'],
        },
      },
    },
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
    
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    
    // CSS code splitting
    cssCodeSplit: true,
  },
  
  // Development server optimizations
  server: {
    // Pre-bundle dependencies for faster cold start
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/components/**/*.jsx',
      ],
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
  },
})
