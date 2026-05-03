// import boundaries from 'eslint-plugin-boundaries';

export const boundariesConfig = {
  // example
  // files: ['**/*.ts'],
  // plugins: { boundaries },
  // settings: {
  //   'import/resolver': {
  //     typescript: {
  //       alwaysTryTypes: true,
  //       project: [
  //         './tsconfig.json',
  //         './apps/*/tsconfig.json',
  //       ],
  //     },
  //   },
  //   'boundaries/elements': [
  //     { type: 'data-source', pattern: '**/data/data-source/**' },
  //     { type: 'data',        pattern: '**/data/**' },
  //     { type: 'module',      pattern: '**/module/**' },
  //     { type: 'shared',      pattern: '**/shared/**' },
  //     { type: 'config',      pattern: '**/config/**' },
  //   ],
  // },
  // rules: {
  //   'boundaries/dependencies': ['error', {
  //     default: 'allow',
  //     checkUnknownLocals: true,
  //     rules: [
  //       {
  //         from: { type: 'module' },
  //         disallow: [{ to: { type: 'module' } }],
  //       },
  //       {
  //         from: { type: 'data' },
  //         disallow: [{ to: { type: 'module' } }],
  //       },
  //       {
  //         from: { type: 'data-source' },
  //         disallow: [{ to: { type: '*' } }],
  //       },
  //       {
  //         from: { type: 'data-source' },
  //         allow: [
  //           { to: { type: 'config' } },
  //           { to: { type: 'shared' } },
  //         ],
  //       },
  //     ],
  //   }],
  // },
}

export default boundariesConfig;
