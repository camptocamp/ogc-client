import { resolve, relative } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const srcRoot = resolve('src');

export default defineConfig({
  plugins: [
    // note: this will generate d.ts files for all the library
    dts({
      include: ['./src/**/*'],
      exclude: ['./src/**/*.spec.ts'],
    }),
  ],
  build: {
    lib: {
      entry: 'src/worker/index.ts',
      formats: ['es'],
      fileName: `worker/index`,
    },
    emptyOutDir: false,
    rollupOptions: {
      // Inline only the worker code, not the dependencies
      external: (source, importer) => {
        if (!importer) return false;
        if (source.includes('?worker')) return false;
        return true;
      },
      output: {
        paths: (id) => relative(srcRoot, id),
        inlineDynamicImports: true,
      },
    },
    outDir: 'dist',
    minify: false,
    sourcemap: true,
  },
});
