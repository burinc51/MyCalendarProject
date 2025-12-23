module.exports = {
    root: true,
    extends: ['@react-native-community', 'eslint:recommended', 'plugin:react/recommended', 'plugin:react-native/all', 'plugin:@typescript-eslint/recommended'],
    parser: '@babel/eslint-parser',
    parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    plugins: ['react', 'react-native', '@typescript-eslint'],
    env: {
        browser: true,
        node: true,
        'react-native/react-native': true
    },
    rules: {
        'react-hooks/exhaustive-deps': 'off',
        curly: ['error', 'multi-line'],
        indent: ['error', 4],
        'object-curly-spacing': ['error', 'always'],
        'react/jsx-indent': ['error', 4],

        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'react/react-in-jsx-scope': 'off',
        'react-native/no-inline-styles': 'off',
        'react-native/no-raw-text': 'off',
        'react-native/split-platform-components': 'off',
        'react-native/no-color-literals': 'off',
        'react-native/no-unstable-nested-components': 'off',
        'react/display-name': 'off',
        'react-native/sort-styles': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'comma-dangle': 'off',
        'prettier/prettier': 'off'
    }
};
