import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";

const app = express();

// Trust the first proxy (Render, Heroku, etc.) for proper IP detection
// This fixes express-rate-limit's X-Forwarded-For validation error
app.set('trust proxy', 1);

// Enable CORS for all routes with credentials support
app.use(cors({ 
  origin: true,
  credentials: true 
}));

// Render health check endpoint
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req: Request, _res: Response, buf: Buffer): void => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: any): Response {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Skip verbose logging for expected 404s (stale split/menu links)
      // These are normal after deploys when clients have old share links open
      const isExpected404 = res.statusCode === 404 && 
        (path.match(/^\/api\/splits\/[A-Z0-9]+$/i) || path.match(/^\/api\/menus\/[A-Z0-9]+$/i));
      
      if (isExpected404) {
        // Log minimally for expected 404s (no response body to reduce noise)
        console.log(`[express] ${req.method} ${path} 404 in ${duration}ms`);
        return;
      }

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`[express] ${logLine}`);
    }
  });

  next();
});

// Register API routes
const server = await registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

// Start server on PORT environment variable (default 5000)
const port = parseInt(process.env.PORT || "5000", 10);
server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,
}, () => {
  console.log(`[express] serving on port ${port}`);
});
