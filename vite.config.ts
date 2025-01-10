import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Ensures build files are output to the 'dist' directory
    sourcemap: true, // Optional: helpful for debugging production issues
  },
  optimizeDeps: {
    exclude: ['lucide-react'], // Excludes 'lucide-react' from pre-bundling
  },
});
