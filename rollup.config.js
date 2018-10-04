import fs from 'fs';
import nodeResolve from 'rollup-plugin-node-resolve';
import nodeGlobals from 'rollup-plugin-node-globals';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';
import pkg from './package.json';

const matchSnapshot = process.env.SNAPSHOT === 'match';
const input = './src/index.js';
const UMDName = 'CSSOM';

const external = id => !id.startsWith('\0') && !id.startsWith('.') && !id.startsWith('/');

const getBabelOptions = () => ({
  exclude: '**/node_modules/**',
  babelrc: false,
  presets: [['@babel/env', { modules: false }], '@babel/flow'],
});

const commonjsOptions = {
  ignoreGlobal: true,
};

const snapshotOptions = {
  matchSnapshot,
  snapshotPath: './.size-snapshot.json',
};

const createFlowBundlePlugin = {
  transformBundle(code, outputOptions) {
    const file = `${outputOptions.file}.flow`;
    const content = "// @flow\n\nexport * from '../src';";
    fs.writeFileSync(file, content);
  },
};

export default [
  {
    input,
    output: {
      file: `dist/${pkg.name}.js`,
      format: 'umd',
      sourcemap: true,
      exports: 'named',
      name: UMDName,
    },
    plugins: [
      nodeResolve(),
      babel(getBabelOptions()),
      commonjs(commonjsOptions),
      nodeGlobals(),
      sizeSnapshot(snapshotOptions),
    ],
  },

  {
    input,
    output: {
      file: `dist/${pkg.name}.min.js`,
      format: 'umd',
      exports: 'named',
      name: UMDName,
    },
    plugins: [
      nodeResolve(),
      babel(getBabelOptions()),
      commonjs(commonjsOptions),
      nodeGlobals(),
      sizeSnapshot(snapshotOptions),
      uglify(),
    ],
  },

  {
    input,
    output: { file: pkg.main, format: 'cjs', exports: 'named' },
    external,
    plugins: [
      createFlowBundlePlugin,
      babel(getBabelOptions()),
      sizeSnapshot(snapshotOptions),
    ],
  },

  {
    input,
    output: { file: pkg.module, format: 'esm' },
    external,
    plugins: [babel(getBabelOptions()), sizeSnapshot(snapshotOptions)],
  },
];
