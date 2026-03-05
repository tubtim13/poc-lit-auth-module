/**
 * Federation build config.
 * Run: npm run build:federation
 * Outputs: dist-federation/  (deploy this directory)
 *
 * Requires: npm install --save-dev @module-federation/vite
 */
import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    federation({
      name: 'singhaAuthModule',
      filename: 'remoteEntry.js',
      exposes: {
        // Shell apps import via: import('singhaAuthModule/auth')
        './auth': './src/auth-module.element.ts',
      },
      shared: {
        // Prevent duplicate MSAL instances across micro-frontends
        '@azure/msal-browser': {
          singleton: true,
          requiredVersion: '^5.4.0',
        },
      },
    }),
  ],
  build: {
    // Module Federation 2.0 requires esnext target
    target: 'esnext',
    outDir: 'dist-federation',
    minify: 'esbuild',
    sourcemap: true,
  },
  server: {
    port: 4001,
    // Required so shell apps on different ports can load the remote
    cors: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env['NODE_ENV'] ?? 'development'),
  },
});
