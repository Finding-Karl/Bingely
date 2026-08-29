module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: [
    // functions/ is its own separate project (own package.json, own
    // tsconfig, own lint script - `npm run lint` inside functions/) - not
    // part of the RN app's TypeScript project, so it can't share this
    // config's type-aware parserOptions.
    'functions/',
    // Leftovers from the abandoned SQL Connect / Data Connect approach that
    // this sandbox can't delete - see .gitignore for the full explanation.
    '_to_delete/',
  ],
};
