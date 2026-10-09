import { defineConfig } from 'vite';

// Intentionally no server.allowedHosts / preview.allowedHosts:
// the defaults already allow the MARSL preview host.
export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
