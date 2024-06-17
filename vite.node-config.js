import { defineConfig } from 'vite';
import { dependencies, devDependencies } from './package.json';

export default defineConfig({
  build: {
    ssr: true,
    rollupOptions: {
      external: [/^ol/, 'proj4'],
      input: 'src-node/index.ts',
      output: {
        entryFileNames: 'dist-node.js',
        globals: (name) => name,
      },
    },
    outDir: 'dist',
    minify: false,
  },
  ssr: {
    noExternal: Object.keys(dependencies).concat(Object.keys(devDependencies)),
    target: 'node',
  },
});
