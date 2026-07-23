import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

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
      external: [/^ol/, 'proj4'],
      output: {
        globals: (name) => name,
        codeSplitting: false,
      },
    },
    outDir: 'dist',
    minify: false,
    sourcemap: true,
  },
});
