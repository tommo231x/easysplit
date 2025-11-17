import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { z } from "zod";

const insertMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  price: z.number().positive("Price must be positive"),
});

const insertMenuSchema = z.object({
  name: z.string().optional(),
  items: z
    .array(insertMenuItemSchema)
    .min(1, "At least one menu item is required"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/menus", async (req, res) => {
    try {
      const validated = insertMenuSchema.parse(req.body);
      const result = db.createMenu(validated);
      
      res.json({
        code: result.code,
        menu: result.menu,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        console.error("Error creating menu:", error);
        res.status(500).json({ error: "Failed to create menu" });
      }
    }
  });

  app.get("/api/menus/:code", async (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      
      if (code.length !== 6) {
        res.status(400).json({ error: "Menu code must be 6 characters" });
        return;
      }

      const result = db.getMenuWithItems(code);
      
      if (!result) {
        res.status(404).json({ error: "Menu not found" });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ error: "Failed to fetch menu" });
    }
  });

  app.patch("/api/menus/:code", async (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      
      if (code.length !== 6) {
        res.status(400).json({ error: "Menu code must be 6 characters" });
        return;
      }

      const validated = insertMenuSchema.parse(req.body);
      const result = db.updateMenu(code, validated);
      
      if (!result) {
        res.status(404).json({ error: "Menu not found" });
        return;
      }

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        console.error("Error updating menu:", error);
        res.status(500).json({ error: "Failed to update menu" });
      }
    }
  });

  app.delete("/api/menus/:code", async (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      
      if (code.length !== 6) {
        res.status(400).json({ error: "Menu code must be 6 characters" });
        return;
      }

      const success = db.deleteMenu(code);
      
      if (!success) {
        res.status(404).json({ error: "Menu not found" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting menu:", error);
      res.status(500).json({ error: "Failed to delete menu" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
