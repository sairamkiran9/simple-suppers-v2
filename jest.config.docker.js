const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Docker-specific Jest configuration with separate environments
const customJestConfig = {
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
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
      testTimeout: 30000,
    },
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: [
        '**/__tests__/api/**/*.(ts|tsx)',
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
      testTimeout: 30000,
    },
    {
      displayName: 'database',
      testEnvironment: 'node',
      testMatch: [
        '**/__tests__/database/**/*.(ts|tsx)',
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
      testTimeout: 30000,
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
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  maxWorkers: 1, // Run tests serially in Docker to avoid resource issues
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: true, // Detect async operations that prevent Jest from exiting
}

module.exports = createJestConfig(customJestConfig)
