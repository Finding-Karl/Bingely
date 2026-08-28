module.exports = {
  getAuth: () => ({ currentUser: null }),
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
};
