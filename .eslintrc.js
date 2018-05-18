module.exports = {
  extends: ['airbnb-base', 'plugin:flowtype/recommended'],
  parser: 'babel-eslint',
  'plugins': ['flowtype'],
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true
    }
  },
  globals: {
    SyntheticInputEvent: true,
  },
  rules: {
    'no-console': 2,
    'id-length': 0,
    'max-len': 0,
    'no-underscore-dangle': 0,
    'import/extensions': 0,
    'arrow-parens': ['error', 'always'],
    'import/prefer-default-export': 0,
    'no-unused-vars': ["error", { "argsIgnorePattern": "^_" }],
  },
};
