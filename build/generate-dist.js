const path = require('path');
const { babel } = require('@rollup/plugin-babel');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const common = require('@rollup/plugin-commonjs');
const { rollup } = require('rollup');
const { terser } = require('rollup-plugin-terser');
const json = require('@rollup/plugin-json');
const fse = require('fs-extra');

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

async function serializeAllWorkersInCode(dir, code) {
  let codeResult = code;
  const workerMatches = codeResult.matchAll(/new Worker\('([^']+)'/g);
  for (const match of workerMatches) {
    const workerCode = await serializeWorker(path.join(dir, match[1]));
    codeResult = codeResult.replace(
      `new Worker('${match[1]}'`,
      `new Worker(URL.createObjectURL(new Blob([${JSON.stringify(
        workerCode
      )}], {type: 'application/javascript'}))`
    );
  }
  return codeResult;
}

async function main() {
  const dirname = path.resolve();
  const srcRoot = path.join(dirname, '../src/');
  const distRoot = path.join(dirname, '../dist/');

  async function processFile(filePath, outputPath) {
    if (filePath.endsWith('spec.js')) return;
    const dir = path.dirname(filePath);
    let code = await fse.readFile(filePath, 'utf8');
    code = await serializeAllWorkersInCode(dir, code);
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

  fse.rmdirSync(distRoot, { recursive: true });

  await copyFiles('.');

  const nodeBundle = await rollup({
    input: path.join(dirname, '../src-node/index.js'),
    plugins: [
      common({
        include: /node_modules/,
      }),
      json(),
      nodeResolve({
        preferBuiltins: true,
      }),
      {
        name: 'serialize workers to inline blobs',
        async transform(code, moduleId) {
          return await serializeAllWorkersInCode(path.dirname(moduleId), code);
        },
      },
      babel({
        babelHelpers: 'runtime',
        presets: [['@babel/preset-env']],
        exclude: /node_modules/,
        plugins: [['@babel/transform-runtime']],
      }),
    ],
    external: [/@babel\/runtime/],
  });
  await nodeBundle.write({
    file: path.join(distRoot, './dist-node.js'),
    format: 'cjs',
  });
}

main().catch((err) => {
  process.stderr.write(`${err.stack}\n`);
  process.exit(1);
});
