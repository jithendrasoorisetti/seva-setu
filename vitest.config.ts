import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/services/rules/**', 'src/schemas/**', 'src/lib/**'],
      exclude: ['**/types.ts', '**/*.d.ts', 'src/schemas/index.ts'],
      thresholds: {
        'src/services/rules/**': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        'src/schemas/**': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
