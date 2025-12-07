import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: "/F1-Live/", // Matches your GitHub repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});