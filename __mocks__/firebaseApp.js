// Lightweight test double - real Firebase JS SDK ships ESM-only builds that
// Jest's default RN transform can't parse (.mjs), and unit tests shouldn't
// hit a live Firebase project anyway.
const apps = [];
module.exports = {
  initializeApp: config => {
    const app = { name: '[DEFAULT]', options: config };
    apps.push(app);
    return app;
  },
  getApps: () => apps,
  getApp: () => apps[0],
};
