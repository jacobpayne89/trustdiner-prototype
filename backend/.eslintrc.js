module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Code Quality Rules
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'off', // Handled by TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    
    // Error Handling
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Performance
    'no-await-in-loop': 'warn',
    'require-atomic-updates': 'error',
    
    // Code Style
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'comma-dangle': ['error', 'es5'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'no-console': 'off', // Allow console for server logging
    'no-debugger': 'error',
    
    // Node.js Specific
    'no-process-exit': 'error',
    'no-sync': 'warn',
    'handle-callback-err': 'error',
    
    // Import Rules
    'import/no-unresolved': 'off', // Handled by TypeScript
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
      ],
      'newlines-between': 'always',
    }],
    
    // Express.js Best Practices
    'callback-return': 'error',
    'no-path-concat': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.{js,ts}', '**/tests/**/*'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'prefer-promise-reject-errors': 'off',
      },
    },
    {
      files: ['src/server.ts', 'src/middleware/**/*'],
      rules: {
        'no-console': 'off', // Allow console in server and middleware
      },
    },
  ],
};
