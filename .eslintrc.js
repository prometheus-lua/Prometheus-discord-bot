module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'airbnb-base',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint',
    ],
    rules: {
        'linebreak-style': 0,
        'no-console': 'off',
        'import/no-unresolved': 0,
        'import/extensions': 0,
        indent: ['error', 4],
    },
};
