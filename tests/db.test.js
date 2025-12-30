import { jest } from "@jest/globals";

// Create mock functions
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();

// Mock the fs/promises module before importing the functions
jest.unstable_mockModule("node:fs/promises", () => ({
  default: {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
  },
}));

// Import the functions to test AFTER mocking
const { getDB, saveDB, insert } = await import("../src/db.js");

describe("Database Functions", () => {
  // Sample test data
  const mockDB = {
    notes: [
      {
        id: 1,
        tags: ["test"],
        content: "Test note 1",
      },
      {
        id: 2,
        tags: ["work"],
        content: "Test note 2",
      },
    ],
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("getDB", () => {
    test("should read and parse the database file", async () => {
      // Mock fs.readFile to return stringified mock data
      mockReadFile.mockResolvedValue(JSON.stringify(mockDB));

      const result = await getDB();

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining("db.json"),
        "utf-8"
      );
      expect(result).toEqual(mockDB);
    });

    test("should throw error if file read fails", async () => {
      const error = new Error("File not found");
      mockReadFile.mockRejectedValue(error);

      await expect(getDB()).rejects.toThrow("File not found");
    });

    test("should throw error if JSON parsing fails", async () => {
      mockReadFile.mockResolvedValue("invalid json");

      await expect(getDB()).rejects.toThrow();
    });
  });

  describe("saveDB", () => {
    test("should stringify and write database to file", async () => {
      mockWriteFile.mockResolvedValue();

      const result = await saveDB(mockDB);

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining("db.json"),
        JSON.stringify(mockDB, null, 2)
      );
      expect(result).toEqual(mockDB);
    });

    test("should format JSON with 2 spaces indentation", async () => {
      mockWriteFile.mockResolvedValue();

      await saveDB(mockDB);

      const expectedJSON = JSON.stringify(mockDB, null, 2);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(String),
        expectedJSON
      );
    });

    test("should throw error if file write fails", async () => {
      const error = new Error("Write permission denied");
      mockWriteFile.mockRejectedValue(error);

      await expect(saveDB(mockDB)).rejects.toThrow("Write permission denied");
    });
  });

  describe("insert", () => {
    test("should add new note to database and save it", async () => {
      const newNote = {
        id: 3,
        tags: ["personal"],
        content: "New test note",
      };

      // Mock getDB to return the initial database
      mockReadFile.mockResolvedValue(JSON.stringify(mockDB));
      // Mock saveDB (writeFile)
      mockWriteFile.mockResolvedValue();

      const result = await insert(newNote);

      // Verify getDB was called
      expect(mockReadFile).toHaveBeenCalledTimes(1);

      // Verify saveDB was called with updated database
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const savedData = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(savedData.notes).toHaveLength(3);
      expect(savedData.notes[2]).toEqual(newNote);

      // Verify the function returns the inserted note
      expect(result).toEqual(newNote);
    });

    test("should preserve existing notes when inserting new one", async () => {
      const newNote = {
        id: 4,
        tags: ["urgent"],
        content: "Urgent note",
      };

      mockReadFile.mockResolvedValue(JSON.stringify(mockDB));
      mockWriteFile.mockResolvedValue();

      await insert(newNote);

      const savedData = JSON.parse(mockWriteFile.mock.calls[0][1]);

      // Check that original notes are still there
      expect(savedData.notes[0]).toEqual(mockDB.notes[0]);
      expect(savedData.notes[1]).toEqual(mockDB.notes[1]);
      // Check that new note was added
      expect(savedData.notes[2]).toEqual(newNote);
    });

    test("should handle inserting into empty notes array", async () => {
      const emptyDB = { notes: [] };
      const newNote = {
        id: 1,
        tags: ["first"],
        content: "First note",
      };

      mockReadFile.mockResolvedValue(JSON.stringify(emptyDB));
      mockWriteFile.mockResolvedValue();

      const result = await insert(newNote);

      const savedData = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(savedData.notes).toHaveLength(1);
      expect(savedData.notes[0]).toEqual(newNote);
      expect(result).toEqual(newNote);
    });

    test("should throw error if getDB fails", async () => {
      const error = new Error("Database read error");
      mockReadFile.mockRejectedValue(error);

      const newNote = { id: 5, tags: ["test"], content: "Test" };

      await expect(insert(newNote)).rejects.toThrow("Database read error");
    });

    test("should throw error if saveDB fails", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(mockDB));
      mockWriteFile.mockRejectedValue(new Error("Database write error"));

      const newNote = { id: 6, tags: ["test"], content: "Test" };

      await expect(insert(newNote)).rejects.toThrow("Database write error");
    });
  });
});
