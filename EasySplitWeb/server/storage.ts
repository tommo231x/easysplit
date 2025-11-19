// Storage interface is not used for this app
// All data persistence is handled by SQLite via server/db.ts
// This file is kept for compatibility with the template structure

export interface IStorage {}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
