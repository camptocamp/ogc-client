import { relative, resolve } from 'node:path';
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
    rolldownOptions: {
      // inline only the worker code; the rest of the imports should be left as is to connect to the rest of the build:browser output
      external: (id) => !id.includes('?worker'),
      output: {
        paths: (id) => relative(srcRoot, id),
        codeSplitting: false,
      },
    },
    outDir: 'dist',
    minify: false,
    sourcemap: true,
  },
});
