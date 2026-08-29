module.exports = {
  getAuth: () => ({ currentUser: null }),
  initializeAuth: () => ({ currentUser: null }),
  getReactNativePersistence: () => undefined,
  onAuthStateChanged: (_auth, cb) => {
    cb(null);
    return () => {};
  },
  signInWithEmailAndPassword: async () => {
    throw new Error('firebase auth is mocked in tests');
  },
  createUserWithEmailAndPassword: async () => {
    throw new Error('firebase auth is mocked in tests');
  },
  signOut: async () => {},
  signInWithCredential: async () => {
    throw new Error('firebase auth is mocked in tests');
  },
  GoogleAuthProvider: {
    credential: () => ({}),
  },
  getAdditionalUserInfo: () => null,
};
