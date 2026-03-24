
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom']
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react-vendor';
            if (id.includes('motion')) return 'motion';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('lucide-react')) return 'icons';
          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  });