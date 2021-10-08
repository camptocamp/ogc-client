import path from 'path';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import common from '@rollup/plugin-commonjs';
import { rollup } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import fse from 'fs-extra';

async function serializeWorker(entryPath) {
  const plugins = [
    common(),
    nodeResolve(),
    babel({
      babelHelpers: 'runtime',
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            targets: 'last 2 versions, not dead',
          },
        ],
      ],
      plugins: [['@babel/transform-runtime']],
    }),
    terser(),
  ];

  const bundle = await rollup({
    input: entryPath,
    plugins,
    inlineDynamicImports: true,
  });
  const { output } = await bundle.generate({ format: 'es' });

  if (output.length !== 1) {
    throw new Error(`Unexpected output length: ${output.length}`);
  }

  const chunk = output[0];
  if (chunk.isAsset) {
    throw new Error('Expected a chunk, got an asset');
  }

  return chunk.code;
}

async function main() {
  const dirname = path.resolve();
  const srcRoot = path.join(dirname, '../src/');
  const distRoot = path.join(dirname, '../dist/');

  async function processFile(filePath, outputPath) {
    if (filePath.endsWith('spec.js')) return;
    const dir = path.dirname(filePath);
    let code = await fse.readFile(filePath, 'utf8');

    const workerMatches = code.matchAll(/new Worker\('([^']+)'/g);
    for (const match of workerMatches) {
      const workerCode = await serializeWorker(path.join(dir, match[1]));
      code = code.replace(
        `new Worker('${match[1]}'`,
        `new Worker(URL.createObjectURL(new Blob([${JSON.stringify(
          workerCode
        )}], {type: 'application/javascript'}))`
      );
    }

    await fse.outputFile(outputPath, code, { flag: 'w' });
  }

  async function copyFiles(fileOrDirPath) {
    console.log('copying ', fileOrDirPath);
    const fullSrcPath = path.join(srcRoot, fileOrDirPath);
    const fullDistPath = path.join(distRoot, fileOrDirPath);
    const stats = await fse.lstat(fullSrcPath);
    if (stats.isFile(fullSrcPath)) {
      await processFile(fullSrcPath, fullDistPath);
    } else if (stats.isDirectory(fullSrcPath)) {
      const entries = await fse.readdir(fullSrcPath);
      for (const entry of entries) {
        await copyFiles(path.join(fileOrDirPath, entry));
      }
    }
  }

  fse.remove(distRoot);

  await copyFiles('.');
}

main().catch((err) => {
  process.stderr.write(`${err.stack}\n`);
  process.exit(1);
});
