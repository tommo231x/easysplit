import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db.js";
import { z } from "zod";
import { insertBillSplitSchema } from "./shared/schema.js";
import type { InsertBillSplit } from "./shared/schema.js";
import rateLimit from "express-rate-limit";

const insertMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  price: z.number().positive("Price must be positive"),
});

const insertMenuSchema = z.object({
  name: z.string().optional(),
  currency: z.string().default("£"),
  items: z
    .array(insertMenuItemSchema)
    .min(1, "At least one menu item is required"),
});

// Configurable debug logging
// Default to enabled for development, can be disabled via environment variable
const ENABLE_DEBUG_LOGS = process.env.ENABLE_DEBUG_LOGS !== "false";

function debugLog(message: string, data?: any): void {
  if (ENABLE_DEBUG_LOGS) {
    if (data !== undefined) {
      console.log(message, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
    } else {
      console.log(message);
    }
  }
}

// Rate limiter for GET-by-code routes to prevent brute force guessing
// Allows 100 requests per 10 minutes per IP
const codeRetrievalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: { error: "Too many requests, please try again later" },
}) as any;

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response): void => {
    res.json({ status: "ok" });
  });

  app.post("/api/menus", async (req: Request, res: Response): Promise<void> => {
    try {
      const validated = insertMenuSchema.parse(req.body);
      const result = db.createMenu(validated);
      
      res.json({
        code: result.code,
        menu: result.menu,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        console.error("Error creating menu:", error);
        res.status(500).json({ error: "Failed to create menu" });
      }
    }
  });

  app.get("/api/menus/:code", codeRetrievalLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.params.code.toUpperCase();
      
      if (code.length < 6 || code.length > 8) {
        res.status(400).json({ error: "Menu code must be 6-8 characters" });
        return;
      }

      const result = db.getMenuWithItems(code);
      
      if (!result) {
        res.status(404).json({ error: "Menu not found" });
        return;
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ error: "Failed to fetch menu" });
    }
  });

  app.patch("/api/menus/:code", async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.params.code.toUpperCase();
      
      if (code.length < 6 || code.length > 8) {
        res.status(400).json({ error: "Menu code must be 6-8 characters" });
        return;
      }

      const validated = insertMenuSchema.parse(req.body);
      const result = db.updateMenu(code, validated);
      
      if (!result) {
        res.status(404).json({ error: "Menu not found" });
        return;
      }

      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        console.error("Error updating menu:", error);
        res.status(500).json({ error: "Failed to update menu" });
      }
    }
  });

  app.delete("/api/menus/:code", async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.params.code.toUpperCase();
      
      if (code.length < 6 || code.length > 8) {
        res.status(400).json({ error: "Menu code must be 6-8 characters" });
        return;
      }

      const success = db.deleteMenu(code);
      
      if (!success) {
        res.status(404).json({ error: "Menu not found" });
        return;
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting menu:", error);
      res.status(500).json({ error: "Failed to delete menu" });
    }
  });

  app.post("/api/splits", async (req: Request, res: Response): Promise<void> => {
    try {
      debugLog("[POST /api/splits] Request body:", req.body);
      const validationResult = insertBillSplitSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        debugLog("[POST /api/splits] Validation failed:", validationResult.error.errors);
        res.status(400).json({ 
          error: "Invalid split data",
          details: validationResult.error.errors,
        });
        return;
      }
      
      const data = validationResult.data as InsertBillSplit;
      
      // Optional menu_code validation: verify menu exists if menuCode is provided
      // Normalize menuCode to uppercase for consistency
      if (data.menuCode) {
        const normalizedMenuCode = data.menuCode.toUpperCase();
        const menu = db.getMenuWithItems(normalizedMenuCode);
        if (!menu) {
          res.status(400).json({ 
            error: "Invalid menu code",
            details: "The specified menu does not exist"
          });
          return;
        }
        // Store normalized uppercase menuCode for consistency
        data.menuCode = normalizedMenuCode;
      }
      
      const result = db.createBillSplit(data);
      
      res.json({
        code: result.code,
        split: result.split,
      });
    } catch (error: any) {
      console.error("Error creating split:", error);
      res.status(500).json({ error: "Failed to create split" });
    }
  });

  app.get("/api/splits/:code", codeRetrievalLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.params.code.toUpperCase();
      
      if (code.length < 6 || code.length > 8) {
        res.status(400).json({ error: "Split code must be 6-8 characters" });
        return;
      }

      const split = db.getSplitByCode(code);
      
      if (!split) {
        res.status(404).json({ error: "Split not found" });
        return;
      }

      res.json({
        code: split.code,
        name: split.name,
        menuCode: split.menuCode,
        people: JSON.parse(split.people),
        items: JSON.parse(split.items),
        quantities: JSON.parse(split.quantities),
        currency: split.currency,
        serviceCharge: split.serviceCharge,
        tipPercent: split.tipPercent,
        totals: JSON.parse(split.totals),
        createdAt: split.createdAt,
      });
    } catch (error: any) {
      console.error("Error fetching split:", error);
      res.status(500).json({ error: "Failed to fetch split" });
    }
  });

  app.patch("/api/splits/:code", async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.params.code.toUpperCase();
      
      if (code.length < 6 || code.length > 8) {
        res.status(400).json({ error: "Split code must be 6-8 characters" });
        return;
      }

      debugLog("[PATCH /api/splits/:code] Request body:", req.body);
      const validationResult = insertBillSplitSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        debugLog("[PATCH /api/splits/:code] Validation failed:", validationResult.error.errors);
        res.status(400).json({ 
          error: "Invalid split data",
          details: validationResult.error.errors,
        });
        return;
      }
      
      const data = validationResult.data as InsertBillSplit;
      
      // Optional menu_code validation: verify menu exists if menuCode is provided
      // Normalize menuCode to uppercase for consistency
      if (data.menuCode) {
        const normalizedMenuCode = data.menuCode.toUpperCase();
        const menu = db.getMenuWithItems(normalizedMenuCode);
        if (!menu) {
          res.status(400).json({ 
            error: "Invalid menu code",
            details: "The specified menu does not exist"
          });
          return;
        }
        // Store normalized uppercase menuCode for consistency
        data.menuCode = normalizedMenuCode;
      }
      
      const result = db.updateBillSplit(code, data);
      
      if (!result) {
        res.status(404).json({ error: "Split not found" });
        return;
      }

      res.json({
        code: result.code,
        split: result.split,
      });
    } catch (error: any) {
      console.error("Error updating split:", error);
      res.status(500).json({ error: "Failed to update split" });
    }
  });

  app.get("/api/menus/:code/splits", async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.params.code.toUpperCase();
      
      if (code.length < 6 || code.length > 8) {
        res.status(400).json({ error: "Menu code must be 6-8 characters" });
        return;
      }

      const splits = db.getSplitsByMenuCode(code);
      
      // Parse JSON strings for frontend consumption
      const parsedSplits = splits.map((split) => ({
        code: split.code,
        name: split.name,
        menuCode: split.menuCode,
        people: JSON.parse(split.people),
        items: JSON.parse(split.items),
        quantities: JSON.parse(split.quantities),
        currency: split.currency,
        serviceCharge: split.serviceCharge,
        tipPercent: split.tipPercent,
        totals: JSON.parse(split.totals),
        createdAt: split.createdAt,
      }));
      
      res.json(parsedSplits);
    } catch (error: any) {
      console.error("Error fetching splits for menu:", error);
      res.status(500).json({ error: "Failed to fetch splits" });
    }
  });

  const server = createServer(app);
  return server;
}
