import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Crucial for Android WebView to load assets relative to index.html
  build: {
    outDir: 'dist',
  },
});
