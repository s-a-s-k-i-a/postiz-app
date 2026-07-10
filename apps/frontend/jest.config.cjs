module.exports = {
  displayName: 'frontend',
  rootDir: '../..',
  testEnvironment: '<rootDir>/apps/frontend/jest.environment.cjs',
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  testMatch: ['<rootDir>/apps/frontend/src/**/*.spec.ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          types: ['jest', 'node'],
        },
      },
    ],
  },
  moduleNameMapper: {
    '^canvas$': '<rootDir>/apps/frontend/test-mocks/canvas.cjs',
    '^@gitroom/frontend/(.*)$': '<rootDir>/apps/frontend/src/$1',
    '^@gitroom/helpers/(.*)$': '<rootDir>/libraries/helpers/src/$1',
    '^@gitroom/nestjs-libraries/(.*)$':
      '<rootDir>/libraries/nestjs-libraries/src/$1',
    '^@gitroom/react/(.*)$':
      '<rootDir>/libraries/react-shared-libraries/src/$1',
    '^@gitroom/plugins/(.*)$': '<rootDir>/libraries/plugins/src/$1',
  },
};
