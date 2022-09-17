module.exports = {
  extends: ['erb', 'plugin:valtio/recommended'],
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'error',
    // Since React 17 and typescript 4.1 you can safely disable the rule
    'react/react-in-jsx-scope': 'off',
    // -- CUSTOM RULES--
    // change prettier to warning as those are annoying as fuck
    'prettier/prettier': 1,
    // allows a.b.c (why would you disable this?!)
    'react/destructuring-assignment': 'off',
    'prefer-destructuring': 'off',
    'no-use-before-define': ['warn', { functions: false, classes: false }],
    '@typescript-eslint/no-use-before-define': [
      'warn',
      { functions: false, classes: false },
    ],
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
      },
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
