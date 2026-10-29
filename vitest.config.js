import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'database',
          environment: 'node',
          include: ['tests/database/**/*.test.js'],
        },
      },
      {
        test: {
          name: 'backend',
          environment: 'node',
          include: ['tests/backend/**/*.test.js'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'frontend',
          environment: 'jsdom',
          include: ['tests/frontend/**/*.test.{js,jsx}'],
          setupFiles: ['tests/frontend/setup.jsx'],
          css: false,
        },
      },
    ],
  },
});
