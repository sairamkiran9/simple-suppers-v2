const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest for API tests
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js'],
  testEnvironment: 'jest-environment-node', // Use Node environment for API tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/api/**/*.(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'app/api/**/*.{ts,tsx}',
    'lib/api/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)