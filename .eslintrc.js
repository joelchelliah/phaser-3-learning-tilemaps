module.exports = {
    parser: 'typescript-eslint-parser',
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module",
    },
    plugins: [
        'typescript'
    ],
    rules: {
        'array-bracket-spacing': 0,
        'array-callback-return': 'error',
        'arrow-body-style': 0,
        'arrow-parens': 0,
        'brace-style': 0,
        semi: ['error', 'never'],
        "quotes": ["error", "single"],
        'comma-dangle': ['error', 'always-multiline'],
        'max-len': ['error', 160],
    }
}
