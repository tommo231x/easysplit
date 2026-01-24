# CLAUDE.md - Project Context for Claude Code

## Project Overview

EasySplit is a bill-splitting web application. Users can create splits, add people and items, assign who ordered what, and calculate how much each person owes.

**Live Site:** https://easysplit.link

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + SQLite (Drizzle ORM)
- **Hosting:** Firebase Hosting (frontend) + Render.com (backend)
- **Analytics:** Firebase Analytics (with cookie consent)

## Key Commands

```bash
npm run dev          # Start development (client + server)
npm run build        # Build for production
npm run check        # TypeScript type checking
firebase deploy --only hosting   # Deploy frontend
```

## Project Structure

- `client/` - React frontend
  - `client/src/pages/` - Route pages
  - `client/src/components/` - React components
  - `client/src/lib/` - Utilities (api.ts, analytics.ts)
  - `client/index.html` - HTML template with meta tags and structured data
- `server/` - Express backend
  - `server/routes.ts` - API endpoints
  - `server/db.ts` - Database operations
- `shared/` - Shared Zod schemas

## SEO Implementation

Already implemented:
- Sitemap at `/sitemap.xml` (5 pages)
- Robots.txt allowing all crawlers
- Static HTML fallback content in index.html for crawlers
- JSON-LD structured data (SoftwareApplication, FAQPage, HowTo)
- Open Graph and Twitter Card meta tags
- Cookie consent banner (GDPR compliance)
- Privacy policy page at `/privacy`
- Google Search Console configured

## Deployment Notes

1. Build with `npm run build`
2. Deploy frontend: `firebase deploy --only hosting`
3. Backend auto-deploys on git push to Render.com

## API Base URL

- Development: Vite proxies `/api` to `localhost:3001`
- Production: `https://easysplit-sn5f.onrender.com`

## Important Files

- `client/index.html` - SEO meta tags, structured data, analytics setup
- `client/src/components/cookie-consent.tsx` - GDPR cookie banner
- `client/src/pages/privacy.tsx` - Privacy policy
- `client/public/sitemap.xml` - Sitemap for search engines
- `firebase.json` - Firebase hosting configuration
- `cloud.md` - Detailed deployment documentation
