const path = require('path');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { rollup } = require('rollup');
const { terser } = require('rollup-plugin-terser');
const json = require('@rollup/plugin-json');
const typescript = require('@rollup/plugin-typescript');
const fse = require('fs-extra');
const ts = require('typescript');
const tsConfig = require('../tsconfig.json');

const projectRoot = path.resolve();
const srcRoot = path.join(projectRoot, './src/');
const distRoot = path.join(projectRoot, './dist/');

async function serializeWorker(entryPath) {
  console.log(
    `      (serializing worker at ${path.relative(srcRoot, entryPath)})`
  );
  const plugins = [commonjs(), nodeResolve(), typescript(), terser()];

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

async function processFile(filePath, outputPath) {
  if (filePath.endsWith('spec.ts')) return;
  const dir = path.dirname(filePath);
  console.log('  ', path.relative(srcRoot, filePath));
  let code = await fse.readFile(filePath, 'utf8');

  // TS file
  code = await serializeAllWorkersInCode(dir, code);
  await fse.outputFile(outputPath, code, { flag: 'w' });

  // JS file (using typescript compiler)
  let jsCode = ts.transpileModule(code, tsConfig).outputText;
  await fse.outputFile(outputPath.replace(/\.ts$/, '.js'), jsCode, {
    flag: 'w',
  });
}

async function copyFiles(fileOrDirPath) {
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

async function main() {
  fse.rmSync(distRoot, { force: true, recursive: true });

  console.log(
    '\n> copying source files in TS and JS, serializing worker code...'
  );
  await copyFiles('.');

  console.log('\n> generating full node-compatible bundle');
  const nodeBundle = await rollup({
    input: path.join(projectRoot, './src-node/index.ts'),
    plugins: [
      commonjs({
        include: /node_modules/,
      }),
      json(),
      nodeResolve({
        preferBuiltins: true,
      }),
      typescript(),
    ],
    inlineDynamicImports: true,
  });
  await nodeBundle.write({
    file: path.join(distRoot, './dist-node.js'),
    format: 'cjs',
  });

  console.log(
    `
> files successfully build in ${distRoot} folder.`
  );
}

main().catch((err) => {
  process.stderr.write(`${err.stack}\n`);
  process.exit(1);
});
