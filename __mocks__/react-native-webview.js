const React = require('react');
const { View } = require('react-native');

// react-native-webview needs a native module that isn't linked in the Jest
// environment; a plain View stand-in is enough for render smoke tests.
function WebView(props) {
  return React.createElement(View, props);
}

module.exports = { WebView, default: WebView };
