import fs from "node:fs/promises";

const DB_PATH = new URL("../db.json", import.meta.url).pathname;

// get the entire db
export const getDB = async () => {
  const db = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(db);
};

// save/overwrite entire DB
export const saveDB = async (db) => {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
  return db;
};

// insert one of an instance
export const insert = async (data) => {
  const db = await getDB();
  db.notes.push(data);
  await saveDB(db);
  return data;
};
