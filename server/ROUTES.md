# EasySplit API Routes

Base URL: `https://easysplit-sn5f.onrender.com`

## Health Check Endpoints

| Method | Path | Description | Example URL |
|--------|------|-------------|-------------|
| GET | `/healthz` | Render platform health check endpoint | `https://easysplit-sn5f.onrender.com/healthz` |
| GET | `/api/health` | API health check endpoint | `https://easysplit-sn5f.onrender.com/api/health` |

## Menu Endpoints

| Method | Path | Description | Example URL |
|--------|------|-------------|-------------|
| POST | `/api/menus` | Create a new menu with items | `https://easysplit-sn5f.onrender.com/api/menus` |
| GET | `/api/menus/:code` | Get a menu and its items by code | `https://easysplit-sn5f.onrender.com/api/menus/ABC123` |
| PATCH | `/api/menus/:code` | Update an existing menu by code | `https://easysplit-sn5f.onrender.com/api/menus/ABC123` |
| DELETE | `/api/menus/:code` | Delete a menu by code | `https://easysplit-sn5f.onrender.com/api/menus/ABC123` |

## Bill Split Endpoints

| Method | Path | Description | Example URL |
|--------|------|-------------|-------------|
| POST | `/api/splits` | Create a new bill split | `https://easysplit-sn5f.onrender.com/api/splits` |
| GET | `/api/splits/:code` | Get a bill split by code | `https://easysplit-sn5f.onrender.com/api/splits/XYZ789` |
| PATCH | `/api/splits/:code` | Update an existing bill split by code | `https://easysplit-sn5f.onrender.com/api/splits/XYZ789` |
| GET | `/api/menus/:code/splits` | Get all bill splits associated with a menu | `https://easysplit-sn5f.onrender.com/api/menus/ABC123/splits` |

## Notes

- All menu and split codes are 6-8 characters and case-insensitive (converted to uppercase)
- GET endpoints for codes are rate-limited (100 requests per 10 minutes per IP)
- All endpoints return JSON responses
