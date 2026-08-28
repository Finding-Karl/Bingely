module.exports = {
  getFirestore: () => ({}),
  collection: () => ({}),
  doc: () => ({}),
  getDoc: async () => ({ exists: () => false, data: () => undefined }),
  getDocs: async () => ({ docs: [] }),
  setDoc: async () => {},
  deleteDoc: async () => {},
  query: () => ({}),
  where: () => ({}),
  orderBy: () => ({}),
  onSnapshot: (_query, onNext) => {
    onNext({ docs: [] });
    return () => {};
  },
};
