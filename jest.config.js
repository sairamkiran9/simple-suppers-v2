const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Different environments for different test types
  projects: [
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [
        '**/__tests__/components/**/*.(ts|tsx)',
        '**/__tests__/hooks/**/*.(ts|tsx)',
        '**/__tests__/lib/**/*.(ts|tsx)',
        '**/__tests__/integration/**/*.(ts|tsx)',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/__tests__/api/',
        '<rootDir>/__tests__/database/',
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      transformIgnorePatterns: [
        '/node_modules/',
        '^.+\\.module\\.(css|sass|scss)$',
      ],
    },
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: [
        '**/__tests__/api/**/*.(ts|tsx)',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/__tests__/components/',
        '<rootDir>/__tests__/hooks/',
        '<rootDir>/__tests__/lib/',
        '<rootDir>/__tests__/integration/',
        '<rootDir>/__tests__/database/',
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      transformIgnorePatterns: [
        '/node_modules/',
        '^.+\\.module\\.(css|sass|scss)$',
      ],
    },
    {
      displayName: 'database',
      testEnvironment: 'node',
      testMatch: [
        '**/__tests__/database/**/*.(ts|tsx)',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/__tests__/components/',
        '<rootDir>/__tests__/hooks/',
        '<rootDir>/__tests__/lib/',
        '<rootDir>/__tests__/integration/',
        '<rootDir>/__tests__/api/',
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.database.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      transformIgnorePatterns: [
        '/node_modules/',
        '^.+\\.module\\.(css|sass|scss)$',
      ],
    },
  ],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)