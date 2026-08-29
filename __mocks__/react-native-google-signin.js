const React = require('react');
const { View } = require('react-native');

// @react-native-google-signin/google-signin's native spec calls
// TurboModuleRegistry.getEnforcing() at import time (not lazily), which
// throws immediately in the Jest environment since there's no native
// binary to register against - same class of problem as react-native-webview
// (see that mock in this folder), just triggered on import rather than on
// first use.
const GoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => {
    throw new Error('@react-native-google-signin/google-signin is mocked in tests');
  },
  signInSilently: async () => {
    throw new Error('@react-native-google-signin/google-signin is mocked in tests');
  },
  signOut: async () => {},
};

function isSuccessResponse(response) {
  return response?.type === 'success';
}

function isCancelledResponse(response) {
  return response?.type === 'cancelled';
}

function GoogleSigninButton(props) {
  return React.createElement(View, props);
}
GoogleSigninButton.Size = { Icon: 0, Standard: 1, Wide: 2 };
GoogleSigninButton.Color = { Dark: 0, Light: 1 };

module.exports = {
  GoogleSignin,
  GoogleSigninButton,
  isSuccessResponse,
  isCancelledResponse,
  statusCodes: {},
};
