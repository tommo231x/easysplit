import { z } from "zod";

// Menu schemas for database
export const menuSchema = z.object({
  id: z.number(),
  code: z.string().length(6),
  name: z.string().optional(),
  currency: z.string().default("£"),
  createdAt: z.string(),
});

export const menuItemSchema = z.object({
  id: z.number(),
  menuId: z.number(),
  name: z.string(),
  price: z.number(),
});

// Insert schemas for API
export const insertMenuSchema = z.object({
  name: z.string().optional(),
  currency: z.string().default("£"),
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    price: z.number().positive("Price must be positive"),
  })).min(1, "At least one menu item is required"),
});

export const insertMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  price: z.number().positive("Price must be positive"),
});

// Types
export type Menu = z.infer<typeof menuSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

// Frontend-only types for bill splitting (not stored in DB)
export type Person = {
  id: string;
  name: string;
};

export type ItemQuantity = {
  itemId: number;
  personId: string;
  quantity: number;
};

export type PersonTotal = {
  person: Person;
  subtotal: number;
  service: number;
  tip: number;
  total: number;
};
