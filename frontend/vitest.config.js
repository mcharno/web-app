import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/contexts/LanguageContext.jsx',
        'src/components/Navigation.jsx',
        'src/pages/About.jsx',
        'src/services/api.js'
      ],
      thresholds: {
        branches: 75,
        functions: 75,
        lines: 75,
        statements: 75
      }
    }
  }
});
