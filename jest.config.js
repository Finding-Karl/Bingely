module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|@firebase|firebase)',
  ],
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/envMock.js',
    '^firebase/app$': '<rootDir>/__mocks__/firebaseApp.js',
    '^firebase/auth$': '<rootDir>/__mocks__/firebaseAuth.js',
    '^firebase/firestore$': '<rootDir>/__mocks__/firebaseFirestore.js',
    '^react-native-webview$': '<rootDir>/__mocks__/react-native-webview.js',
  },
};
