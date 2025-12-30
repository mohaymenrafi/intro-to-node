import { getDB, insert, saveDB } from "./db.js";

export const createNote = async (note, tags) => {
  console.log("inside create note");
  const newNote = {
    id: Date.now(),
    tags,
    content: note,
  };
  await insert(newNote);
  return newNote;
};

export const getAllNotes = async () => {
  const { notes } = await getDB();
  return notes;
};

export const findNotes = async (filter) => {
  const notes = await getAllNotes();
  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(filter.toLowerCase())
  );
  return filteredNotes;
};

export const removeNote = async (id) => {
  const notes = await getAllNotes();
  console.log(notes);
  const match = notes.find((note) => note.id === id);
  if (match) {
    const newNotes = notes.filter((note) => note.id !== id);
    await saveDB({ notes: newNotes });
    return id;
  }
};

export const removeAllNotes = async () => {
  await saveDB({ notes: [] });
};
