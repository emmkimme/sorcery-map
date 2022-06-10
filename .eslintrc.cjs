module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        'array-bracket-spacing': ['error', 'always'],
        '@typescript-eslint/ban-ts-comment': [
            'error',
            {
                'ts-ignore': 'allow-with-description',
                'minimumDescriptionLength': 3
            }
        ],
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-empty-function': 'off',
        '@typescript-eslint/no-empty-function': ['error', { 'allow': ['arrowFunctions', 'constructors'] }],
        'indent': ['error', 4],
        'quotes': [2, 'single'],
        'linebreak-style': [2, 'unix'],
        'semi': [2, 'always'],
        'keyword-spacing': [2, { 'before': true, 'after': true }],
        'space-before-blocks': [2, 'always'],
        'space-in-parens': ['error', 'always', { 'exceptions': ['{}', '[]'] }],
        'space-before-function-paren': [2, 'always'],
        'object-curly-spacing': ['error', 'always'],
        'no-cond-assign': [0]
    },
    env: {
        'es6': true,
        'browser': true,
        'mocha': true,
        'node': true
    },
    parserOptions: {
        'ecmaVersion': 6,
        'sourceType': 'module'
    }
}
