import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import path from "path";

export interface MenuItem {
  id: number;
  menuId: number;
  name: string;
  price: number;
}

export interface Menu {
  id: number;
  code: string;
  name: string | null;
  createdAt: string;
}

export interface InsertMenuItem {
  name: string;
  price: number;
}

export interface InsertMenu {
  name?: string;
  items: InsertMenuItem[];
}

class DatabaseHelper {
  private db: Database.Database;

  constructor(dbPath: string = "easysplit.db") {
    this.db = new Database(dbPath);
    this.db.pragma("foreign_keys = ON");
    this.initTables();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_menu_code ON menus(code);
      CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);
    `);
  }

  private generateCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    const bytes = randomBytes(6);
    
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
    
    return code;
  }

  private generateUniqueCode(): string {
    let code = this.generateCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = this.db
        .prepare("SELECT id FROM menus WHERE code = ?")
        .get(code);
      
      if (!existing) {
        return code;
      }
      
      code = this.generateCode();
      attempts++;
    }

    throw new Error("Failed to generate unique menu code");
  }

  createMenu(data: InsertMenu): { code: string; menu: Menu } {
    const code = this.generateUniqueCode();
    
    const insertMenu = this.db.prepare(
      "INSERT INTO menus (code, name) VALUES (?, ?)"
    );
    
    const result = insertMenu.run(code, data.name || null);
    const menuId = result.lastInsertRowid as number;

    const insertItem = this.db.prepare(
      "INSERT INTO menu_items (menu_id, name, price) VALUES (?, ?, ?)"
    );

    const insertMany = this.db.transaction((items: InsertMenuItem[]) => {
      for (const item of items) {
        insertItem.run(menuId, item.name, item.price);
      }
    });

    insertMany(data.items);

    const menu = this.getMenuByCode(code);
    if (!menu) {
      throw new Error("Failed to create menu");
    }

    return { code, menu };
  }

  getMenuByCode(code: string): Menu | null {
    const menu = this.db
      .prepare("SELECT * FROM menus WHERE code = ?")
      .get(code) as any;
    
    if (!menu) {
      return null;
    }

    return {
      id: menu.id,
      code: menu.code,
      name: menu.name,
      createdAt: menu.created_at,
    };
  }

  getMenuItems(menuId: number): MenuItem[] {
    const items = this.db
      .prepare("SELECT * FROM menu_items WHERE menu_id = ? ORDER BY id")
      .all(menuId) as any[];
    
    return items.map((item) => ({
      id: item.id,
      menuId: item.menu_id,
      name: item.name,
      price: item.price,
    }));
  }

  getMenuWithItems(code: string): { menu: Menu; items: MenuItem[] } | null {
    const menu = this.getMenuByCode(code);
    if (!menu) {
      return null;
    }

    const items = this.getMenuItems(menu.id);
    return { menu, items };
  }

  updateMenu(code: string, data: InsertMenu): { menu: Menu; items: MenuItem[] } | null {
    const existing = this.getMenuByCode(code);
    if (!existing) {
      return null;
    }

    // Update menu name
    this.db.prepare("UPDATE menus SET name = ? WHERE code = ?").run(data.name || null, code);

    // Delete existing items and insert new ones
    this.db.prepare("DELETE FROM menu_items WHERE menu_id = ?").run(existing.id);

    const insertItem = this.db.prepare(
      "INSERT INTO menu_items (menu_id, name, price) VALUES (?, ?, ?)"
    );

    const insertMany = this.db.transaction((items: InsertMenuItem[]) => {
      for (const item of items) {
        insertItem.run(existing.id, item.name, item.price);
      }
    });

    insertMany(data.items);

    return this.getMenuWithItems(code);
  }

  deleteMenu(code: string): boolean {
    const result = this.db.prepare("DELETE FROM menus WHERE code = ?").run(code);
    return result.changes > 0;
  }

  close() {
    this.db.close();
  }
}

export const db = new DatabaseHelper();
