# EasySplit

A modern web-based bill-splitting application that allows users to easily split restaurant bills with friends. No login required - just create, share, and split!

**Live Site:** https://easysplit.link/

## Features

- **Instant Bill Splitting** - Create a split session without any signup
- **Real-time Collaboration** - Share a unique code so others can join and see live updates
- **Menu Management** - Create reusable menus with unique codes
- **Flexible Splitting** - Assign items to multiple people with automatic division
- **Service & Tips** - Add service charge and tip percentages
- **History Tracking** - View past splits stored locally
- **Mobile-First Design** - Works great on phones and tablets

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **Radix UI** components with Shadcn/ui patterns
- **React Query** for server state management
- **Wouter** for routing
- **Framer Motion** for animations
- **Firebase Analytics** for usage tracking

### Backend
- **Node.js** with Express
- **SQLite** database (via better-sqlite3)
- **Drizzle ORM** (configured for PostgreSQL migration path)
- **Zod** for validation (shared with frontend)

## Project Structure

```
EasySplitWeb/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Route pages (home, split-bill, results, etc.)
│   │   ├── components/    # React components
│   │   │   └── ui/        # Radix-based UI primitives
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
│   └── index.html         # HTML template with meta tags
│
├── server/                 # Backend Express application
│   ├── index.ts           # Express app setup
│   ├── routes.ts          # API endpoints
│   ├── db.ts              # SQLite database operations
│   └── shared/
│       └── schema.ts      # Database schema definitions
│
├── shared/                 # Shared code between client/server
│   └── schema.ts          # Zod validation schemas
│
├── dist/                   # Build output
│   └── public/            # Frontend build (Firebase hosting)
│
└── configuration files     # package.json, vite.config.ts, etc.
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd EasySplitWeb

# Install dependencies
npm install
```

### Development

```bash
# Start both client and server in development mode
npm run dev

# Or run them separately:
npm run dev:client    # Vite dev server on port 5000
npm run dev:server    # Express server on port 3001
```

### Building for Production

```bash
# Build both client and server
npm run build

# Start production server
npm run start
```

### Type Checking

```bash
npm run check
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/menus` | Create a new menu |
| GET | `/api/menus/:code` | Get menu by code |
| PATCH | `/api/menus/:code` | Update menu |
| DELETE | `/api/menus/:code` | Delete menu |
| POST | `/api/splits` | Create a new bill split |
| GET | `/api/splits/:code` | Get split by code |
| PATCH | `/api/splits/:code` | Update split |
| GET | `/api/menus/:code/splits` | Get all splits for a menu |
| GET | `/api/health` | Health check |

## How It Works

1. **Create a Split** - Start on the home page and click "Split a Bill"
2. **Add People** - Add the names of everyone splitting the bill
3. **Add Items** - Manually add items or load from a saved menu
4. **Assign Items** - Mark who ordered what (items can be split between people)
5. **Set Extras** - Add service charge and tip percentages
6. **Share** - Generate a unique code to share with others for real-time collaboration
7. **Calculate** - View the final breakdown of who owes what

## SEO & Compliance

### Search Engine Optimization
- **Sitemap:** `/sitemap.xml` with all public pages
- **Robots.txt:** Allows all crawlers, references sitemap
- **Structured Data:** JSON-LD schemas for SoftwareApplication, FAQPage, and HowTo
- **Static Fallback:** HTML content in index.html for crawlers before JS loads
- **Meta Tags:** Complete Open Graph and Twitter Card tags
- **Google Search Console:** Configured at https://search.google.com/search-console

### Privacy & GDPR Compliance
- **Cookie Consent:** Banner requires user consent before enabling analytics
- **Privacy Policy:** Available at `/privacy`
- **Analytics:** Firebase Analytics only initializes after user accepts cookies
- **Local Storage:** Split data stored locally, no account required

## Deployment

- **Frontend:** Firebase Hosting at `easysplit.link`
- **Backend:** Render.com at `easysplit-sn5f.onrender.com`

See [cloud.md](./cloud.md) for detailed deployment documentation.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `DATABASE_URL` | PostgreSQL connection (optional) | Uses SQLite |

### Firebase

The Firebase project ID is `easy-split-b7e87`. Configuration is embedded in `client/index.html`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking: `npm run check`
5. Submit a pull request

## License

This project is private.
