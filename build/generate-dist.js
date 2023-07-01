#!/usr/bin/env node

const path = require('path');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { rollup } = require('rollup');
const terser = require('@rollup/plugin-terser');
const json = require('@rollup/plugin-json');
const typescript = require('@rollup/plugin-typescript');
const fse = require('fs-extra');
const ts = require('typescript');

const projectRoot = path.resolve();
const srcRoot = path.join(projectRoot, './src/');
const distRoot = path.join(projectRoot, './dist/');

async function serializeWorker(entryPath) {
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

async function serializeAllWorkersInCode(fileName, code) {
  let codeResult = code;
  const dir = path.join(
    srcRoot,
    path.relative(distRoot, path.dirname(fileName))
  );
  const workerMatches = codeResult.matchAll(/new Worker\('([^']+)'/g);
  for (const match of workerMatches) {
    const workerPath = path.join(dir, match[1]);
    console.log(
      `   serializing worker from ${path.relative(
        projectRoot,
        workerPath
      )} in ${path.relative(projectRoot, fileName)}`
    );
    const workerCode = await serializeWorker(workerPath);
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
  fse.rmSync(distRoot, { force: true, recursive: true });

  console.log(
    '\n> copying source files in TS and JS, serializing worker code...'
  );
  const tsOptions = {
    outDir: distRoot,
    target: 'ES2017',
    lib: ['es2017', 'dom', 'webworker'],
    skipLibCheck: true,
    declaration: true,
  };
  const host = ts.createCompilerHost(tsOptions);
  host.writeFile = async (fileName, contents) => {
    let code = await serializeAllWorkersInCode(fileName, contents);
    await fse.outputFile(fileName, code, {
      flag: 'w',
    });
  };

  // Prepare and emit the d.ts files
  const program = ts.createProgram(
    [path.join(srcRoot, 'index.ts')],
    tsOptions,
    host
  );
  program.emit();

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
