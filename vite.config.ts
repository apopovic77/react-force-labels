import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';

  return {
    plugins: [
      react(),
      isLib && dts({
        include: ['src/index.ts', 'src/types.ts', 'src/components/**/*.tsx', 'src/engine/**/*.ts'],
        exclude: ['src/demo/**/*'],
      }),
    ].filter(Boolean),
    build: isLib ? {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'ReactForceLabels',
        formats: ['es'],
        fileName: 'index',
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'react/jsx-runtime',
          },
        },
      },
      outDir: 'dist',
    } : {
      outDir: 'dist-demo',
    },
  };
});
