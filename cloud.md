# Cloud & Deployment Documentation

This document describes the cloud infrastructure and deployment setup for EasySplit.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                                │
│                    easysplit.link                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Hosting                           │
│                   (Frontend - SPA)                           │
│                                                              │
│  • Static files served from dist/public                      │
│  • All routes rewritten to index.html                        │
│  • Custom domain: easysplit.link                             │
│  • Firebase Analytics enabled                                │
└─────────────────────┬───────────────────────────────────────┘
                      │ API calls
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     Render.com                               │
│                   (Backend - Node.js)                        │
│                                                              │
│  • Express server at easysplit-sn5f.onrender.com             │
│  • SQLite database (easysplit.db)                            │
│  • Health checks: /healthz                                   │
│  • Rate limiting enabled                                     │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Deployment (Firebase Hosting)

### Configuration

**Firebase Project:** `easy-split-b7e87`

**firebase.json:**
```json
{
  "hosting": {
    "public": "dist/public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/favicon.ico",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

### Deploying Frontend

```bash
# Build the frontend
npm run build

# Deploy to Firebase
npx firebase deploy --only hosting
```

### Custom Domain

The domain `easysplit.link` is configured in Firebase Hosting console and points to the Firebase hosting instance.

### Firebase Services Used

- **Firebase Hosting** - Static file hosting with CDN
- **Firebase Analytics** - User analytics and event tracking

## Backend Deployment (Render.com)

### Configuration

**Service URL:** `https://easysplit-sn5f.onrender.com`

**Build Command:** `npm run build`

**Start Command:** `npm run start`

### Server Setup

The Express server (`server/index.ts`) is configured for production:

```typescript
const PORT = process.env.PORT || 5000;

// Health check endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/healthz", (req, res) => {
  res.send("OK");
});
```

### Health Checks

Render.com uses the `/healthz` endpoint to verify the service is running. This returns a simple "OK" response.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Port for the server (Render provides this) | Yes (auto-set) |
| `NODE_ENV` | Set to `production` | Recommended |
| `DATABASE_URL` | PostgreSQL connection string (if migrating from SQLite) | Optional |
| `ENABLE_DEBUG_LOGS` | Enable verbose logging | Optional |

### Database

**Current Setup:** SQLite (`easysplit.db`)

The SQLite database file is stored on the Render instance. This works for low-traffic applications but note:
- Data persists between deploys on Render's persistent disk
- For high availability, consider migrating to PostgreSQL

**Migration Path:**

Drizzle ORM is configured for PostgreSQL migration:

```bash
# Push schema to PostgreSQL
npm run db:push
```

Set `DATABASE_URL` environment variable to use an external PostgreSQL database.

### Rate Limiting

The backend implements rate limiting on code-lookup endpoints to prevent brute-force attacks:

```typescript
const getLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes
  max: 100,                   // 100 requests per window
  message: { error: "Too many requests, please try again later" }
});
```

### CORS Configuration

CORS is enabled for cross-origin requests from the frontend:

```typescript
app.use(cors({
  origin: true,
  credentials: true
}));
```

## Development vs Production

### API URL Configuration

The frontend automatically routes API calls based on environment:

**Development (`client/src/lib/api.ts`):**
```typescript
// Uses Vite proxy to localhost:3001
const API_URL = import.meta.env.DEV ? "" : "https://easysplit-sn5f.onrender.com";
```

**Vite Proxy (`vite.config.ts`):**
```typescript
proxy: {
  "/api": {
    target: "http://localhost:3001",
    changeOrigin: true
  }
}
```

### Local Development

```bash
# Run both frontend and backend
npm run dev

# Frontend: http://localhost:5000
# Backend:  http://localhost:3001
# API calls from frontend are proxied to backend
```

### Production Build

```bash
# Build both client and server
npm run build

# Output:
# - dist/public/     (frontend static files)
# - dist/index.js    (server bundle)
```

## Deployment Workflow

### Deploying Updates

**Backend (Render):**
1. Push changes to the repository
2. Render automatically detects changes and rebuilds
3. Zero-downtime deployment with health checks

**Frontend (Firebase):**
1. Build the frontend: `npm run build`
2. Deploy: `npx firebase deploy --only hosting`

### Manual Deploy Commands

```bash
# Full deployment
npm run build
npx firebase deploy --only hosting
# Render auto-deploys on git push

# Frontend only
npm run build
npx firebase deploy --only hosting

# Check deployment status
npx firebase hosting:channel:list
```

## Monitoring

### Health Endpoints

- **Backend Health:** `https://easysplit-sn5f.onrender.com/api/health`
- **Render Health:** `https://easysplit-sn5f.onrender.com/healthz`

### Analytics

Firebase Analytics is configured in `client/index.html` and tracks:
- Page views
- User sessions
- Custom events (via `lib/analytics.ts`)

### Logs

**Render.com:**
- View logs in Render dashboard
- Enable `ENABLE_DEBUG_LOGS` for verbose output

**Firebase:**
- Analytics data in Firebase Console
- Hosting traffic in Firebase Console

## Scaling Considerations

### Current Limitations

1. **SQLite Database** - Single file, not suitable for horizontal scaling
2. **Render Free Tier** - May spin down after inactivity
3. **Polling Mechanism** - Clients poll every 3-5 seconds for updates

### Recommended Upgrades for Scale

1. **Database:** Migrate to PostgreSQL using Drizzle ORM
2. **Real-time:** Add WebSocket support for live updates
3. **Caching:** Add Redis for session and data caching
4. **CDN:** Firebase Hosting already provides CDN for static assets

## Backup & Recovery

### Database Backup

For SQLite on Render:
```bash
# SSH into Render instance (if available) or use Render's backup features
# SQLite file: easysplit.db
```

### Recommended: External Database

For production reliability, migrate to a managed PostgreSQL service:
- Render PostgreSQL
- Neon
- Supabase
- Railway

## Security

### Implemented

- Rate limiting on API endpoints
- CORS restrictions
- Input validation with Zod
- No sensitive data in client-side storage

### Recommendations

- Add HTTPS-only headers
- Implement request signing for API calls
- Add abuse detection for split code generation
- Regular security audits

## Cost Estimates

| Service | Tier | Approximate Cost |
|---------|------|------------------|
| Firebase Hosting | Spark (Free) | $0/month |
| Firebase Analytics | Free | $0/month |
| Render.com | Free/Starter | $0-7/month |
| Domain (easysplit.link) | Annual | ~$10-15/year |

**Total:** ~$0-7/month + domain renewal
