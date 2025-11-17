import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import path from "path";
import type { Menu, MenuItem, InsertMenu, InsertMenuItem, BillSplit, InsertBillSplit } from "@shared/schema";

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
        currency TEXT NOT NULL DEFAULT '£',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS bill_splits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        menu_code TEXT,
        people TEXT NOT NULL,
        items TEXT NOT NULL,
        quantities TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT '£',
        service_charge REAL NOT NULL DEFAULT 0,
        tip_percent REAL NOT NULL DEFAULT 0,
        totals TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_menu_code ON menus(code);
      CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);
      CREATE INDEX IF NOT EXISTS idx_split_code ON bill_splits(code);
      CREATE INDEX IF NOT EXISTS idx_split_menu_code ON bill_splits(menu_code);
    `);

    // Migration: Add currency column if it doesn't exist
    try {
      const tableInfo = this.db.pragma("table_info(menus)");
      const hasCurrency = tableInfo.some((col: any) => col.name === "currency");
      
      if (!hasCurrency) {
        this.db.exec("ALTER TABLE menus ADD COLUMN currency TEXT NOT NULL DEFAULT '£'");
        console.log("Migration: Added currency column to menus table");
      }
    } catch (error) {
      console.error("Migration error:", error);
    }
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
    const currency = data.currency || "£";
    
    const insertMenu = this.db.prepare(
      "INSERT INTO menus (code, name, currency) VALUES (?, ?, ?)"
    );
    
    const result = insertMenu.run(code, data.name || null, currency);
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
      currency: menu.currency || "£",
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

    // Update menu name and currency
    this.db.prepare("UPDATE menus SET name = ?, currency = ? WHERE code = ?")
      .run(data.name || null, data.currency || "£", code);

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

  createBillSplit(data: InsertBillSplit): { code: string; split: BillSplit } {
    let code: string = "";
    let attempts = 0;
    const maxAttempts = 10;
    
    // Generate unique code checking both menus and bill_splits tables
    while (attempts < maxAttempts) {
      code = this.generateCode().toUpperCase();
      const existingMenu = this.db
        .prepare("SELECT id FROM menus WHERE code = ?")
        .get(code);
      const existingSplit = this.db
        .prepare("SELECT id FROM bill_splits WHERE code = ?")
        .get(code);
      
      if (!existingMenu && !existingSplit) {
        break;
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique split code");
    }
    
    const insertSplit = this.db.prepare(`
      INSERT INTO bill_splits (code, menu_code, people, items, quantities, currency, service_charge, tip_percent, totals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertSplit.run(
      code,
      data.menuCode || null,
      JSON.stringify(data.people),
      JSON.stringify(data.items),
      JSON.stringify(data.quantities),
      data.currency,
      data.serviceCharge,
      data.tipPercent,
      JSON.stringify(data.totals)
    );

    const split = this.getSplitByCode(code);
    if (!split) {
      throw new Error("Failed to create bill split");
    }

    return { code, split };
  }

  getSplitByCode(code: string): BillSplit | null {
    const split = this.db
      .prepare("SELECT * FROM bill_splits WHERE code = ?")
      .get(code) as any;
    
    if (!split) {
      return null;
    }

    return {
      id: split.id,
      code: split.code,
      menuCode: split.menu_code,
      people: split.people,
      items: split.items,
      quantities: split.quantities,
      currency: split.currency,
      serviceCharge: split.service_charge,
      tipPercent: split.tip_percent,
      totals: split.totals,
      createdAt: split.created_at,
    };
  }

  getSplitsByMenuCode(menuCode: string): BillSplit[] {
    const splits = this.db
      .prepare("SELECT * FROM bill_splits WHERE menu_code = ? ORDER BY created_at DESC")
      .all(menuCode) as any[];
    
    return splits.map((split) => ({
      id: split.id,
      code: split.code,
      menuCode: split.menu_code,
      people: split.people,
      items: split.items,
      quantities: split.quantities,
      currency: split.currency,
      serviceCharge: split.service_charge,
      tipPercent: split.tip_percent,
      totals: split.totals,
      createdAt: split.created_at,
    }));
  }

  close() {
    this.db.close();
  }
}

export const db = new DatabaseHelper();
