import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['./src/**/*'],
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [/^ol/, 'proj4'],
      output: {
        globals: (name) => name,
        inlineDynamicImports: true,
      },
    },
    outDir: 'dist',
    minify: false,
    sourcemap: true,
  },
});
