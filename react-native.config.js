// Links custom fonts in ./assets/fonts (see PlayfairDisplay-*.ttf, used for
// the "Bingely" wordmark/app icon - see CHANGELOG.md) into both native
// projects via `npx react-native-asset`. Vector icon fonts don't need an
// entry here - @react-native-vector-icons ships its own linking.
module.exports = {
  assets: ['./assets/fonts'],
};
