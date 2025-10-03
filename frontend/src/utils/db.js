import { openDB } from 'idb';

const DB_NAME = 'NagiosInstancesDB';
const DB_VERSION = 1;
const STORE_NAME = 'instances';

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const getInstances = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const saveInstance = async (instance) => {
  const db = await initDB();
  return db.put(STORE_NAME, instance);
};

export const deleteInstance = async (id) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};