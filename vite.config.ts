import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  server: {
    port: 4001,
    open: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  preview: {
    port: 4000,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/auth-module.element.ts'),
      name: 'SinghaAuthModule',
      fileName: 'singha-auth-module',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      // Externalize only if used as micro-frontend; bundle everything for standalone distribution
      external: [],
      output: {
        globals: {},
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env['NODE_ENV'] ?? 'development'),
  },
});
