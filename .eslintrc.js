module.exports = {
    root: true,
    extends: ['@react-native-community', 'plugin:prettier/recommended'],
    parser: '@babel/eslint-parser',
    parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    rules: {
        'no-console': 'warn',
        'prettier/prettier': 'off',
        'react-hooks/exhaustive-deps': 'off',
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        curly: 'error',
        indent: ['error', 4],
        'linebreak-style': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'object-curly-spacing': ['error', 'always'],
        'react/jsx-indent': ['error', 4],
        '@typescript-eslint/no-explicit-any': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/no-unstable-nested-components': ['off']
    },
    env: {
        'react-native/react-native': true
    }
};
