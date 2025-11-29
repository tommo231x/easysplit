import { z } from "zod";
// Menu schemas for database
export const menuSchema = z.object({
    id: z.number(),
    code: z.string().min(6).max(8), // Accept both 6-character (legacy) and 8-character codes
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
// Reusable schemas for bill splitting
export const personSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
});
export const itemQuantitySchema = z.object({
    itemId: z.number().int(),
    personId: z.string().min(1),
    quantity: z.number().positive().int(),
});
export const personTotalSchema = z.object({
    person: personSchema,
    subtotal: z.number().nonnegative().finite(),
    service: z.number().nonnegative().finite(),
    tip: z.number().nonnegative().finite(),
    total: z.number().nonnegative().finite(),
});
// Bill split database schema
export const billSplitSchema = z.object({
    id: z.number(),
    code: z.string().min(6).max(8), // Accept both 6-character (legacy) and 8-character codes
    name: z.string().nullable().optional(),
    menuCode: z.string().min(6).max(8).nullable(), // Accept both 6 and 8 character menu codes
    people: z.string(), // JSON array
    items: z.string(), // JSON array
    quantities: z.string(), // JSON array
    currency: z.string(),
    serviceCharge: z.number(),
    tipPercent: z.number(),
    totals: z.string(), // JSON array
    createdAt: z.string(),
});
// Bill split item schema (allows items without menuId for manual splits)
export const billSplitItemSchema = z.object({
    id: z.number(),
    menuId: z.number().optional(),
    name: z.string(),
    price: z.number(),
});
// Insert schema for bill splits
export const insertBillSplitSchema = z.object({
    name: z.string().optional(),
    menuCode: z.string().nullable().optional(),
    people: z.array(personSchema).min(1),
    items: z.array(billSplitItemSchema).min(1),
    quantities: z.array(itemQuantitySchema).min(1),
    currency: z.string().min(1),
    serviceCharge: z.number().min(0).max(100).finite(),
    tipPercent: z.number().min(0).max(100).finite(),
    totals: z.array(personTotalSchema).min(1),
});
//# sourceMappingURL=schema.js.map